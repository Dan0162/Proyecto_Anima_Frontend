from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

# Manejo de errores HTTP (404, 401, etc.)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"HTTP error: {exc.detail} - Path: {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Manejo de errores de validación (Pydantic)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()} - Path: {request.url}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Manejo genérico de errores no controlados
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error: {exc} - Path: {request.url}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )