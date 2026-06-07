from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User
import os

router = APIRouter()
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

def make_token(user_id: int) -> str:
    payload = {
        'sub': str(user_id),
        'exp': datetime.utcnow() + timedelta(minutes=30)
    }
    return jwt.encode(payload, os.getenv('SECRET_KEY'),
                      algorithm=os.getenv('ALGORITHM', 'HS256'))

@router.post('/register')
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, 'Username already taken')
        
    user = User(
        username = req.username,
        email = req.email,
        hashed_password = pwd_context.hash(req.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {'message': 'Registered', 'user_id': user.id}

@router.post('/login')
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(401, 'Invalid credentials')
    return {'access_token': make_token(user.id), 'token_type': 'bearer'}
