
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, auth, session, progress
from app.services import inference
from app.database import create_tables

app = FastAPI(title='MudraLearn API')

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event('startup')
async def startup():
    create_tables()        # create DB tables if they don't exist
    inference.load_model() # load ML model into memory

app.include_router(predict.router,  prefix='/api',      tags=['predict'])
app.include_router(auth.router,     prefix='/api/auth',  tags=['auth'])
app.include_router(session.router,  prefix='/api',      tags=['session'])
app.include_router(progress.router, prefix='/api',      tags=['progress'])

@app.get('/')
def root():
    return {'status': 'MudraLearn API running'}