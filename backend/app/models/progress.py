from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.models.user import Base

class Progress(Base):
    __tablename__ = 'progress'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    sign_id = Column(String) # e.g. 'Ayubowan'
    confidence = Column(Float) # 0.0 to 1.0
correct = Column(Boolean) # True if confidence > 0.60
timestamp = Column(DateTime, default=datetime.utcnow)