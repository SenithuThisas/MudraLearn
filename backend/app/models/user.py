# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=True)
    role = Column(String, default='user')
    auth_provider = Column(String, default='email')
    google_id = Column(String, unique=True, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    # Password auth
    password_hash = Column(String, nullable=True)            # NULL until password is set
    signup_step = Column(String, default='email')            # email | otp_verified | completed
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmailOTP(Base):
    __tablename__ = 'email_otps'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False)
    otp_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuthSession(Base):
    """Short-lived, single-purpose temp tokens issued after OTP verification.

    A 'signup_temp' token proves an email passed OTP verification but has no
    User row yet (we never persist a half-built User with a null password), so
    user_id is nullable and the email is carried directly on the row instead.
    """
    __tablename__ = 'auth_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    email = Column(String, nullable=True)           # set for signup_temp (no user yet)
    token_hash = Column(String, nullable=False)
    purpose = Column(String, nullable=False)        # 'signup_temp' | 'login_temp'
    consumed = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
