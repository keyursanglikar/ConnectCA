# # app/api/v1/__init__.py
# from fastapi import APIRouter
# from .auth import router as auth_router
# from .clients import router as clients_router
# from .fees import router as fees_router
# from .documents import router as documents_router
# from .bills import router as bills_router
# from .submissions import router as submissions_router  # ✅ Add this line
# from .dashboard import router as dashboard_router
# from .notifications import router as notifications_router

# router = APIRouter()

# router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
# router.include_router(clients_router, prefix="/clients", tags=["Clients"])
# router.include_router(fees_router, prefix="/fees", tags=["Fees"])
# router.include_router(documents_router, prefix="/documents", tags=["Documents"])
# router.include_router(bills_router, prefix="/bills", tags=["Bills"])
# router.include_router(submissions_router, prefix="/submissions", tags=["Submissions"])  # ✅ Add this line
# router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
# router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])