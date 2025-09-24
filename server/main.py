import uvicorn
from fastapi import FastAPI, Request, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Password hashing
from passlib.context import CryptContext

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse


app = FastAPI()


# --- CORS configuration ---
# Allow typical dev origins (React dev server on :3000) and Vite (:5173) if used.
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- API models and in-memory storage (replace with real DB later) ---
class Item(BaseModel):
    id: int
    name: str
    description: str


class Items(BaseModel):
    items: List[Item]


class AuthPayload(BaseModel):
    email: str
    password: str


temp_memory_db = {"Items": []}

# Simple in-memory users store for demo purposes
# In production replace with a real persistent DB
users_store = {}

# Passlib context for password hashing.
# Use pbkdf2_sha256 for development to avoid bcrypt C-extension build issues on some systems.
# In production, prefer bcrypt or argon2 and ensure the environment has the required dependencies.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# --- API router (backend controls client <-> DB communication here) ---
api_router = APIRouter(prefix="/api")

@api_router.post("/auth/signin")
async def signin(payload: AuthPayload):
    """Placeholder signin endpoint.

    Replace with real authentication (DB lookup, password hashing, token creation).
    """
    # Basic validation
    if not payload.email or not payload.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    # (debug logging removed)

    # Lookup user in in-memory store
    user = users_store.get(payload.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password (bcrypt)
    if not pwd_context.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # On success return a simple token (replace with JWT in real app)
    return {"access_token": f"fake-token-for-{payload.email}", "token_type": "bearer"}


class RegisterPayload(BaseModel):
    name: str
    email: str
    password: str


@api_router.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: RegisterPayload):
    """Placeholder signup endpoint.

    Replace with real registration logic (DB insert, password hashing, validation).
    """
    if not payload.email or not payload.password or not payload.name:
        raise HTTPException(status_code=400, detail="Name, email and password are required")

    # (debug logging removed)

    # Fake check: disallow emails with @test.com as demo
    if "@test.com" in payload.email:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Check for existing user
    if payload.email in users_store:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Hash password with bcrypt and store user
    password_hash = pwd_context.hash(payload.password)
    user = {"id": len(users_store) + 1, "name": payload.name, "email": payload.email, "password_hash": password_hash}
    users_store[payload.email] = user

    # Return created user without password
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


app.include_router(api_router)


# Serve React build (if present) so SPA routes like /signin work when navigating directly.
CLIENT_BUILD_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'build')
if os.path.isdir(CLIENT_BUILD_DIR):
    # Mount static files so built assets (e.g. /static/js/...) are served
    app.mount("/static", StaticFiles(directory=os.path.join(CLIENT_BUILD_DIR, 'static')), name="static")


@app.get("/"
)
async def serve_index():
    """Serve index.html at root when build exists."""
    index_path = os.path.join(CLIENT_BUILD_DIR, 'index.html')
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type='text/html')
    return {"detail": "API root. Build not found."}


@app.get("/{full_path:path}")
async def spa_fallback(request: Request, full_path: str):
    """Return the React app's index.html for any path not handled by API routes.

    This enables direct navigation or page refresh on routes like /signin to load
    the client-side router.
    """
    index_path = os.path.join(CLIENT_BUILD_DIR, 'index.html')
    if os.path.isfile(index_path):
        return HTMLResponse(open(index_path, 'r', encoding='utf-8').read())
    return {"detail": "Not Found"}


