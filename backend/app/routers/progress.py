# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.progress import Progress

router = APIRouter()


@router.get("/progress/history")
def attempt_history(
    user_id: int   = Query(..., description="ID of the logged-in user"),
    limit:   int   = Query(50, ge=1, le=200, description="Max rows to return"),
    db: Session    = Depends(get_db),
):
    """
    Return the most recent practice attempts for a user.
    Useful for debugging the adaptive engine and building a history view.
    """
    rows = (
        db.query(Progress)
        .filter(Progress.user_id == user_id)
        .order_by(Progress.timestamp.desc())
        .limit(limit)
        .all()
    )
    return {
        "user_id": user_id,
        "attempts": [
            {
                "sign_id":     r.sign_id,
                "category":    r.category,
                "confidence":  round(r.confidence, 4),
                "correct":     r.correct,
                "response_ms": r.response_ms,
                "timestamp":   r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in rows
        ],
    }
