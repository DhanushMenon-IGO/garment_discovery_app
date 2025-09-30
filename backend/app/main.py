from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from typing import List
import os

from app.routes import garments, discovery                # import routers

class Seed(BaseModel):
    season: str | None = None
    keywords: list[str] = []

app = FastAPI(title="Trent PoC API")

# CORS for localhost:5173 (frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # you can restrict to ["http://localhost:5173"] later
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
IMAGE_DIR = os.path.join(BASE_DIR, "data", "images")

# Mount static folder
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount images folder
app.mount("/images", StaticFiles(directory=IMAGE_DIR), name="images")

# Register routes
app.include_router(garments.router, prefix="/garments")
app.include_router(discovery.router, prefix="/discovery")

@app.get("/health")
def health():
    return {"status": "ok"}

class RunRequest(BaseModel):
    season: str
    keywords: List[str]


