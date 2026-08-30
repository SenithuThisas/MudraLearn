# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services import adaptive_engine, mastery_engine

router = APIRouter()


@router.get("/session/next")
def next_sign(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
    return adaptive_engine.get_next_sign(db, current_user.id)


@router.get("/session/mastery")
def mastery_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return the full mastery table for a user — one entry per sign attempted.
    Sorted by score descending (most mastered first).
    """
    signs = mastery_engine.get_mastery_summary(db, current_user.id)
    return {"user_id": str(current_user.id), "signs": signs, "total": len(signs)}
