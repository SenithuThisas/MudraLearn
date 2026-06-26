
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from app.services import inference
from app.database import get_db
from app.models.progress import Progress
from app.services import mastery_engine

router = APIRouter()


class PredictRequest(BaseModel):
    sequence:    List[List[float]]  # 60 frames × 126 features
    user_id:     int
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
def predict_sign(request: PredictRequest, db: Session = Depends(get_db)):
    if len(request.sequence) != 60:
        raise HTTPException(400, "Expected exactly 60 frames")
    if any(len(frame) != 126 for frame in request.sequence):
        raise HTTPException(400, "Expected 126 features per frame")

    # ── Run model inference ───────────────────────────────────────────────────
    results    = inference.predict(request.sequence)
    top        = results[0]
    confidence = top["confidence"]

    # Correct = model's top guess matches the target AND confidence is adequate
    correct = (top["sign"] == request.target_sign) and (confidence >= 0.60)

    # ── Persist the raw attempt ───────────────────────────────────────────────
    attempt = Progress(
        user_id     = request.user_id,
        sign_id     = request.target_sign,
        category    = request.category,
        confidence  = confidence,
        correct     = correct,
        response_ms = request.response_ms,
    )
    db.add(attempt)
    db.commit()

    # ── Update rolling mastery score ──────────────────────────────────────────
    mastery_row = mastery_engine.update_mastery(
        db, request.user_id, request.target_sign, confidence, correct
    )
    mastery_info = mastery_engine.get_sign_mastery(
        db, request.user_id, request.target_sign
    )

    return {
        "top_sign":   top["sign"],
        "confidence": confidence,
        "correct":    correct,
        "feedback":   _get_feedback(confidence, correct),
        "top3":       results,
        "mastery":    mastery_info,
    }


def _get_feedback(confidence: float, correct: bool) -> str:
    if correct and confidence >= 0.85:
        return "great"
    if correct and confidence >= 0.60:
        return "okay"
    return "retry"