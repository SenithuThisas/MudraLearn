# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import Base
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    # Import all models here so SQLAlchemy's metadata knows about every table.
    # Without these imports, models defined outside user.py are invisible to
    # Base.metadata.create_all() and their tables are silently never created.
    from app.models import progress  # noqa: F401 — registers Progress + MasteryScore
    from app.models.user import EmailOTP, AuthSession  # noqa: F401 — registers OTP + session tables
    Base.metadata.create_all(bind=engine)
