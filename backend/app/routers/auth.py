from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, ConfigDict, EmailStr
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, EmailOTP, AuthSession
from app.rate_limit import limiter
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests
import os
import bcrypt
import hashlib
import hmac
import secrets
import re

router = APIRouter()

# ─── Secrets (module load — fail fast if missing) ─────────────────────────────────
SECRET_KEY = os.environ['SECRET_KEY']

OTP_PEPPER = os.getenv('OTP_PEPPER')
if not OTP_PEPPER:
    raise ValueError('OTP_PEPPER env var not set')

# Not fail-fast like the two secrets above: Google sign-in is an optional
# feature (a dev/CI environment can run the rest of the app without a Cloud
# Console client ID configured yet). Absence is handled per-request in
# google_callback() instead of crashing the whole app at import time.
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

# ─── Constants ────────────────────────────────────────────────────────────────────
# Session-length access token. There is no /refresh route (no rotation or
# revocation store by design), so this doubles as the whole session lifetime —
# short enough to bound a stolen token, long enough to not log users out mid-use.
# Not a secret, so a default is fine here (unlike SECRET_KEY/OTP_PEPPER above).
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 240))
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

class UpdateProfileRequest(BaseModel):
    """Name-only edit. extra='forbid' rejects an email/username field outright
    (422) rather than silently ignoring it — those two fields are never
    editable through this endpoint."""
    model_config = ConfigDict(extra='forbid')
    first_name: str
    last_name: str

class DeleteAccountRequest(BaseModel):
    """Exactly one of these is meaningful, chosen server-side by whether
    current_user has a password_hash — see delete_me(). Both optional so
    either shape of client payload parses; the unused one is simply
    ignored."""
    password: str | None = None
    confirmation: str | None = None

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
    return hashlib.sha256(f'{code}{OTP_PEPPER}'.encode()).hexdigest()

def generate_otp() -> str:
    return f'{secrets.randbelow(1000000):06d}'

def hash_token(raw: str) -> str:
    """SHA-256 with the app secret as pepper — used for signup-session tokens."""
    return hashlib.sha256(f'{raw}{SECRET_KEY}'.encode()).hexdigest()

def make_access_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        'type': 'access',
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload.get('type') != 'access':
            return None
        return payload.get('sub')
    except JWTError:
        return None

def set_auth_cookies(response: JSONResponse, access_token: str):
    is_dev = os.getenv('ENV', 'development') != 'production'
    response.set_cookie(
        key='access_token', value=access_token, httponly=True,
        secure=not is_dev, samesite='lax', max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, path='/',
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
        # Derived from password_hash, never the hash itself. This is the same
        # fact delete_me() branches its re-auth method on — exposing it lets
        # the frontend branch on that fact directly instead of a proxy for it
        # (auth_provider, which only records how the account originated and
        # can diverge from whether it actually has a password — e.g. a
        # Google-linked account that already had one, see google_callback()).
        'has_password': user.password_hash is not None,
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
@limiter.limit('10/minute')
def complete_signup(request: Request, req: CompleteSignupRequest, db: Session = Depends(get_db)):
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
    # The pre-checks above narrow the race window but don't close it; the DB
    # unique constraints on email/username are the real guard. Two concurrent
    # signups claiming the same username both pass the check, then one commit
    # loses — surface that as a clean 409 rather than a 500.
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Username is already taken')
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
@limiter.limit('30/minute')
def username_available(request: Request, u: str = '', db: Session = Depends(get_db)):
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
    name) before choosing a username. One-time — once onboarding is complete
    the username is locked; this is not a general username-change endpoint.
    """
    if current_user.signup_step == 'completed':
        raise HTTPException(409, 'Username has already been set and cannot be changed.')

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


# ─── Google (ID-token flow — Google Identity Services) ───────────────────────────

@router.post('/google/callback')
@limiter.limit('20/minute')
def google_callback(request: Request, req: GoogleCallbackRequest, db: Session = Depends(get_db)):
    """Verify a Google ID token and log in / link / create the account.

    ID-token flow only (Google Identity Services) — the frontend never sends
    an authorization code, so there is no exchange step and no client secret
    here. Google's own client library does the signature/issuer/expiry/
    audience verification; on any failure we return a generic 401 rather than
    the library's raw error text, which can include internal detail.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(503, 'Google sign-in is not configured.')

    try:
        idinfo = google_id_token.verify_oauth2_token(
            req.id_token, google_auth_requests.Request(), GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(401, 'Invalid or expired Google sign-in. Please try again.')

    sub = idinfo['sub']
    email = (idinfo.get('email') or '').lower()
    email_verified = bool(idinfo.get('email_verified'))
    given_name = idinfo.get('given_name')
    family_name = idinfo.get('family_name')

    # 1) Returning Google user — google_id is the stable identifier.
    user = db.query(User).filter(User.google_id == sub).first()
    if user:
        return auth_response(user)

    # 2) No google_id match — check for an existing account by email (account
    # linking, per the locked decision: auto-link rather than reject).
    user = db.query(User).filter(User.email == email).first()
    if user:
        if user.google_id and user.google_id != sub:
            # Shouldn't happen given the unique constraint on google_id (that
            # would mean two different Google accounts sharing one email
            # address), but handle gracefully rather than 500 if it ever does.
            raise HTTPException(409, 'This email is already linked to a different Google account.')
        if not user.google_id:
            # Link: attach google_id to the existing row. auth_provider and
            # password_hash are left untouched — auth_provider stays
            # descriptive of how the account originated, it does not gate
            # anything (see delete_me()'s password_hash-based re-auth check).
            user.google_id = sub
            if email_verified and not user.email_verified_at:
                user.email_verified_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return auth_response(user)

    # 3) No match by google_id or email — new Google-originated account.
    # No username yet: signup_step is left at its default ('email'), which
    # onboarding_username() checks to force the username step before the
    # account is considered complete.
    user = User(
        email=email,
        auth_provider='google',
        google_id=sub,
        email_verified_at=datetime.utcnow() if email_verified else None,
        first_name=given_name,
        last_name=family_name,
        username=None,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Race: another request created a row for this email/google_id between
        # our lookups above and this commit.
        db.rollback()
        raise HTTPException(409, 'An account with this email already exists. Please sign in.')
    db.refresh(user)

    return auth_response(user, is_new=True)


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


@router.patch('/me')
@limiter.limit('20/minute')
def update_me(
    request: Request,
    req: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit first/last name only. email and username are immutable here by
    construction — UpdateProfileRequest has no such fields, and extra='forbid'
    turns an attempt to send either into a 422 rather than a silent no-op."""
    first_name = req.first_name.strip()
    last_name = req.last_name.strip()
    if not first_name or not last_name:
        raise HTTPException(400, 'First and last name are required')

    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {'user': user_public(current_user)}


@router.delete('/me', status_code=204)
@limiter.limit('5/minute')
def delete_me(
    request: Request,
    req: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hard-deletes the user row; the 6 user_id FKs (progress, mastery_scores,
    user_batch_progress, xp_ledger, user_streak, auth_sessions) are cascaded
    or nulled at the DB level by migration 0005_user_delete_cascade.

    Re-auth branch is decided from whether current_user has a password_hash
    (server state), never from which field the client happened to send, and
    never from auth_provider — auth_provider only records how the account
    originated and does not gate re-auth method. A Google sign-in auto-linked
    to an existing password account keeps its password_hash (see
    google_callback()), so it re-authenticates with that password like any
    other account; only an account with no password at all (password_hash is
    None — today, always a Google-created account that never set one) uses
    the username-confirmation phrase. Branching on password_hash instead of
    auth_provider means a Google-onboarded account with no password_hash
    can't be deleted by anyone who guesses to send a `password` field instead
    of `confirmation`, and stays correct if a "set a password" feature is
    ever added for Google accounts.
    """
    if current_user.password_hash is None:
        expected = (current_user.username or '').strip().lower()
        if not req.confirmation or req.confirmation.strip().lower() != expected:
            raise HTTPException(401, 'Confirmation does not match.')
    else:
        if not req.password or not verify_password(req.password, current_user.password_hash):
            raise HTTPException(401, 'Incorrect password.')

    db.delete(current_user)
    db.commit()

    response = Response(status_code=204)
    response.delete_cookie('access_token', path='/')
    return response
