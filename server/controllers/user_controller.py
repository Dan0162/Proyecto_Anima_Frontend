from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.db.models.user import User
from server.schemas.user import UserResponse


def get_user_by_id(db: Session, user_id: int) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.from_orm(user)
