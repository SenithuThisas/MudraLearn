"""
adaptive_engine.py
------------------
Decides which sign to show the user next.

Two-mode algorithm
==================

1. COLD-START  (total attempts < COLD_START_THRESHOLD)
   - New users have no mastery history to learn from, so we walk them
     through the first STARTER_SIGN_COUNT signs in order.
   - This gives a stable, predictable onboarding experience.

2. ADAPTIVE  (total attempts >= COLD_START_THRESHOLD)
   - Builds a weighted pool from the user's MasteryScore rows.
   - Weight formula:
       w = (1 - score) * 2  +  min(days_since_last_seen, 7) * 0.3
     → Low mastery  → appears much more often  (spaced repetition)
     → Long gap     → gets a recency boost      (Ebbinghaus forgetting curve)
   - 20 % chance to inject a brand-new unseen sign so the curriculum
     always moves forward even when the user is struggling.

References: SM-2 algorithm (Wozniak 1987), Ebbinghaus (1885).
"""

from __future__ import annotations

import json
import pathlib
import random
from datetime import datetime

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.models.progress import MasteryScore

# ── Tuning constants ──────────────────────────────────────────────────────────
COLD_START_THRESHOLD = 10   # attempts before adaptive mode kicks in
STARTER_SIGN_COUNT   = 15   # size of the fixed cold-start curriculum
NEW_SIGN_INJECTION   = 0.20 # probability of injecting an unseen sign in adaptive mode

# ── Load sign catalogue once at import time ───────────────────────────────────
_SIGNS_FILE = (
    pathlib.Path(__file__).resolve()
    .parent.parent.parent.parent  # project root
    / "frontend" / "public" / "signs_data.json"
)

with _SIGNS_FILE.open() as _f:
    ALL_SIGNS: list[dict] = json.load(_f)["signs"]  # [{name, category}, ...]

_SIGN_BY_NAME: dict[str, dict] = {s["name"]: s for s in ALL_SIGNS}


# ── Public API ────────────────────────────────────────────────────────────────

def get_next_sign(db: Session, user_id: int) -> dict:
    """
    Return the next sign for the user to practice.

    Response schema:
        {
          "sign":     str,
          "category": str,
          "mode":     "cold_start" | "review" | "new",
          "mastery":  float | None   # current score, None if never seen
        }
    """
    mastery_rows: list[MasteryScore] = (
        db.query(MasteryScore)
        .filter(MasteryScore.user_id == user_id)
        .all()
    )
    total_attempts = sum(r.attempts for r in mastery_rows)

    if total_attempts < COLD_START_THRESHOLD:
        return _cold_start(mastery_rows)

    return _adaptive(mastery_rows)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _cold_start(mastery_rows: list[MasteryScore]) -> dict:
    """
    Walk sequentially through the first STARTER_SIGN_COUNT signs.
    Return the next unseen one, falling back to a random starter sign
    if the user has already seen them all.
    """
    seen_ids     = {r.sign_id for r in mastery_rows}
    starter_pool = ALL_SIGNS[:STARTER_SIGN_COUNT]
    unseen       = [s for s in starter_pool if s["name"] not in seen_ids]

    chosen = unseen[0] if unseen else random.choice(starter_pool)
    return _build_response(chosen, "cold_start", mastery_rows)


def _adaptive(mastery_rows: list[MasteryScore]) -> dict:
    """
    Weighted-random pick from known signs, with a 20 % chance of
    injecting a brand-new sign to advance the curriculum.
    """
    known_ids = {r.sign_id for r in mastery_rows}
    now       = datetime.utcnow()

    # 20 % chance → inject a completely new sign
    if random.random() < NEW_SIGN_INJECTION:
        unseen = [s for s in ALL_SIGNS if s["name"] not in known_ids]
        if unseen:
            chosen = random.choice(unseen)
            return _build_response(chosen, "new", mastery_rows)

    # Build weighted pool from mastery rows
    candidates: list[str]   = []
    weights:    list[float] = []

    for r in mastery_rows:
        days_since  = (now - r.last_seen).days if r.last_seen else 0
        # Low mastery → high weight; long gap → extra boost
        weight = (1.0 - r.score) * 2 + min(days_since, 7) * 0.3
        candidates.append(r.sign_id)
        weights.append(max(weight, 0.05))   # floor so even mastered signs reappear

    # random.choices handles normalisation automatically
    chosen_id   = random.choices(candidates, weights=weights, k=1)[0]
    chosen_sign = _SIGN_BY_NAME.get(chosen_id)

    # Fallback: if somehow the sign_id isn't in the catalogue, pick randomly
    if chosen_sign is None:
        chosen_sign = random.choice(ALL_SIGNS)

    return _build_response(chosen_sign, "review", mastery_rows)


def _build_response(
    sign: dict,
    mode: str,
    mastery_rows: list[MasteryScore],
) -> dict:
    """Attach the current mastery score (if any) to the response."""
    mastery_map = {r.sign_id: r.score for r in mastery_rows}
    return {
        "sign":     sign["name"],
        "category": sign["category"],
        "mode":     mode,
        "mastery":  round(mastery_map.get(sign["name"], 0.0), 4)
        if sign["name"] in mastery_map else None,
    }
