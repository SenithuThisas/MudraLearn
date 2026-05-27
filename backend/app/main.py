from fastapi import FastAPI

app = FastAPI(title="MudraLearn API")

@app.get("/")
def root():
    return {"message": "MudraLearn API is running"}