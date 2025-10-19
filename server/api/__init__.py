from fastapi import APIRouter
from server.api.v1.routes import auth, password_recovery, user, recommend, analysis

router = APIRouter()

router.include_router(auth.router)
router.include_router(user.router)
router.include_router(recommend.router)
router.include_router(analysis.router)
router.include_router(password_recovery.router)
#router.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
#router.include_router(history.router, prefix="/api/v1/history", tags=["History"])
#router.include_router(recommend.router, prefix="/api/v1/recommend", tags=["Recommend"])
