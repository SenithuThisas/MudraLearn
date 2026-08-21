"""
adaptive_engine.py
------------------
Decides which sign to show the user next.

Three-mode algorithm
=====================

1. COLD-START  (total attempts < COLD_START_THRESHOLD)
   - New users have no mastery history to learn from, so we walk them
     through a fixed, category-balanced STARTER_POOL of STARTER_SIGN_COUNT
     signs (round-robin across categories, not a flat catalogue slice — see
     _build_starter_pool).
   - This gives a stable, predictable onboarding experience.

2. ADAPTIVE  (total attempts >= COLD_START_THRESHOLD, curriculum not complete)
   - Builds a weighted pool from the user's MasteryScore rows.
   - Weight formula:
       w = (1 - score) * 2  +  min(days_since_last_seen, 7) * 0.3
     → Low mastery  → appears much more often  (spaced repetition)
     → Long gap     → gets a recency boost      (Ebbinghaus forgetting curve)
   - 20 % chance to inject a brand-new unseen sign so the curriculum
     always moves forward even when the user is struggling.

3. COMPLETE  (every sign in the catalogue meets the mastered bar)
   - Reuses mastery_engine.TIER_SCORE_THRESHOLD / TIER_ATTEMPT_THRESHOLD — the
     exact same "mastered" definition dashboard_service.is_mastered() already
     uses ("one mastered definition, not two"). No second, locally-defined
     threshold is introduced here.

References: SM-2 algorithm (Wozniak 1987), Ebbinghaus (1885).
"""

from __future__ import annotations

import json
import pathlib
import random
import re
from datetime import datetime

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.models.progress import MasteryScore
from app.services.mastery_engine import TIER_ATTEMPT_THRESHOLD, TIER_SCORE_THRESHOLD

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
    _ALL_SIGNS_RAW: list[dict] = json.load(_f)["signs"]  # [{name, category}, ...]


def _slugify(name: str) -> str:
    """Mirror of referenceClips.ts slugify — keep in sync."""
    s = name.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"^-+|-+$", "", s)


_REFERENCE_DIR = (
    pathlib.Path(__file__).resolve()
    .parent.parent.parent.parent
    / "frontend" / "public" / "reference"
)


def _filter_to_clip_covered(signs: list[dict]) -> list[dict]:
    """Return only signs that have a .mp4 reference clip in public/reference/.

    The adaptive engine only serves signs the user can watch — without a
    reference clip the user has no way to learn the correct form.  If the
    reference directory is absent (e.g. in CI) fall back to the full catalogue
    so tests are never broken by a missing asset directory.
    """
    if not _REFERENCE_DIR.is_dir():
        return signs
    available: set[str] = {
        f.stem for f in _REFERENCE_DIR.iterdir() if f.suffix == ".mp4"
    }
    return [s for s in signs if _slugify(s["name"]) in available]


ALL_SIGNS: list[dict] = _filter_to_clip_covered(_ALL_SIGNS_RAW)

_SIGN_BY_NAME: dict[str, dict] = {s["name"]: s for s in ALL_SIGNS}


def _build_starter_pool(signs: list[dict], count: int) -> list[dict]:
    """Round-robin across categories, in order of first appearance in the
    catalogue, so cold-start isn't dominated by whichever category happens to
    sort first in signs_data.json. (Previously: a flat ALL_SIGNS[:count]
    slice served STARTER_SIGN_COUNT copies of a single category — every new
    user's first 15 signs were 15/15 "Adjectives".)
    """
    by_category: dict[str, list[dict]] = {}
    category_order: list[str] = []
    for s in signs:
        cat = s["category"]
        if cat not in by_category:
            by_category[cat] = []
            category_order.append(cat)
        by_category[cat].append(s)

    pool: list[dict] = []
    cursors = {cat: 0 for cat in category_order}
    while len(pool) < count:
        progressed = False
        for cat in category_order:
            if len(pool) >= count:
                break
            idx = cursors[cat]
            bucket = by_category[cat]
            if idx < len(bucket):
                pool.append(bucket[idx])
                cursors[cat] = idx + 1
                progressed = True
        if not progressed:
            break  # fewer signs in the catalogue than `count` — every category exhausted
    return pool


STARTER_POOL: list[dict] = _build_starter_pool(ALL_SIGNS, STARTER_SIGN_COUNT)


# ── Public API ────────────────────────────────────────────────────────────────

def get_next_sign(db: Session, user_id: int) -> dict:
    """
    Return the next sign for the user to practice.

    Response schema:
        {
          "sign":     str | None,
          "category": str | None,
          "mode":     "cold_start" | "review" | "new" | "complete",
          "mastery":  float | None   # current score, None if never seen or curriculum complete
        }

    "complete" is returned once every sign in ALL_SIGNS has a MasteryScore row
    meeting the same "mastered" bar dashboard_service.is_mastered() already
    uses (score >= TIER_SCORE_THRESHOLD and attempts >= TIER_ATTEMPT_THRESHOLD)
    — at that point sign/category/mastery are all None; there is nothing left
    to serve.
    """
    mastery_rows: list[MasteryScore] = (
        db.query(MasteryScore)
        .filter(MasteryScore.user_id == user_id)
        .all()
    )
    total_attempts = sum(r.attempts for r in mastery_rows)

    if total_attempts < COLD_START_THRESHOLD:
        return _cold_start(mastery_rows)

    if _is_curriculum_complete(mastery_rows):
        return {"sign": None, "category": None, "mode": "complete", "mastery": None}

    return _adaptive(mastery_rows)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _is_curriculum_complete(mastery_rows: list[MasteryScore]) -> bool:
    """True once every sign in the catalogue is mastered by the same bar
    dashboard_service.is_mastered() already uses — one mastery definition,
    not two.
    """
    if len(mastery_rows) < len(ALL_SIGNS):
        return False
    return all(
        r.score >= TIER_SCORE_THRESHOLD and r.attempts >= TIER_ATTEMPT_THRESHOLD
        for r in mastery_rows
    )


def _cold_start(mastery_rows: list[MasteryScore]) -> dict:
    """
    Walk sequentially through STARTER_POOL (the category-balanced starter set).
    Return the next unseen one, falling back to a random starter sign
    if the user has already seen them all.
    """
    seen_ids     = {r.sign_id for r in mastery_rows}
    starter_pool = STARTER_POOL
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
