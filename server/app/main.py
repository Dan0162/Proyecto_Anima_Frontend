import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from server.db.database import init_database
from server.api import router as api_router
from server.db.models.user import Base
from server.db.session import engine
from server.controllers import rekognition_controller
from server.middlewares.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ✅ Inicializar base de datos desde schema.sql al arrancar la app
    init_database()
    # Si prefieres usar SQLAlchemy ORM en lugar de SQL:
    # Base.metadata.drop_all(bind=engine)
    # Base.metadata.create_all(bind=engine)
    yield


# Crear la app FastAPI con el ciclo de vida personalizado
app = FastAPI(lifespan=lifespan)

# Configuración CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar controladores y manejadores
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

app.include_router(api_router)
app.include_router(rekognition_controller.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
