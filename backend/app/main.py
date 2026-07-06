
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import predict, auth, session, progress
from app.services import inference
from app.database import create_tables
import traceback

app = FastAPI(title='MudraLearn API')

# Allow React frontend to call this API with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
)

# Global exception handler — ensures CORS headers are present even on 500 errors.
# Without this, unhandled exceptions bypass CORSMiddleware and the browser reports
# "blocked by CORS policy" instead of the real error.
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()  # print full traceback to uvicorn terminal
    return JSONResponse(
        status_code=500,
        content={'detail': 'Internal server error', 'error': str(exc)},
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