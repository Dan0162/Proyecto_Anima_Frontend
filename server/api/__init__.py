from fastapi import APIRouter
from server.api.v1.routes import auth, password_recovery, user, recommend, analysis, contact, analytics, spotify
from server.db.models.user import User
from server.db.models.session import Session
from server.db.models.analysis import Analysis, Emotion
from server.db.models.password_recovery import PasswordRecovery

router = APIRouter()

router.include_router(auth.router)
router.include_router(user.router)
router.include_router(recommend.router)
router.include_router(analysis.router)
router.include_router(password_recovery.router)
router.include_router(contact.router)   
router.include_router(analytics.router)
router.include_router(spotify.router)