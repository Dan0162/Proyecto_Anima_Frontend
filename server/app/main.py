import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.db.database import init_db_from_sql
from server.api import router as api_router
from server.db.models.user import Base   # importa el Base que contiene tus modelos
from server.db.session import engine  # importa el engine de la base de datos
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError

from server.middlewares.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Cuando se obtenga el dominio se agrega aqui
]

#proteccion CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra los handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.on_event("startup")
def on_startup():
    init_db_from_sql()
    #Base.metadata.drop_all(bind=engine)
    #Base.metadata.create_all(bind=engine)  

app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 