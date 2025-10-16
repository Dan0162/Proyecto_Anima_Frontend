from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserResponse
from server.controllers.user_controller import get_user_by_id


router = APIRouter(prefix="/v1/user", tags=["Users"])

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_by_id(db, user_id)