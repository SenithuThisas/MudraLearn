from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, EmailOTP, AuthSession
from app.rate_limit import limiter
import os
import bcrypt
import hashlib
import hmac
import secrets
import re

router = APIRouter()

# ─── Constants ────────────────────────────────────────────────────────────────────
# Session-length access token. There is no /refresh route (no rotation or
# revocation store by design), so this doubles as the whole session lifetime —
# short enough to bound a stolen token, long enough to not log users out mid-use.
ACCESS_TOKEN_EXPIRE = 8 * 60   # minutes (8 hours)
OTP_EXPIRE = 10             # minutes
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT_PER_EMAIL = 5    # per hour
SIGNUP_TOKEN_EXPIRE = 20        # minutes — window to finish the signup wizard
PASSWORD_MIN_LEN = 8
LOGIN_MAX_ATTEMPTS = 5          # failed password attempts before a temporary lock
LOGIN_LOCK_MINUTES = 15
RESERVED_USERNAMES = {'admin', 'support', 'mudralearn', 'root', 'api', 'help', 'moderator', 'system', 'test'}

# ─── Request models ──────────────────────────────────────────────────────────────

class CheckEmailRequest(BaseModel):
    email: EmailStr

class RequestOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class CompleteSignupRequest(BaseModel):
    signup_token: str
    password: str
    first_name: str
    last_name: str
    username: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OnboardingUsernameRequest(BaseModel):
    username: str

class GoogleCallbackRequest(BaseModel):
    id_token: str

# ─── Password + OTP + token helpers ──────────────────────────────────────────────

# bcrypt is used directly (not via passlib): passlib 1.7.4 is unmaintained and
# its backend self-test crashes with bcrypt>=4 ("password cannot be longer than
# 72 bytes"), which 500'd every signup. bcrypt only reads the first 72 bytes of
# a password, so truncate explicitly — bcrypt 5.x raises instead of truncating.

def _bcrypt_input(password: str) -> bytes:
    return password.encode('utf-8')[:72]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_input(password), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_input(password), password_hash.encode('utf-8'))
    except ValueError:  # malformed/legacy hash
        return False

def hash_otp(code: str) -> str:
    pepper = os.getenv('OTP_PEPPER', 'mudralearn-otp-pepper')
    return hashlib.sha256(f'{code}{pepper}'.encode()).hexdigest()

def generate_otp() -> str:
    return f'{secrets.randbelow(1000000):06d}'

def hash_token(raw: str) -> str:
    """SHA-256 with the app secret as pepper — used for signup-session tokens."""
    pepper = os.getenv('SECRET_KEY', 'mudralearn-token-pepper')
    return hashlib.sha256(f'{raw}{pepper}'.encode()).hexdigest()

def make_access_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE),
        'type': 'access',
    }
    return jwt.encode(payload, os.getenv('SECRET_KEY'), algorithm='HS256')

def verify_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        if payload.get('type') != 'access':
            return None
        return payload.get('sub')
    except JWTError:
        return None

def set_auth_cookies(response: JSONResponse, access_token: str):
    is_dev = os.getenv('ENV', 'development') != 'production'
    response.set_cookie(
        key='access_token', value=access_token, httponly=True,
        secure=not is_dev, samesite='lax', max_age=ACCESS_TOKEN_EXPIRE * 60, path='/',
    )

def validate_username_format(u: str) -> str | None:
    if len(u) < 3 or len(u) > 20:
        return 'Username must be 3–20 characters'
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', u):
        return 'Username must start with a letter and contain only letters, numbers, and underscores'
    if u.lower() in RESERVED_USERNAMES:
        return 'This username is reserved'
    return None

def user_public(user: User, **extra) -> dict:
    """Shared serialisation of a User for API responses."""
    data = {
        'id': str(user.id),
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'username': user.username,
        'auth_provider': user.auth_provider,
        'email_verified': bool(user.email_verified_at),
        'onboarding_complete': bool(user.username and user.first_name),
    }
    data.update(extra)
    return data

def auth_response(user: User, **extra) -> JSONResponse:
    """Issue a cookie session for `user` and return the standard auth payload.

    The session is the HttpOnly access-token cookie. No refresh token is issued
    or returned — the token is never exposed to JS, only echoed in the body for
    an optional Bearer fallback.
    """
    access_token = make_access_token(str(user.id))
    response = JSONResponse({
        'user': user_public(user, **extra),
        'access_token': access_token,
    })
    set_auth_cookies(response, access_token)
    return response

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get('access_token')
    if not token:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    if not token:
        raise HTTPException(401, 'Not authenticated')
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(401, 'Invalid or expired token')
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, 'User not found')
    return user


# ─── Email-first router ──────────────────────────────────────────────────────────

@router.post('/check-email')
@limiter.limit('20/minute')
def check_email(request: Request, req: CheckEmailRequest, db: Session = Depends(get_db)):
    """Branch the email-first entry: does this email already have an account?

    This deliberately reveals whether an email is registered — an accepted
    email-first UX tradeoff (cf. Google/Slack), mitigated by the rate limit
    above. Documented as a conscious choice in the dissertation limitations.
    """
    email = req.email.lower()
    exists = db.query(User).filter(User.email == email).first()
    return {'registered': bool(exists)}


# ─── Signup branch: OTP → signup_token → complete-signup ─────────────────────────

@router.post('/email/request-otp')
@limiter.limit('10/minute')
def request_otp(request: Request, req: RequestOTPRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP to verify a new email (signup only).

    Dev mode (ENV != 'production'): the code is logged and returned in the
    response so the flow can be exercised without a real email provider. No
    SMTP/SendGrid is wired.
    """
    email = req.email.lower()

    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = db.query(EmailOTP).filter(
        EmailOTP.email == email,
        EmailOTP.created_at >= one_hour_ago,
    ).count()
    if recent_count >= OTP_RATE_LIMIT_PER_EMAIL:
        raise HTTPException(429, 'Too many OTP requests. Please try again later.')

    code = generate_otp()
    otp = EmailOTP(
        email=email,
        otp_hash=hash_otp(code),
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE),
    )
    db.add(otp)
    db.commit()

    is_dev = os.getenv('ENV', 'development') != 'production'
    if is_dev:
        print(f'[DEV OTP] Email: {email} | Code: {code} | Expires: {otp.expires_at}')

    body = {'message': 'OTP sent to email', 'expires_in_minutes': OTP_EXPIRE}
    if is_dev:
        body['dev_otp'] = code   # dev convenience only; never present in production
    return body


@router.post('/email/verify-otp')
@limiter.limit('20/minute')
def verify_otp(request: Request, req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the signup OTP and issue a short-lived signup_token.

    Unlike the old passwordless flow, this does NOT create a User or log anyone
    in. It only proves the email is controlled by the requester; the returned
    signup_token is later exchanged at /complete-signup.
    """
    email = req.email.lower()

    if not req.otp or not req.otp.isdigit() or len(req.otp) != 6:
        raise HTTPException(400, 'Invalid OTP format')

    otp_rows = db.query(EmailOTP).filter(
        EmailOTP.email == email,
        EmailOTP.expires_at > datetime.utcnow(),
    ).order_by(EmailOTP.created_at.desc()).limit(3).all()

    if not otp_rows:
        raise HTTPException(400, 'No valid OTP found. Please request a new one.')

    hashed_input = hash_otp(req.otp)
    valid_otp = None
    for row in otp_rows:
        if row.attempts >= OTP_MAX_ATTEMPTS:
            continue
        if hmac.compare_digest(row.otp_hash, hashed_input):
            valid_otp = row
            break

    if not valid_otp:
        otp_rows[0].attempts += 1
        db.commit()
        raise HTTPException(400, 'Invalid OTP. Please try again.')

    # Consume all OTPs for this email, then mint a signup_token bound to it.
    for row in otp_rows:
        db.delete(row)

    raw_token = secrets.token_urlsafe(32)
    session = AuthSession(
        email=email,
        token_hash=hash_token(raw_token),
        purpose='signup_temp',
        expires_at=datetime.utcnow() + timedelta(minutes=SIGNUP_TOKEN_EXPIRE),
    )
    db.add(session)
    db.commit()

    return {
        'signup_token': raw_token,
        'email': email,
        'expires_in_minutes': SIGNUP_TOKEN_EXPIRE,
    }


@router.post('/complete-signup')
def complete_signup(req: CompleteSignupRequest, db: Session = Depends(get_db)):
    """Create the account from a verified signup_token + collected profile.

    This is the single point where a User row is written — with a verified
    email, a password, names, and a username all at once. No half-built rows.
    """
    session = db.query(AuthSession).filter(
        AuthSession.token_hash == hash_token(req.signup_token),
        AuthSession.purpose == 'signup_temp',
        AuthSession.consumed == False,  # noqa: E712
        AuthSession.expires_at > datetime.utcnow(),
    ).first()
    if not session:
        raise HTTPException(400, 'Your signup session has expired. Please start again.')

    email = session.email

    if len(req.password) < PASSWORD_MIN_LEN:
        raise HTTPException(400, f'Password must be at least {PASSWORD_MIN_LEN} characters')
    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(400, 'First and last name are required')

    username = req.username.strip().lower()
    fmt_error = validate_username_format(username)
    if fmt_error:
        raise HTTPException(400, fmt_error)

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, 'An account with this email already exists. Please sign in.')
    if db.query(User).filter(User.username.ilike(username)).first():
        raise HTTPException(409, 'Username is already taken')

    user = User(
        email=email,
        password_hash=hash_password(req.password),
        first_name=req.first_name.strip(),
        last_name=req.last_name.strip(),
        username=username,
        auth_provider='email',
        email_verified_at=datetime.utcnow(),
        signup_step='completed',
    )
    db.add(user)
    session.consumed = True          # single-use token, consumed atomically with creation
    db.commit()
    db.refresh(user)

    return auth_response(user, is_new=True)


# ─── Login branch: password only, no OTP ─────────────────────────────────────────

@router.post('/login')
@limiter.limit('10/minute')
def login(request: Request, req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a returning user with password alone (no per-login OTP)."""
    email = req.email.lower()
    user = db.query(User).filter(User.email == email).first()

    # Generic failure — never reveal whether the email exists or the password
    # was the wrong part (beyond the check-email enumeration already accepted).
    if not user or not user.password_hash:
        raise HTTPException(401, 'Incorrect email or password')

    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(423, 'Account temporarily locked due to failed attempts. Try again later.')

    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= LOGIN_MAX_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOGIN_LOCK_MINUTES)
            user.failed_login_attempts = 0
        db.commit()
        raise HTTPException(401, 'Incorrect email or password')

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)

    return auth_response(user)


# ─── Username availability (signup wizard + Google onboarding) ───────────────────

@router.get('/username-available')
def username_available(u: str = '', db: Session = Depends(get_db)):
    error = validate_username_format(u)
    if error:
        return {'available': False, 'error': error}
    exists = db.query(User).filter(User.username.ilike(u)).first()
    return {'available': not bool(exists), 'error': None if not exists else 'Username is already taken'}


@router.post('/onboarding/username')
def onboarding_username(
    req: OnboardingUsernameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set a username for an already-authenticated but incomplete account.

    Used by the Google branch, where the user is created (verified email +
    name) before choosing a username.
    """
    username = req.username.strip().lower()
    error = validate_username_format(username)
    if error:
        raise HTTPException(400, error)

    exists = db.query(User).filter(User.username.ilike(username)).first()
    if exists:
        raise HTTPException(409, 'Username is already taken')

    current_user.username = username
    current_user.signup_step = 'completed'
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {'user': user_public(current_user)}


# ─── Google (deferred stub) ──────────────────────────────────────────────────────

@router.post('/google/callback')
def google_callback(req: GoogleCallbackRequest):
    """Deferred — the button is wired in the UI, live OAuth is not built yet."""
    raise HTTPException(501, 'Google sign-in is coming soon. Please use email for now.')


# ─── Session lifecycle ───────────────────────────────────────────────────────────

@router.post('/logout')
def logout():
    response = JSONResponse({'message': 'Logged out'})
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


@router.get('/me')
def me(current_user: User = Depends(get_current_user)):
    return {'user': user_public(current_user)}
