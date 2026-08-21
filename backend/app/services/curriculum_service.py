"""Persist curriculum seed and initialize per-user batch/streak rows."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.curriculum import Batch, SignDifficulty, UserBatchProgress, UserStreak, XpLedger
from app.models.user import User
from app.services.curriculum_builder import DEFAULT_SEED_JSON, load_seed_json
from app.services.curriculum_config import STATUS_IN_PROGRESS, STATUS_LOCKED, tier_for_level
from app.services.xp_rules import can_challenge_sign


def apply_seed(db: Session, payload: dict | None = None) -> dict:
    """Upsert sign_difficulty + batches from the committed seed JSON."""
    data = payload if payload is not None else load_seed_json(DEFAULT_SEED_JSON)
    batch_by_sign: dict[str, int] = {}
    for batch in data["batches"]:
        for sign_id in batch["sign_ids"]:
            # First occurrence wins — keeps a sign's primary batch stable when
            # the same sign_id appears in multiple batches (e.g. after manual
            # batch edits where the sign was not removed from the old batch row).
            batch_by_sign.setdefault(sign_id, batch["batch_id"])
        row = db.get(Batch, batch["batch_id"])
        if row is None:
            row = Batch(id=batch["batch_id"])
            db.add(row)
        row.tier = batch["tier"]
        row.tier_label = batch["tier_label"]
        row.level_number = batch["level_number"]
        row.difficulty_rank = batch["difficulty_rank"]
        row.sign_ids = list(batch["sign_ids"])

    for sign in data["signs"]:
        row = db.get(SignDifficulty, sign["sign_id"])
        if row is None:
            row = SignDifficulty(sign_id=sign["sign_id"])
            db.add(row)
        row.f1 = sign["f1"]
        row.accuracy = sign["accuracy"]
        row.support = sign["support"]
        row.difficulty_rank = sign["difficulty_rank"]
        row.gate_passed = sign["gate_passed"]
        row.category = sign["category"]
        row.batch_id = batch_by_sign.get(sign["sign_id"])

    db.flush()
    return data


def ensure_user_curriculum(db: Session, user_id) -> None:
    """Create locked batch rows for the user; unlock batch 1 as in_progress."""
    batches = db.query(Batch).order_by(Batch.level_number.asc()).all()
    if not batches:
        return
    existing = {
        row.batch_id: row
        for row in db.query(UserBatchProgress).filter(UserBatchProgress.user_id == user_id).all()
    }
    for batch in batches:
        row = existing.get(batch.id)
        if row is None:
            status = STATUS_IN_PROGRESS if batch.level_number == 1 else STATUS_LOCKED
            db.add(UserBatchProgress(
                user_id=user_id,
                batch_id=batch.id,
                status=status,
                best_score=0,
                attempts=0,
                practiced_sign_ids=[],
            ))
        elif batch.level_number == 1 and row.status == STATUS_LOCKED:
            row.status = STATUS_IN_PROGRESS

    streak = db.get(UserStreak, user_id)
    if streak is None:
        db.add(UserStreak(
            user_id=user_id,
            last_active_date=None,
            current_streak=0,
            longest_streak=0,
        ))
    db.flush()


def ensure_all_users(db: Session) -> int:
    apply_seed(db)
    users = db.query(User.id).all()
    for (user_id,) in users:
        ensure_user_curriculum(db, user_id)
    db.commit()
    return len(users)


def total_xp(db: Session, user_id) -> int:
    value = db.query(func.coalesce(func.sum(XpLedger.amount), 0)).filter(
        XpLedger.user_id == user_id
    ).scalar()
    return int(value or 0)


def current_level_title(db: Session, user_id) -> tuple[int, str]:
    """Level number = next incomplete batch, or last batch if all complete."""
    rows = (
        db.query(UserBatchProgress, Batch)
        .join(Batch, Batch.id == UserBatchProgress.batch_id)
        .filter(UserBatchProgress.user_id == user_id)
        .order_by(Batch.level_number.asc())
        .all()
    )
    if not rows:
        return 1, tier_for_level(1)[1]
    for progress, batch in rows:
        if progress.status != "completed":
            return batch.level_number, batch.tier_label
    last = rows[-1][1]
    return last.level_number, last.tier_label


def challenge_allowed(db: Session, sign_id: str) -> bool:
    row = db.get(SignDifficulty, sign_id)
    if row is None:
        return False
    return can_challenge_sign(
        gate_passed=bool(row.gate_passed),
        assigned_to_batch=row.batch_id is not None,
    )


def user_streak_snapshot(db: Session, user_id, computed: dict) -> dict:
    """Return persisted streak, creating/updating longest from the computed Progress stats."""
    row = db.get(UserStreak, user_id)
    if row is None:
        ensure_user_curriculum(db, user_id)
        row = db.get(UserStreak, user_id)
    if row is None:
        return computed
    row.current_streak = computed["current_streak"]
    row.longest_streak = max(row.longest_streak, computed["longest_streak"], computed["current_streak"])
    if computed["practiced_today"]:
        row.last_active_date = datetime.now(timezone.utc).date()
    db.flush()
    return {
        "current_streak": row.current_streak,
        "longest_streak": row.longest_streak,
        "practiced_today": computed["practiced_today"],
    }
