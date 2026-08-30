
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from loguru import logger

from app.services import inference
from app.database import get_db
from app.models.progress import Progress
from app.models.user import User
from app.routers.auth import get_current_user
from app.services import mastery_engine
from app.services.progress_filters import is_free_form
from app.services.curriculum_config import FEATURES_PER_FRAME, OKAY_CONFIDENCE, SEQUENCE_LEN
from app.services.xp_rules import verdict_for

router = APIRouter()


class PredictRequest(BaseModel):
    sequence:    List[List[float]]  # 60 frames × 126 features
    target_sign: str                # sign the user was asked to perform
    category:    str
    response_ms: int = 0            # optional: time taken in ms


class SignResult(BaseModel):
    sign:       str
    confidence: float


class PredictResponse(BaseModel):
    top_sign:   str
    confidence: float
    correct:    bool
    feedback:   str
    top3:       List[SignResult]
    mastery:    dict | None = None  # current mastery row after update


@router.post("/predict", response_model=PredictResponse)
def predict_sign(
    request: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(request.sequence) != SEQUENCE_LEN:
        raise HTTPException(400, f"Expected exactly {SEQUENCE_LEN} frames")
    if any(len(frame) != FEATURES_PER_FRAME for frame in request.sequence):
        raise HTTPException(400, f"Expected {FEATURES_PER_FRAME} features per frame")

    # ── Run model inference ───────────────────────────────────────────────────
    results    = inference.predict(request.sequence)
    top        = results[0]
    confidence = top["confidence"]

    # Correct = model's top guess matches the target AND confidence is adequate
    correct = (top["sign"] == request.target_sign) and (confidence >= OKAY_CONFIDENCE)

    # Translate / free-form recordings still get a model verdict, but they
    # must not write Progress or mastery — that polluted the dashboard streak.
    if is_free_form(request.target_sign, request.category):
        logger.info(
            "Free-form predict for user {}; skipping Progress/mastery persistence",
            current_user.id,
        )
        return {
            "top_sign":   top["sign"],
            "confidence": confidence,
            "correct":    False,
            "feedback":   verdict_for(confidence, False),
            "top3":       results,
            "mastery":    None,
        }

    # ── Persist the raw attempt ───────────────────────────────────────────────
    attempt = Progress(
        user_id     = current_user.id,
        sign_id     = request.target_sign,
        category    = request.category,
        confidence  = confidence,
        correct     = correct,
        response_ms = request.response_ms,
    )
    db.add(attempt)

    # ── Update rolling mastery score ──────────────────────────────────────────
    # Single commit below covers both this Progress row and the MasteryScore
    # upsert inside update_mastery() so the two writes land atomically.
    try:
        mastery_engine.update_mastery(
            db, current_user.id, request.target_sign, confidence, correct
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to persist predict attempt for user {}", current_user.id)
        raise
    mastery_info = mastery_engine.get_sign_mastery(
        db, current_user.id, request.target_sign
    )

    return {
        "top_sign":   top["sign"],
        "confidence": confidence,
        "correct":    correct,
        "feedback":   verdict_for(confidence, correct),
        "top3":       results,
        "mastery":    mastery_info,
    }