"""Apply curriculum seed JSON and unlock batch 1 for every existing user.

    PYTHONPATH=. python -m app.scripts.seed_curriculum
"""

from __future__ import annotations

from loguru import logger

from app.database import SessionLocal
from app.services.curriculum_service import ensure_all_users


def main() -> None:
    db = SessionLocal()
    try:
        count = ensure_all_users(db)
        logger.info("Curriculum seeded; initialized {} user(s)", count)
    except Exception:
        db.rollback()
        logger.exception("Curriculum seed failed")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
