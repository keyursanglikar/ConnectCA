# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# import logging

# from app.core.config import settings
# from app.core.database import engine, Base
# from app.api.v1 import auth, clients, super_admin, financial_years, notifications, dashboard, fees, bills, client, submissions
# from app.api.v1 import onedrive

# # Configure logging
# logging.basicConfig(
#     level=logging.INFO if not settings.DEBUG else logging.DEBUG,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# # Create tables
# Base.metadata.create_all(bind=engine)

# # Initialize app
# app = FastAPI(
#     title="CA Firm Management API",
#     description="Backend API for CA Firm Management System",
#     version="1.0.0",
#     docs_url="/api/docs" if settings.DEBUG else None,
#     redoc_url="/api/redoc" if settings.DEBUG else None,
# )

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:3000",
#         "http://localhost:5173",
#         "http://localhost:8000",
#         settings.FRONTEND_URL,
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include routers
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(clients.router, prefix="/api", tags=["Clients"])
# app.include_router(client.router, prefix="/api", tags=["Client"])
# app.include_router(super_admin.router, prefix="/api", tags=["Super Admin"])
# app.include_router(financial_years.router, prefix="/api", tags=["Financial Years"])
# app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
# app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
# app.include_router(fees.router, prefix="/api", tags=["Fees"])
# app.include_router(bills.router, prefix="/api", tags=["Bills"])
# app.include_router(submissions.router, prefix="/api", tags=["Submissions"])
# app.include_router(onedrive.router, prefix="/api/v1", tags=["OneDrive"])  # This should work now


# @app.on_event("startup")
# async def startup_event():
#     """Startup event handler"""
#     logger.info("🚀 Starting CA Firm Management API...")
#     logger.info(f"📊 Environment: {settings.ENVIRONMENT}")
    
#     # Create super admin if not exists
#     try:
#         from app.core.database import SessionLocal
#         from app.models.user import User
#         from app.core.security import get_password_hash
        
#         db = SessionLocal()
        
#         admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
#         if not admin:
#             logger.info("👤 Creating Super Admin...")
#             hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
#             admin = User(
#                 email=settings.ADMIN_EMAIL,
#                 username=settings.ADMIN_EMAIL,
#                 name="Super Admin",
#                 hashed_password=hashed_password,
#                 role="SUPER_ADMIN",
#                 is_super_admin=True,
#                 is_verified=True,
#                 is_active=True
#             )
#             db.add(admin)
#             db.commit()
#             logger.info("✅ Super Admin created successfully!")
#             logger.info(f"   Email: {settings.ADMIN_EMAIL}")
#             logger.info(f"   Password: {settings.ADMIN_PASSWORD}")
#         else:
#             if admin.role != "SUPER_ADMIN" or not admin.is_super_admin:
#                 admin.role = "SUPER_ADMIN"
#                 admin.is_super_admin = True
#                 admin.is_verified = True
#                 admin.is_active = True
#                 db.commit()
#                 logger.info("✅ Super Admin role corrected!")
#             else:
#                 logger.info("✅ Super Admin already exists")
        
#         db.close()
#     except Exception as e:
#         logger.error(f"❌ Error creating super admin: {e}")


# @app.on_event("shutdown")
# async def shutdown_event():
#     """Shutdown event handler"""
#     logger.info("👋 Shutting down CA Firm Management API...")


# @app.get("/")
# async def root():
#     """Root endpoint"""
#     return {
#         "name": "CA Firm Management API",
#         "version": "1.0.0",
#         "status": "running",
#         "environment": settings.ENVIRONMENT,
#         "docs": "/api/docs" if settings.DEBUG else None
#     }


# @app.get("/health")
# async def health_check():
#     """Health check endpoint"""
#     return {
#         "status": "healthy",
#         "database": "connected",
#         "environment": settings.ENVIRONMENT
#     }


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(
#         "app.main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=settings.DEBUG
#     )










from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import auth, clients, super_admin, financial_years, notifications, dashboard, fees, bills, client, submissions
from app.api.v1 import onedrive

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize app
app = FastAPI(
    title="CA Firm Management API",
    description="Backend API for CA Firm Management System",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
)

# ✅ CORS middleware - MUST BE FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ✅ FIX: Auth Middleware - Skip OPTIONS requests
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """
    Middleware to handle public endpoints that don't need authentication
    """
    # ✅ CRITICAL: Allow OPTIONS preflight requests to pass through
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Public endpoints (no auth required)
    public_paths = [
        "/",
        "/health",
        "/api/docs",
        "/api/redoc",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/v1/onedrive/login",
        "/api/v1/onedrive/callback",
        "/api/v1/onedrive/public-test",
        "/api/v1/onedrive/status",  # ✅ Add this
    ]
    
    # Check if the current path is public
    path = request.url.path
    is_public = any(
        path == public_path or 
        path.startswith(public_path + "?") or
        path.startswith(public_path + "/") 
        for public_path in public_paths
    )
    
    if is_public:
        return await call_next(request)
    
    # For protected routes, check for token
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        # If it's a browser request, redirect to login
        accept_header = request.headers.get("accept", "")
        if "text/html" in accept_header:
            return RedirectResponse(url="http://localhost:3000/login")
        # API request - return 401
        return JSONResponse(
            status_code=401,
            content={"detail": "Not authenticated"}
        )
    
    return await call_next(request)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(client.router, prefix="/api", tags=["Client"])
app.include_router(super_admin.router, prefix="/api", tags=["Super Admin"])
app.include_router(financial_years.router, prefix="/api", tags=["Financial Years"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(fees.router, prefix="/api", tags=["Fees"])
app.include_router(bills.router, prefix="/api", tags=["Bills"])
app.include_router(submissions.router, prefix="/api", tags=["Submissions"])
app.include_router(onedrive.router, prefix="/api/v1", tags=["OneDrive"])


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("🚀 Starting CA Firm Management API...")
    logger.info(f"📊 Environment: {settings.ENVIRONMENT}")
    
    # Create super admin if not exists
    try:
        from app.core.database import SessionLocal
        from app.models.user import User
        from app.core.security import get_password_hash
        
        db = SessionLocal()
        
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            logger.info("👤 Creating Super Admin...")
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin = User(
                email=settings.ADMIN_EMAIL,
                username=settings.ADMIN_EMAIL,
                name="Super Admin",
                hashed_password=hashed_password,
                role="SUPER_ADMIN",
                is_super_admin=True,
                is_verified=True,
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("✅ Super Admin created successfully!")
            logger.info(f"   Email: {settings.ADMIN_EMAIL}")
            logger.info(f"   Password: {settings.ADMIN_PASSWORD}")
        else:
            if admin.role != "SUPER_ADMIN" or not admin.is_super_admin:
                admin.role = "SUPER_ADMIN"
                admin.is_super_admin = True
                admin.is_verified = True
                admin.is_active = True
                db.commit()
                logger.info("✅ Super Admin role corrected!")
            else:
                logger.info("✅ Super Admin already exists")
        
        db.close()
    except Exception as e:
        logger.error(f"❌ Error creating super admin: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("👋 Shutting down CA Firm Management API...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "CA Firm Management API",
        "version": "1.0.0",
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "docs": "/api/docs" if settings.DEBUG else None
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )