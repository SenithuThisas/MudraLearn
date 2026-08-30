"""
mastery_engine.py
-----------------
Maintains the MasteryScore table — one row per (user, sign).

Algorithm: Exponentially Weighted Moving Average (EWMA)
    new_score = ALPHA * attempt_score + (1 - ALPHA) * old_score

ALPHA = 0.3 means:
  - The most recent attempt counts for 30 % of the new score.
  - Older attempts decay but don't vanish immediately.
  - A single bad attempt after sustained good performance won't crash the score.

Wrong-guess penalty: attempt_score = confidence * 0.3 (not 0)
  A user who got 70 % confidence on the wrong sign still showed partial
  hand-shape skill. Zeroing would swing the score too violently.
"""

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.models.progress import MasteryScore
from datetime import datetime

ALPHA = 0.3   # EWMA weight for the newest attempt
TIER_SCORE_THRESHOLD  = 0.80  # mastery score needed to unlock the next tier
TIER_ATTEMPT_THRESHOLD = 5    # minimum attempts before tier can advance


def update_mastery(
    db: Session,
    user_id: int,
    sign_id: str,
    confidence: float,
    correct: bool,
) -> MasteryScore:
    """
    Upsert the MasteryScore row for (user_id, sign_id).
    Returns the updated row.
    """
    row = (
        db.query(MasteryScore)
        .filter(MasteryScore.user_id == user_id, MasteryScore.sign_id == sign_id)
        .first()
    )

    # Penalise wrong guesses: retain some credit for hand-shape similarity
    attempt_score = confidence if correct else confidence * 0.3

    if row is None:
        row = MasteryScore(
            user_id=user_id,
            sign_id=sign_id,
            score=attempt_score,
            attempts=1,
            last_seen=datetime.utcnow(),
        )
        db.add(row)
    else:
        row.score     = ALPHA * attempt_score + (1 - ALPHA) * row.score
        row.attempts += 1
        row.last_seen = datetime.utcnow()

        # Unlock next difficulty tier when performance is consistently strong
        if row.score >= TIER_SCORE_THRESHOLD and row.attempts >= TIER_ATTEMPT_THRESHOLD:
            row.tier_unlocked = min(row.tier_unlocked + 1, 5)

    # No commit here — caller (predict_sign) commits once after both the
    # Progress row and this MasteryScore upsert succeed, so they land atomically.
    db.flush()
    db.refresh(row)
    return row


def get_mastery_summary(db: Session, user_id: int) -> list[dict]:
    """Return every mastery row for a user, sorted by score descending."""
    rows = (
        db.query(MasteryScore)
        .filter(MasteryScore.user_id == user_id)
        .order_by(MasteryScore.score.desc())
        .all()
    )
    return [
        {
            "sign_id":  r.sign_id,
            "score":    round(r.score, 4),
            "attempts": r.attempts,
            "tier":     r.tier_unlocked,
            "last_seen": r.last_seen.isoformat() if r.last_seen else None,
        }
        for r in rows
    ]


def get_sign_mastery(db: Session, user_id: int, sign_id: str) -> dict | None:
    """Return the mastery row for a single (user, sign) pair, or None."""
    row = (
        db.query(MasteryScore)
        .filter(MasteryScore.user_id == user_id, MasteryScore.sign_id == sign_id)
        .first()
    )
    if row is None:
        return None
    return {
        "sign_id":  row.sign_id,
        "score":    round(row.score, 4),
        "attempts": row.attempts,
        "tier":     row.tier_unlocked,
    }
