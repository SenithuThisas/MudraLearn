
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.routers import predict, auth, session, progress, dashboard
from app.services import inference
from app.database import create_tables
from app.rate_limit import limiter
import os
import traceback

app = FastAPI(title='MudraLearn API')

# Rate limiting (slowapi) — used by the auth endpoints (e.g. /auth/check-email).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Catch unhandled exceptions and turn them into JSON 500s. This must be a
# middleware added BEFORE CORSMiddleware (i.e. wrapped by it): a plain
# @app.exception_handler(Exception) runs in Starlette's ServerErrorMiddleware,
# which sits OUTSIDE CORSMiddleware, so its response carries no CORS headers
# and the browser reports "blocked by CORS policy" instead of the real error.
@app.middleware('http')
async def unhandled_exception_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        traceback.print_exc()  # print full traceback to uvicorn terminal
        body = {'detail': 'Internal server error'}
        if os.getenv('ENV', 'development') != 'production':
            body['error'] = str(exc)  # dev convenience; never leaked in production
        return JSONResponse(status_code=500, content=body)

# Allow React frontend to call this API with credentials. Added last so it is
# the outermost app middleware and stamps CORS headers on every response,
# including the 500s produced above.
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
)

@app.on_event('startup')
async def startup():
    create_tables()        # create DB tables if they don't exist
    inference.load_model() # load ML model into memory

app.include_router(predict.router,  prefix='/api',      tags=['predict'])
app.include_router(auth.router,     prefix='/api/auth',  tags=['auth'])
app.include_router(session.router,  prefix='/api',      tags=['session'])
app.include_router(progress.router, prefix='/api',      tags=['progress'])
app.include_router(dashboard.router, prefix='/api',     tags=['dashboard'])

@app.get('/')
def root():
    return {'status': 'MudraLearn API running'}