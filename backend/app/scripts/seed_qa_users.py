"""Seed two dedicated QA test users for manual Postman testing.

    PYTHONPATH=. python -m app.scripts.seed_qa_users

Creates User A and User B with known, already-verified credentials so a
Postman session doesn't need to run the OTP signup flow to get an
authenticated user. Idempotent: skips a user whose email already exists.
Does not touch any other row in the users table.

Domain is `.dev`, not `.test`: `.test` is an RFC 2606 special-use TLD and
pydantic's `EmailStr` (email-validator) rejects it outright at login/signup,
so a `.test` address can be inserted directly via this script but can never
actually log in through the API.
"""

from __future__ import annotations

from datetime import datetime

from loguru import logger

from app.database import SessionLocal
from app.models.user import User
from app.routers.auth import hash_password

QA_USERS = [
    dict(
        email="qa.usera@mudralearn.dev",
        password="QaTest2026!Alpha",
        first_name="Alpha",
        last_name="Tester",
        username="qa_user_a",
    ),
    dict(
        email="qa.userb@mudralearn.dev",
        password="QaTest2026!Beta",
        first_name="Beta",
        last_name="Tester",
        username="qa_user_b",
    ),
]


def main() -> None:
    db = SessionLocal()
    try:
        for spec in QA_USERS:
            existing = db.query(User).filter(User.email == spec["email"]).first()
            if existing:
                logger.info("QA user {} already exists, skipping", spec["email"])
                continue
            user = User(
                email=spec["email"],
                password_hash=hash_password(spec["password"]),
                first_name=spec["first_name"],
                last_name=spec["last_name"],
                username=spec["username"],
                auth_provider="email",
                email_verified_at=datetime.utcnow(),
                signup_step="completed",
            )
            db.add(user)
            db.commit()
            logger.info("Created QA user {}", spec["email"])
    finally:
        db.close()


if __name__ == "__main__":
    main()
