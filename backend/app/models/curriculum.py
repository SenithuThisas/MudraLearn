"""Curriculum / XP / streak tables that sit on top of Progress — they do not replace it."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID

from app.models.user import Base


class SignDifficulty(Base):
    __tablename__ = "sign_difficulty"

    sign_id = Column(String, primary_key=True)
    f1 = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=False)
    support = Column(Float, nullable=False, default=0)
    difficulty_rank = Column(Integer, nullable=False)
    gate_passed = Column(Boolean, nullable=False, default=False)
    category = Column(String, nullable=False, default="Uncategorized")
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True)  # equals level_number
    tier = Column(Integer, nullable=False)
    tier_label = Column(String, nullable=False)
    level_number = Column(Integer, unique=True, nullable=False)
    difficulty_rank = Column(Integer, nullable=False)
    sign_ids = Column(ARRAY(String), nullable=False)


class UserBatchProgress(Base):
    __tablename__ = "user_batch_progress"
    __table_args__ = (UniqueConstraint("user_id", "batch_id", name="uq_user_batch_progress"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    status = Column(String, nullable=False, default="locked")
    best_score = Column(Integer, nullable=False, default=0)
    attempts = Column(Integer, nullable=False, default=0)
    practiced_sign_ids = Column(JSONB, nullable=False, default=list)
    challenge_state = Column(JSONB, nullable=False, default=dict)


class XpLedger(Base):
    __tablename__ = "xp_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    sign_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class UserStreak(Base):
    __tablename__ = "user_streak"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    last_active_date = Column(Date, nullable=True)
    current_streak = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
