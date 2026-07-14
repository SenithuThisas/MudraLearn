"""
dashboard_service.py
---------------------
Aggregates dashboard-facing metrics from data the app already tracks.

This module does not compute a second mastery score. Every per-sign
mastery value comes from app.services.mastery_engine's EWMA MasteryScore
rows via get_mastery_summary() — the same source /api/session/mastery
already serves to the adaptive engine.

The one exception: MasteryScore stores only the *current* score, not
history, so there is no stored record of *when* a sign first crossed the
mastered threshold. Recent Activity's "Mastered" events need that
crossing timestamp, so _replay_scores() re-runs mastery_engine's own EWMA
recurrence (same ALPHA, same attempt_score branching) over a sign's
chronological Progress rows to find it. It is a replay of the existing
formula for a read-only purpose the live upsert doesn't serve — not an
independent scoring system.
"""

from __future__ import annotations

import json
import pathlib
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.progress import Progress
from app.services import mastery_engine
from app.services.mastery_engine import ALPHA, TIER_SCORE_THRESHOLD, TIER_ATTEMPT_THRESHOLD

AVG_SECONDS_PER_ATTEMPT = 8  # rough estimate — no real session/duration tracking exists yet

# Score-range distribution buckets (Decision 3): each attempted sign is counted
# once, into the tier its current EWMA score falls in.
TIER_RANGES: list[tuple[str, float, float]] = [
    ("Novice", 0.0, 0.20),
    ("Beginner", 0.20, 0.40),
    ("Intermediate", 0.40, 0.60),
    ("Advanced", 0.60, 0.80),
    ("Master", 0.80, 1.0001),
]
TIERS = [t[0] for t in TIER_RANGES]

# adaptive_engine.py has no discrete "low mastery" cutoff (it uses a continuous
# weight formula), so this is a new default, not a reused constant.
NEEDS_REVIEW_THRESHOLD = 0.60

_SIGNS_FILE = (
    pathlib.Path(__file__).resolve().parent.parent.parent.parent
    / "frontend" / "public" / "signs_data.json"
)
with _SIGNS_FILE.open() as _f:
    ALL_SIGNS: list[dict] = json.load(_f)["signs"]
_SIGN_CATEGORY: dict[str, str] = {s["name"]: s["category"] for s in ALL_SIGNS}


def tier_for_score(score: float) -> str:
    for tier, low, high in TIER_RANGES:
        if low <= score < high:
            return tier
    return "Master"


def is_mastered(score: float, attempts: int) -> bool:
    """Same gate mastery_engine uses to advance tier_unlocked — one 'mastered' definition, not two."""
    return score >= TIER_SCORE_THRESHOLD and attempts >= TIER_ATTEMPT_THRESHOLD


def _replay_scores(rows: list[Progress]) -> list[tuple[datetime, float]]:
    """Re-run mastery_engine's exact EWMA recurrence over one sign's chronological history."""
    score: float | None = None
    out: list[tuple[datetime, float]] = []
    for row in rows:
        attempt_score = row.confidence if row.correct else row.confidence * 0.3
        score = attempt_score if score is None else ALPHA * attempt_score + (1 - ALPHA) * score
        out.append((row.timestamp, score))
    return out


def _mastered_crossings(rows: list[Progress]) -> list[datetime]:
    """Timestamps at which this sign's replayed score first became mastered."""
    crossings: list[datetime] = []
    was_mastered = False
    for i, (ts, score) in enumerate(_replay_scores(rows)):
        now_mastered = is_mastered(score, i + 1)
        if now_mastered and not was_mastered:
            crossings.append(ts)
        was_mastered = now_mastered
    return crossings


def _progress_by_sign(db: Session, user_id) -> dict[str, list[Progress]]:
    rows = (
        db.query(Progress)
        .filter(Progress.user_id == user_id)
        .order_by(Progress.timestamp.asc())
        .all()
    )
    by_sign: dict[str, list[Progress]] = {}
    for r in rows:
        by_sign.setdefault(r.sign_id, []).append(r)
    return by_sign


def compute_day_streak(db: Session, user_id) -> int:
    rows = db.query(Progress.timestamp).filter(Progress.user_id == user_id).all()
    days = {r.timestamp.date() for r in rows if r.timestamp}
    streak = 0
    cursor = datetime.utcnow().date()
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def build_summary(db: Session, user_id) -> dict:
    mastery_rows = mastery_engine.get_mastery_summary(db, user_id)
    by_sign = _progress_by_sign(db, user_id)

    total_attempts = sum(r["attempts"] for r in mastery_rows)
    signs_mastered = sum(1 for r in mastery_rows if is_mastered(r["score"], r["attempts"]))

    mastery_overall = (
        round(sum(r["score"] for r in mastery_rows) / len(mastery_rows) * 100)
        if mastery_rows else 0
    )

    tier_counts = {t: 0 for t in TIERS}
    for r in mastery_rows:
        tier_counts[tier_for_score(r["score"])] += 1
    total_signs = len(mastery_rows) or 1
    tier_breakdown = {t: round(c / total_signs * 100) for t, c in tier_counts.items()}

    needs_review = sorted(
        (
            {
                "sign": r["sign_id"],
                "category": _SIGN_CATEGORY.get(r["sign_id"], "Uncategorized"),
                "mastery": round(r["score"] * 100),
            }
            for r in mastery_rows
            if r["score"] < NEEDS_REVIEW_THRESHOLD
        ),
        key=lambda x: x["mastery"],
    )[:3]

    events = []
    for sign_id, rows in by_sign.items():
        for row in rows:
            events.append({
                "id": f"{sign_id}-practiced-{row.timestamp.isoformat()}",
                "type": "practiced",
                "sign": sign_id,
                "timestamp": row.timestamp,
            })
        for ts in _mastered_crossings(rows):
            events.append({
                "id": f"{sign_id}-mastered-{ts.isoformat()}",
                "type": "mastered",
                "sign": sign_id,
                "timestamp": ts,
            })
    events.sort(key=lambda e: e["timestamp"], reverse=True)
    recent_activity = [{**e, "timestamp": e["timestamp"].isoformat()} for e in events[:10]]

    return {
        "stats": {
            "signs_mastered": signs_mastered,
            "day_streak": compute_day_streak(db, user_id),
            "minutes_practiced_estimate": round(total_attempts * AVG_SECONDS_PER_ATTEMPT / 60),
        },
        "mastery_overall": mastery_overall,
        "tier_breakdown": tier_breakdown,
        "needs_review": needs_review,
        "recent_activity": recent_activity,
    }


def build_signs_page(
    db: Session,
    user_id,
    search: str,
    category: str,
    page: int,
    page_size: int,
) -> dict:
    mastery_rows = mastery_engine.get_mastery_summary(db, user_id)
    mastery_by_sign = {r["sign_id"]: r for r in mastery_rows}

    entries = []
    for sign in ALL_SIGNS:
        name = sign["name"]
        row = mastery_by_sign.get(name)
        score = row["score"] if row else 0.0
        entries.append({
            "sign": name,
            "category": sign["category"],
            "tier": tier_for_score(score),
            "mastery": round(score * 100),
        })

    if search:
        needle = search.lower()
        entries = [e for e in entries if needle in e["sign"].lower()]
    if category:
        entries = [e for e in entries if e["category"] == category]

    total = len(entries)
    start = (page - 1) * page_size
    page_entries = entries[start:start + page_size]

    return {
        "signs": page_entries,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }
