"""
dashboard_service.py
---------------------
Aggregates dashboard-facing metrics from data the app already tracks.

This module does not compute a second mastery score. Every per-sign
mastery value comes from app.services.mastery_engine's EWMA MasteryScore
rows via get_mastery_summary() — the same source /api/session/mastery
already serves to the adaptive engine.
"""

from __future__ import annotations

import json
import pathlib
from collections import defaultdict
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session
from loguru import logger

from app.models.progress import Progress
from app.models.curriculum import Batch
from app.services import mastery_engine
from app.services.mastery_engine import TIER_SCORE_THRESHOLD, TIER_ATTEMPT_THRESHOLD
from app.services.progress_filters import compute_streak_stats, is_free_form
from app.services import curriculum_service

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

# Honest zeros until the Phase 2 XP ledger exists. Named so the dashboard
# response is API-backed rather than a frontend mock.
PLACEHOLDER_XP_TOTAL = 0
PLACEHOLDER_CURRENT_LEVEL_XP = 0
PLACEHOLDER_XP_TO_NEXT_LEVEL = 0
PLACEHOLDER_LEVEL_NUMBER = 1
PLACEHOLDER_LEVEL_TITLE = "Novice"

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


def _as_utc_date(ts: datetime) -> date:
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc).date()


def _scored_progress_rows(db: Session, user_id) -> list[Progress]:
    rows = (
        db.query(Progress)
        .filter(Progress.user_id == user_id)
        .order_by(Progress.timestamp.asc())
        .all()
    )
    return [r for r in rows if not is_free_form(r.sign_id, r.category)]


def _progress_by_sign(rows: list[Progress]) -> dict[str, list[Progress]]:
    by_sign: dict[str, list[Progress]] = {}
    for r in rows:
        by_sign.setdefault(r.sign_id, []).append(r)
    return by_sign


def compute_day_streak(db: Session, user_id) -> dict:
    """Return current/longest streak and practiced-today from scored Progress rows."""
    rows = _scored_progress_rows(db, user_id)
    days = {_as_utc_date(r.timestamp) for r in rows if r.timestamp}
    today = datetime.now(timezone.utc).date()
    return compute_streak_stats(days, today)


def _category_progress(mastery_rows: list[dict]) -> list[dict]:
    mastery_by_sign = {r["sign_id"].strip().lower(): r for r in mastery_rows}
    by_category: dict[str, list[str]] = defaultdict(list)
    for sign in ALL_SIGNS:
        by_category[sign["category"]].append(sign["name"])

    result: list[dict] = []
    for name in sorted(by_category):
        signs = by_category[name]
        completed = 0
        for sign_name in signs:
            row = mastery_by_sign.get(sign_name.strip().lower())
            if row and is_mastered(row["score"], row["attempts"]):
                completed += 1
        total = len(signs)
        result.append({
            "name": name,
            "total_signs": total,
            "completed_signs": completed,
            "badge_earned": total > 0 and completed == total,
        })
    return result


def build_summary(db: Session, user_id) -> dict:
    mastery_rows = mastery_engine.get_mastery_summary(db, user_id)
    scored_rows = _scored_progress_rows(db, user_id)
    by_sign = _progress_by_sign(scored_rows)
    streak = compute_day_streak(db, user_id)
    xp_total = PLACEHOLDER_XP_TOTAL
    current_level_xp = PLACEHOLDER_CURRENT_LEVEL_XP
    xp_to_next_level = PLACEHOLDER_XP_TO_NEXT_LEVEL
    level_number = PLACEHOLDER_LEVEL_NUMBER
    level_title = PLACEHOLDER_LEVEL_TITLE
    try:
        if db.query(Batch.id).first() is not None:
            curriculum_service.ensure_user_curriculum(db, user_id)
            streak = curriculum_service.user_streak_snapshot(db, user_id, streak)
            xp_total = curriculum_service.total_xp(db, user_id)
            level_number, level_title = curriculum_service.current_level_title(db, user_id)
            current_level_xp = xp_total
            db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to attach curriculum/XP to dashboard summary")

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
    events.sort(key=lambda e: e["timestamp"], reverse=True)
    recent_activity = [{**e, "timestamp": e["timestamp"].isoformat()} for e in events[:10]]

    return {
        "stats": {
            "signs_mastered": signs_mastered,
            "day_streak": streak["current_streak"],
            "minutes_practiced_estimate": round(total_attempts * AVG_SECONDS_PER_ATTEMPT / 60),
            "longest_streak": streak["longest_streak"],
            "practiced_today": streak["practiced_today"],
        },
        "xp": {
            "total": xp_total,
            "current_level_xp": current_level_xp,
            "xp_to_next_level": xp_to_next_level,
        },
        "level": {
            "current": level_number,
            "title": level_title,
        },
        "categories": _category_progress(mastery_rows),
        "mastery_overall": mastery_overall,
        "tier_breakdown": tier_breakdown,
        "needs_review": needs_review,
        "recent_activity": recent_activity,
        # True once the user has any scored Progress row — lets the frontend
        # distinguish "never attempted" (show "—") from "attempted, scored 0%".
        "has_progress": bool(by_sign),
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
    mastery_by_sign = {r["sign_id"].strip().lower(): r for r in mastery_rows}

    entries = []
    for sign in ALL_SIGNS:
        name = sign["name"]
        row = mastery_by_sign.get(name.strip().lower())
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
