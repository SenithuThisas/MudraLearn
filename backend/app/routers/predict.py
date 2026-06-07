from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services import inference

router = APIRouter()

class PredictRequest(BaseModel):
    sequence: List[List[float]] # 30 frames x 132 features

class PredictResult(BaseModel):
    sign: str
    confidence: float

@router.post('/predict')
def predict_sign(request: PredictRequest):
    if len(request.sequence) != 30:
        raise HTTPException(400, 'Expected exactly 30 frames')
    if len(request.sequence[0]) != 132:
        raise HTTPException(400, 'Expected 132 features per frame')
        
    results = inference.predict(request.sequence)
    top = results[0]
    return {
        'top_sign' : top['sign'],
        'confidence' : top['confidence'],
        'top3' : results,
        'feedback' : get_feedback(top['confidence'])
    }

def get_feedback(confidence: float) -> str:
    if confidence >= 0.85: return 'great'
    if confidence >= 0.60: return 'okay'
    return 'retry'