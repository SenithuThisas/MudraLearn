# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import adaptive_engine, mastery_engine

router = APIRouter()


@router.get("/session/next")
def next_sign(
    user_id: int = Query(..., description="ID of the logged-in user"),
    db: Session = Depends(get_db),
):
    """
    Ask the Adaptive Engine for the next sign to practice.

    Response:
        {
          "sign":     str,       — sign name, e.g. 'Ayubowan'
          "category": str,       — e.g. 'Greetings'
          "mode":     str,       — 'cold_start' | 'review' | 'new'
          "mastery":  float|null — current mastery score (null if never seen)
        }
    """
    return adaptive_engine.get_next_sign(db, user_id)


@router.get("/session/mastery")
def mastery_summary(
    user_id: int = Query(..., description="ID of the logged-in user"),
    db: Session = Depends(get_db),
):
    """
    Return the full mastery table for a user — one entry per sign attempted.
    Sorted by score descending (most mastered first).
    """
    signs = mastery_engine.get_mastery_summary(db, user_id)
    return {"user_id": user_id, "signs": signs, "total": len(signs)}
