# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.models.user import Base


class Progress(Base):
    """Raw log of every practice attempt — grows indefinitely."""
    __tablename__ = 'progress'

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sign_id     = Column(String, nullable=False)   # e.g. 'Ayubowan'
    category    = Column(String, nullable=False)   # e.g. 'Greetings'
    confidence  = Column(Float, nullable=False)    # 0.0 – 1.0
    correct     = Column(Boolean, nullable=False)  # True if model matched target_sign AND confidence >= 0.60
    response_ms = Column(Integer, default=0)       # time the user took to perform the sign
    timestamp   = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MasteryScore(Base):
    """
    One row per (user, sign) — updated in place after every attempt.
    The Adaptive Engine reads this table to decide what to show next.
    Keeping this separate from Progress means we never need to aggregate
    thousands of raw rows at query time.
    """
    __tablename__ = 'mastery_scores'

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    sign_id       = Column(String, nullable=False)
    score         = Column(Float, default=0.0)      # 0.0 – 1.0  EWMA mastery
    attempts      = Column(Integer, default=0)
    last_seen     = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tier_unlocked = Column(Integer, default=1)      # difficulty tier 1–5