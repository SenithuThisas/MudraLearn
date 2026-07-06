from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, EmailOTP
import os
import hashlib
import secrets
import re

router = APIRouter()

# ─── Constants ────────────────────────────────────────────────────────────────────
ACCESS_TOKEN_EXPIRE = 15    # minutes
REFRESH_TOKEN_EXPIRE = 30   # days
OTP_EXPIRE = 10             # minutes
OTP_MAX_ATTEMPTS = 5
OTP_RATE_LIMIT_PER_EMAIL = 5    # per hour
RESERVED_USERNAMES = {'admin', 'support', 'mudralearn', 'root', 'api', 'help', 'moderator', 'system', 'test'}

# ─── Models ────────────────────────────────────────────────────────────────────────

class GoogleCallbackRequest(BaseModel):
    id_token: str

class RequestOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class OnboardingProfileRequest(BaseModel):
    first_name: str
    last_name: str

class OnboardingUsernameRequest(BaseModel):
    username: str

class RefreshRequest(BaseModel):
    refresh_token: str

# ─── Helpers ───────────────────────────────────────────────────────────────────────

def hash_otp(code: str) -> str:
    pepper = os.getenv('OTP_PEPPER', 'mudralearn-otp-pepper')
    return hashlib.sha256(f'{code}{pepper}'.encode()).hexdigest()

def generate_otp() -> str:
    return f'{secrets.randbelow(1000000):06d}'

def make_access_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE),
        'type': 'access',
    }
    return jwt.encode(payload, os.getenv('SECRET_KEY'), algorithm='HS256')

def make_refresh_token(user_id: str) -> str:
    raw = secrets.token_urlsafe(48)
    payload = {
        'sub': user_id,
        'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE),
        'type': 'refresh',
        'jti': raw,
    }
    token = jwt.encode(payload, os.getenv('SECRET_KEY'), algorithm='HS256')
    return token, raw  # raw is stored hashed server-side

def verify_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        if payload.get('type') != 'access':
            return None
        return payload.get('sub')
    except JWTError:
        return None

def set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str):
    is_dev = os.getenv('ENV', 'development') != 'production'
    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=not is_dev,          # False in dev (HTTP), True in prod (HTTPS)
        samesite='lax',             # 'lax' works cross-port in dev; use 'strict' in prod
        max_age=ACCESS_TOKEN_EXPIRE * 60,
        path='/',
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=not is_dev,
        samesite='lax',
        max_age=REFRESH_TOKEN_EXPIRE * 24 * 3600,
        path='/',
    )

def validate_username_format(u: str) -> str | None:
    if len(u) < 3 or len(u) > 20:
        return 'Username must be 3–20 characters'
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', u):
        return 'Username must start with a letter and contain only letters, numbers, and underscores'
    if u.lower() in RESERVED_USERNAMES:
        return 'This username is reserved'
    return None

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


# ─── Endpoints ─────────────────────────────────────────────────────────────────────

@router.post('/google/callback')
def google_callback(req: GoogleCallbackRequest, db: Session = Depends(get_db)):
    """Verify Google ID token and log in / sign up the user."""
    try:
        payload = jwt.decode(
            req.id_token,
            os.getenv('GOOGLE_CLIENT_SECRET', ''),
            algorithms=['RS256'],
            audience=os.getenv('GOOGLE_CLIENT_ID'),
        )
    except JWTError:
        raise HTTPException(401, 'Invalid Google ID token')

    google_id = payload.get('sub')
    email = payload.get('email', '').lower()
    first_name = payload.get('given_name', '')
    last_name = payload.get('family_name', '')

    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user:
        if not user.google_id:
            user.google_id = google_id
        if not user.email_verified_at:
            user.email_verified_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
    else:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            auth_provider='google',
            google_id=google_id,
            email_verified_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = make_access_token(str(user.id))
    refresh_token, raw_jti = make_refresh_token(str(user.id))

    response = JSONResponse({
        'user': {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'auth_provider': user.auth_provider,
            'onboarding_complete': bool(user.username and user.first_name),
        },
        'access_token': access_token,
        'refresh_token': refresh_token,
    })
    set_auth_cookies(response, access_token, refresh_token)
    return response


@router.post('/email/request-otp')
def request_otp(req: RequestOTPRequest, db: Session = Depends(get_db)):
    """Generate and send a 6-digit OTP to the given email."""
    email = req.email.lower()

    # Rate limit: max 5 per email per hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = db.query(EmailOTP).filter(
        EmailOTP.email == email,
        EmailOTP.created_at >= one_hour_ago,
    ).count()
    if recent_count >= OTP_RATE_LIMIT_PER_EMAIL:
        raise HTTPException(429, 'Too many OTP requests. Please try again later.')

    code = generate_otp()
    hashed = hash_otp(code)

    otp = EmailOTP(
        email=email,
        otp_hash=hashed,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_EXPIRE),
    )
    db.add(otp)
    db.commit()

    # In production: send via email provider (SES / Postmark / Resend)
    # For now, log the code so dev can test
    print(f'[DEV OTP] Email: {email} | Code: {code} | Expires: {otp.expires_at}')

    return {'message': 'OTP sent to email', 'expires_in_minutes': OTP_EXPIRE}


@router.post('/email/verify-otp')
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify a 6-digit OTP and issue tokens."""
    email = req.email.lower()

    if not req.otp or not req.otp.isdigit() or len(req.otp) != 6:
        raise HTTPException(400, 'Invalid OTP format')

    # Find valid (non-expired) OTPs for this email, newest first
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
        if row.otp_hash == hashed_input:
            valid_otp = row
            break

    if not valid_otp:
        # Increment attempts on the most recent OTP
        if otp_rows:
            otp_rows[0].attempts += 1
            db.commit()
        raise HTTPException(400, 'Invalid OTP. Please try again.')

    # Success — delete the OTP row and create session
    try:
        db.delete(valid_otp)

        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        is_new = False
        if not user:
            user = User(
                email=email,
                auth_provider='email',
                email_verified_at=datetime.utcnow(),
            )
            db.add(user)
            is_new = True
        else:
            if not user.email_verified_at:
                user.email_verified_at = datetime.utcnow()
            user.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(user)

        access_token = make_access_token(str(user.id))
        refresh_token, raw_jti = make_refresh_token(str(user.id))

        response = JSONResponse({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
                'auth_provider': user.auth_provider,
                'onboarding_complete': bool(user.username and user.first_name),
                'is_new': is_new,
            },
            'access_token': access_token,
            'refresh_token': refresh_token,
        })
        set_auth_cookies(response, access_token, refresh_token)
        return response

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f'Login failed: {str(e)}')


@router.get('/username-available')
def username_available(u: str = '', db: Session = Depends(get_db)):
    """Check if a username is available."""
    error = validate_username_format(u)
    if error:
        return {'available': False, 'error': error}

    exists = db.query(User).filter(User.username.ilike(u)).first()
    return {'available': not bool(exists), 'error': None if not exists else 'Username is already taken'}


@router.post('/onboarding/profile')
def onboarding_profile(req: OnboardingProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Save the user's first and last name."""
    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(400, 'First and last name are required')

    current_user.first_name = req.first_name.strip()
    current_user.last_name = req.last_name.strip()
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        'user': {
            'id': str(current_user.id),
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'username': current_user.username,
            'auth_provider': current_user.auth_provider,
            'onboarding_complete': bool(current_user.username and current_user.first_name),
        }
    }


@router.post('/onboarding/username')
def onboarding_username(req: OnboardingUsernameRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Set the user's username."""
    username = req.username.strip().lower()

    error = validate_username_format(username)
    if error:
        raise HTTPException(400, error)

    # Check availability (race-condition-safe via DB unique constraint)
    exists = db.query(User).filter(User.username.ilike(username)).first()
    if exists:
        raise HTTPException(409, 'Username is already taken')

    current_user.username = username
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return {
        'user': {
            'id': str(current_user.id),
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'username': current_user.username,
            'auth_provider': current_user.auth_provider,
            'onboarding_complete': True,
        }
    }


@router.post('/refresh')
def refresh_token(req: RefreshRequest, db: Session = Depends(get_db)):
    """Issue a new access token using a valid refresh token."""
    try:
        payload = jwt.decode(req.refresh_token, os.getenv('SECRET_KEY'), algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            raise HTTPException(401, 'Invalid refresh token')
        user_id = payload.get('sub')
    except JWTError:
        raise HTTPException(401, 'Invalid refresh token')

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, 'User not found')

    new_access = make_access_token(str(user.id))
    new_refresh, _ = make_refresh_token(str(user.id))

    response = JSONResponse({
        'access_token': new_access,
        'refresh_token': new_refresh,
    })
    set_auth_cookies(response, new_access, new_refresh)
    return response


@router.post('/logout')
def logout():
    """Clear auth cookies."""
    response = JSONResponse({'message': 'Logged out'})
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')
    return response


@router.get('/me')
def me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return {
        'user': {
            'id': str(current_user.id),
            'email': current_user.email,
            'first_name': current_user.first_name,
            'last_name': current_user.last_name,
            'username': current_user.username,
            'auth_provider': current_user.auth_provider,
            'onboarding_complete': bool(current_user.username and current_user.first_name),
        }
    }
