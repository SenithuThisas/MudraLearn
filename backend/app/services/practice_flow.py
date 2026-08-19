"""Practice path: batch map, preview/practice completion, Challenge scoring."""

from __future__ import annotations

import random
from datetime import datetime, timezone

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from app.models.curriculum import Batch, SignDifficulty, UserBatchProgress, XpLedger
from app.models.progress import Progress
from app.services import curriculum_service, inference, mastery_engine
from app.services.curriculum_config import (
    DAILY_STREAK_XP,
    FEATURES_PER_FRAME,
    SEQUENCE_LEN,
    SIGNS_PER_BATCH,
    STATUS_COMPLETED,
    STATUS_IN_PROGRESS,
    STATUS_LOCKED,
    STATUS_NEEDS_REVIEW,
    TIER_BANDS,
    XP_REASON_SIGN,
    XP_REASON_STREAK_DAILY,
    OKAY_CONFIDENCE,
)
from app.services.xp_rules import (
    CORRECT_VERDICTS,
    batch_bonus_entries,
    batch_completed,
    can_challenge_sign,
    score_challenge_results,
    sign_xp,
    verdict_for,
)


def _practiced_list(row: UserBatchProgress) -> list[str]:
    raw = row.practiced_sign_ids or []
    return [str(s) for s in raw]


def _state(row: UserBatchProgress) -> dict:
    raw = row.challenge_state or {}
    return dict(raw) if isinstance(raw, dict) else {}


def _get_batch(db: Session, batch_id: int) -> Batch:
    batch = db.get(Batch, batch_id)
    if batch is None:
        raise HTTPException(404, "Batch not found")
    return batch


def _get_progress(db: Session, user_id, batch_id: int) -> tuple[Batch, UserBatchProgress]:
    curriculum_service.ensure_user_curriculum(db, user_id)
    batch = _get_batch(db, batch_id)
    row = (
        db.query(UserBatchProgress)
        .filter(UserBatchProgress.user_id == user_id, UserBatchProgress.batch_id == batch_id)
        .first()
    )
    if row is None:
        raise HTTPException(404, "No progress for this batch")
    return batch, row


def _challenge_eligible(meta: SignDifficulty | None, batch_id: int) -> bool:
    if meta is None:
        return False
    return can_challenge_sign(
        gate_passed=bool(meta.gate_passed),
        assigned_to_batch=meta.batch_id == batch_id,
    )


def _sign_meta(db: Session, sign_id: str) -> SignDifficulty | None:
    return db.get(SignDifficulty, sign_id)


def _batch_title(batch: Batch) -> str:
    return f"Batch {batch.level_number:02d}"


def continue_target(db: Session, user_id) -> int | None:
    curriculum_service.ensure_user_curriculum(db, user_id)
    rows = (
        db.query(UserBatchProgress, Batch)
        .join(Batch, Batch.id == UserBatchProgress.batch_id)
        .filter(UserBatchProgress.user_id == user_id)
        .order_by(Batch.level_number.asc())
        .all()
    )
    for progress, batch in rows:
        if progress.status in (STATUS_IN_PROGRESS, STATUS_NEEDS_REVIEW):
            return batch.id
    for progress, batch in rows:
        if progress.status != STATUS_LOCKED:
            return batch.id
    return None


def serialize_map(db: Session, user_id) -> dict:
    curriculum_service.ensure_user_curriculum(db, user_id)
    rows = (
        db.query(UserBatchProgress, Batch)
        .join(Batch, Batch.id == UserBatchProgress.batch_id)
        .filter(UserBatchProgress.user_id == user_id)
        .order_by(Batch.level_number.asc())
        .all()
    )
    batches = []
    for progress, batch in rows:
        practiced = _practiced_list(progress)
        batches.append({
            "batch_id": batch.id,
            "level_number": batch.level_number,
            "tier": batch.tier,
            "tier_label": batch.tier_label,
            "title": _batch_title(batch),
            "sign_ids": list(batch.sign_ids),
            "sign_count": len(batch.sign_ids),
            "status": progress.status,
            "best_score": progress.best_score,
            "attempts": progress.attempts,
            "practiced_count": len(practiced),
            "challenge_unlocked": len(practiced) >= SIGNS_PER_BATCH,
        })
    return {"batches": batches, "continue_batch_id": continue_target(db, user_id)}


def serialize_overview(db: Session, user_id, batch_id: int) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    if progress.status == STATUS_LOCKED:
        raise HTTPException(403, "This batch is locked")
    practiced = set(_practiced_list(progress))
    signs = []
    for index, sign_id in enumerate(batch.sign_ids):
        meta = _sign_meta(db, sign_id)
        prior_done = all(s in practiced for s in batch.sign_ids[:index])
        signs.append({
            "sign_id": sign_id,
            "category": meta.category if meta else "Uncategorized",
            "practiced": sign_id in practiced,
            "unlocked": prior_done,
            "review": progress.status == STATUS_NEEDS_REVIEW,
        })
    return {
        "batch_id": batch.id,
        "level_number": batch.level_number,
        "tier": batch.tier,
        "tier_label": batch.tier_label,
        "title": _batch_title(batch),
        "status": progress.status,
        "best_score": progress.best_score,
        "practiced_count": len(practiced),
        "challenge_unlocked": len(practiced) >= SIGNS_PER_BATCH,
        "signs": signs,
        "next_practice_sign_id": next((s["sign_id"] for s in signs if not s["practiced"] and s["unlocked"]), None),
    }


def mark_practiced(db: Session, user_id, batch_id: int, sign_id: str) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    if progress.status == STATUS_LOCKED:
        raise HTTPException(403, "This batch is locked")
    if sign_id not in batch.sign_ids:
        raise HTTPException(400, "Sign is not in this batch")
    practiced = _practiced_list(progress)
    index = list(batch.sign_ids).index(sign_id)
    if not all(s in practiced for s in batch.sign_ids[:index]):
        raise HTTPException(400, "Finish earlier signs in this batch first")
    if sign_id not in practiced:
        practiced.append(sign_id)
        progress.practiced_sign_ids = practiced
    if progress.status not in (STATUS_NEEDS_REVIEW, STATUS_IN_PROGRESS, STATUS_COMPLETED):
        progress.status = STATUS_IN_PROGRESS
    db.commit()
    return serialize_overview(db, user_id, batch_id)


def restart_batch(db: Session, user_id, batch_id: int) -> dict:
    _batch, progress = _get_progress(db, user_id, batch_id)
    if progress.status not in (STATUS_NEEDS_REVIEW, STATUS_IN_PROGRESS):
        raise HTTPException(400, "Only a needs-review batch can be restarted")
    progress.practiced_sign_ids = []
    progress.challenge_state = {}
    progress.status = STATUS_IN_PROGRESS
    db.commit()
    return serialize_overview(db, user_id, batch_id)


def start_challenge(db: Session, user_id, batch_id: int) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    if progress.status == STATUS_LOCKED:
        raise HTTPException(403, "This batch is locked")
    practiced = _practiced_list(progress)
    if len(practiced) < SIGNS_PER_BATCH:
        raise HTTPException(400, "Practice all five signs before Challenge")
    for sign_id in batch.sign_ids:
        meta = _sign_meta(db, sign_id)
        if not _challenge_eligible(meta, batch.id):
            raise HTTPException(403, f"{sign_id} is not eligible for a graded Challenge")
    state = _state(progress)
    if state.get("order") and not state.get("finalized"):
        return _challenge_payload(batch, progress, state)
    order = list(batch.sign_ids)
    random.shuffle(order)
    state = {
        "order": order,
        "index": 0,
        "results": {},
        "hint_pending": False,
        "from_needs_review": progress.status == STATUS_NEEDS_REVIEW,
        "finalized": False,
    }
    progress.challenge_state = state
    db.commit()
    return _challenge_payload(batch, progress, state)


def use_hint(db: Session, user_id, batch_id: int) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    state = _state(progress)
    if not state.get("order") or state.get("finalized"):
        raise HTTPException(400, "No active Challenge")
    current = state["order"][state["index"]]
    result = state.get("results", {}).get(current)
    if result is None or result.get("verdict") != "retry":
        raise HTTPException(400, "Hint is only available after a Retry verdict")
    result["hint_used"] = True
    result["xp"] = 0
    state["hint_pending"] = True
    state["results"][current] = result
    progress.challenge_state = state
    db.commit()
    return _challenge_payload(batch, progress, state)


def _persist_attempt(db, user_id, sign_id: str, category: str, confidence: float, correct: bool, response_ms: int):
    db.add(Progress(
        user_id=user_id,
        sign_id=sign_id,
        category=category,
        confidence=confidence,
        correct=correct,
        response_ms=response_ms,
    ))
    mastery_engine.update_mastery(db, user_id, sign_id, confidence, correct)
    db.flush()
    return mastery_engine.get_sign_mastery(db, user_id, sign_id)


def _award_sign_xp(db, user_id, batch_id: int, sign_id: str, amount: int) -> None:
    if amount <= 0:
        return
    db.add(XpLedger(
        user_id=user_id,
        amount=amount,
        reason=XP_REASON_SIGN,
        batch_id=batch_id,
        sign_id=sign_id,
    ))


def _award_daily_streak_xp(db, user_id) -> int:
    from app.services.dashboard_service import compute_day_streak

    computed = compute_day_streak(db, user_id)
    snapshot = curriculum_service.user_streak_snapshot(db, user_id, computed)
    today = datetime.now(timezone.utc).date()
    already = (
        db.query(XpLedger)
        .filter(XpLedger.user_id == user_id, XpLedger.reason == XP_REASON_STREAK_DAILY)
        .order_by(XpLedger.created_at.desc())
        .first()
    )
    if already and already.created_at:
        created = already.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created.astimezone(timezone.utc).date() == today:
            return 0
    if snapshot["current_streak"] < 1:
        return 0
    db.add(XpLedger(
        user_id=user_id,
        amount=DAILY_STREAK_XP,
        reason=XP_REASON_STREAK_DAILY,
        batch_id=None,
        sign_id=None,
    ))
    return DAILY_STREAK_XP


def _challenge_payload(batch: Batch, progress: UserBatchProgress, state: dict) -> dict:
    order: list[str] = list(state.get("order") or [])
    index = int(state.get("index") or 0)
    current = order[index] if index < len(order) else None
    results = state.get("results") or {}
    current_result = results.get(current) if current else None
    return {
        "batch_id": batch.id,
        "level_number": batch.level_number,
        "tier_label": batch.tier_label,
        "title": _batch_title(batch),
        "status": progress.status,
        "order": order,
        "index": index,
        "current_sign_id": current,
        "current_result": current_result,
        "hint_pending": bool(state.get("hint_pending")),
        "results": results,
        "done": bool(state.get("finalized")),
        "batch_result": state.get("batch_result"),
        "from_needs_review": bool(state.get("from_needs_review")),
    }


def _unlock_next(db: Session, user_id, completed_level: int) -> None:
    nxt = (
        db.query(UserBatchProgress)
        .join(Batch, Batch.id == UserBatchProgress.batch_id)
        .filter(UserBatchProgress.user_id == user_id, Batch.level_number == completed_level + 1)
        .first()
    )
    if nxt is not None and nxt.status == STATUS_LOCKED:
        nxt.status = STATUS_IN_PROGRESS


def _tier_boundary(level_number: int) -> str | None:
    for _num, _start, end, _label in TIER_BANDS:
        if end is not None and level_number == end:
            for _n2, s2, _e2, l2 in TIER_BANDS:
                if s2 == end + 1:
                    return l2
    return None


def _finalize_if_ready(db, user_id, batch: Batch, progress: UserBatchProgress, state: dict, payload: dict) -> dict:
    if state.get("finalized"):
        payload["batch_result"] = state.get("batch_result")
        payload["done"] = True
        return payload
    results = state.get("results") or {}
    if len(results) < SIGNS_PER_BATCH:
        return payload
    correct, hints = score_challenge_results(results)
    sign_xp_total = sum(int(r.get("xp") or 0) for r in results.values())
    from_needs = bool(state.get("from_needs_review"))
    bonuses = batch_bonus_entries(correct, hints, from_needs)
    bonus_xp = 0
    if batch_completed(correct):
        for reason, amount in bonuses:
            db.add(XpLedger(
                user_id=user_id,
                amount=amount,
                reason=reason,
                batch_id=batch.id,
                sign_id=None,
            ))
            bonus_xp += amount
        progress.status = STATUS_COMPLETED
        progress.best_score = max(progress.best_score, correct)
        _unlock_next(db, user_id, batch.level_number)
        crossed = _tier_boundary(batch.level_number)
    else:
        progress.status = STATUS_NEEDS_REVIEW
        progress.best_score = max(progress.best_score, correct)
        crossed = None
    progress.attempts = (progress.attempts or 0) + 1
    streak_xp = _award_daily_streak_xp(db, user_id)
    batch_result = {
        "score": correct,
        "total": SIGNS_PER_BATCH,
        "passed": batch_completed(correct),
        "sign_xp": sign_xp_total,
        "bonus_xp": bonus_xp,
        "streak_xp": streak_xp,
        "total_xp": sign_xp_total + bonus_xp + streak_xp,
        "bonuses": [{"reason": r, "amount": a} for r, a in bonuses],
        "hints_used": hints,
        "from_needs_review": from_needs,
        "tier_up": crossed,
        "next_batch_id": batch.id + 1 if batch_completed(correct) else None,
        "failed_signs": [
            sid for sid, row in results.items()
            if row.get("verdict") not in CORRECT_VERDICTS
        ],
    }
    state["finalized"] = True
    state["batch_result"] = batch_result
    progress.challenge_state = state
    payload["batch_result"] = batch_result
    payload["done"] = True
    return payload


def challenge_attempt(
    db: Session,
    user_id,
    batch_id: int,
    sign_id: str,
    sequence: list[list[float]],
    response_ms: int,
) -> dict:
    if len(sequence) != SEQUENCE_LEN:
        raise HTTPException(400, f"Expected exactly {SEQUENCE_LEN} frames")
    if any(len(frame) != FEATURES_PER_FRAME for frame in sequence):
        raise HTTPException(400, f"Expected {FEATURES_PER_FRAME} features per frame")

    batch, progress = _get_progress(db, user_id, batch_id)
    state = _state(progress)
    if not state.get("order") or state.get("finalized"):
        raise HTTPException(400, "Start Challenge first")
    current = state["order"][state["index"]]
    if sign_id != current:
        raise HTTPException(400, f"Expected sign {current}")

    meta = _sign_meta(db, sign_id)
    if not _challenge_eligible(meta, batch.id):
        raise HTTPException(403, "This sign is not eligible for a graded Challenge")

    existing = state.get("results", {}).get(sign_id)
    is_hint_rerecord = bool(state.get("hint_pending")) and existing is not None

    try:
        model_results = inference.predict(sequence)
    except Exception:
        logger.exception("Challenge inference failed")
        raise HTTPException(500, "Model inference failed")
    top = model_results[0]
    confidence = top["confidence"]
    matched = top["sign"] == sign_id and confidence >= OKAY_CONFIDENCE
    verdict = verdict_for(confidence, matched)

    mastery = _persist_attempt(
        db, user_id, sign_id, meta.category, confidence, matched, response_ms,
    )

    if is_hint_rerecord:
        existing["rerecord"] = {
            "verdict": verdict,
            "confidence": confidence,
            "top_sign": top["sign"],
            "top3": model_results,
        }
        existing["hint_used"] = True
        existing["xp"] = 0
        state["hint_pending"] = False
        state["results"][sign_id] = existing
        state["index"] = min(state["index"] + 1, SIGNS_PER_BATCH)
        progress.challenge_state = state
        payload = _challenge_payload(batch, progress, state)
        payload.update({
            "verdict": verdict,
            "confidence": confidence,
            "top_sign": top["sign"],
            "top3": model_results,
            "xp_awarded": 0,
            "mastery": mastery,
            "scored": False,
        })
        if len(state.get("results", {})) >= SIGNS_PER_BATCH and state["index"] >= SIGNS_PER_BATCH:
            payload = _finalize_if_ready(db, user_id, batch, progress, state, payload)
        db.commit()
        return payload

    if existing is not None:
        raise HTTPException(400, "This sign already has a scored attempt — use Hint to re-record")

    xp_awarded = sign_xp(verdict, False, batch.level_number)
    state.setdefault("results", {})[sign_id] = {
        "verdict": verdict,
        "confidence": confidence,
        "top_sign": top["sign"],
        "top3": model_results,
        "hint_used": False,
        "xp": xp_awarded,
        "correct": verdict in CORRECT_VERDICTS,
    }
    _award_sign_xp(db, user_id, batch.id, sign_id, xp_awarded)
    if verdict in CORRECT_VERDICTS:
        state["index"] = min(state["index"] + 1, SIGNS_PER_BATCH)
    progress.challenge_state = state
    payload = _challenge_payload(batch, progress, state)
    payload.update({
        "verdict": verdict,
        "confidence": confidence,
        "top_sign": top["sign"],
        "top3": model_results,
        "xp_awarded": xp_awarded,
        "mastery": mastery,
        "scored": True,
    })
    if verdict in CORRECT_VERDICTS and len(state["results"]) >= SIGNS_PER_BATCH:
        payload = _finalize_if_ready(db, user_id, batch, progress, state, payload)
    db.commit()
    return payload


def advance_after_retry(db: Session, user_id, batch_id: int) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    state = _state(progress)
    if not state.get("order") or state.get("finalized"):
        raise HTTPException(400, "No active Challenge")
    current = state["order"][state["index"]]
    result = state.get("results", {}).get(current)
    if result is None or result.get("verdict") != "retry":
        raise HTTPException(400, "Nothing to skip")
    state["index"] = min(state["index"] + 1, SIGNS_PER_BATCH)
    state["hint_pending"] = False
    progress.challenge_state = state
    payload = _challenge_payload(batch, progress, state)
    if len(state.get("results", {})) >= SIGNS_PER_BATCH and state["index"] >= SIGNS_PER_BATCH:
        payload = _finalize_if_ready(db, user_id, batch, progress, state, payload)
    db.commit()
    return payload


def get_challenge(db: Session, user_id, batch_id: int) -> dict:
    batch, progress = _get_progress(db, user_id, batch_id)
    state = _state(progress)
    if not state.get("order"):
        raise HTTPException(404, "Challenge has not started")
    return _challenge_payload(batch, progress, state)
