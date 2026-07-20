# from typing import Optional
# import os
# from dotenv import load_dotenv
# from pydantic_settings import BaseSettings
# load_dotenv()


# class Settings:
#     """Application settings"""
    
#     # Database
#     DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:Creed%40sk2024@localhost:3306/ca_firm_db")
    
#     # JWT
#     SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production-123456789")
#     ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
#     REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
#     # Admin
#     ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@cafirm.com")
#     ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    
#     # ============================================
#     # SENDGRID EMAIL CONFIGURATION
#     # ============================================
#     SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
#     SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "")  # Verified sender email
#     SENDGRID_FROM_NAME: str = os.getenv("SENDGRID_FROM_NAME", "CA Firm Management")
    
#     # ============================================
#     # FALLBACK SMTP (Optional - if SendGrid fails)
#     # ============================================
#     SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
#     SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
#     SMTP_USER: str = os.getenv("SMTP_USER", "")
#     SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
#     # ============================================
#     # SYSTEM SETTINGS
#     # ============================================
#     SUPPORT_EMAIL: str = os.getenv("SUPPORT_EMAIL", "support@cafirm.com")
#     SYSTEM_NAME: str = os.getenv("SYSTEM_NAME", "CA Firm Management")
#     FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
#     # Environment
#     ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
#     DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
#       # OneDrive Settings
    
#     ONEDRIVE_CLIENT_ID: Optional[str] = None
#     ONEDRIVE_CLIENT_SECRET: Optional[str] = None
#     ONEDRIVE_TENANT_ID: Optional[str] = None
#     ONEDRIVE_REDIRECT_URI: str = "http://localhost:8000/api/v1/onedrive/callback"
    
#     class Config:
#         env_file = ".env"


# settings = Settings()





# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/ca_firm_db"
    
    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production-123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Super Admin
    ADMIN_EMAIL: str = "admin@cafirm.com"
    ADMIN_PASSWORD: str = "Admin@123"
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "noreply@cafirm.com"
    SENDGRID_FROM_NAME: str = "CA Firm Management"
    
    # System
    SYSTEM_NAME: str = "CA Firm Management"
    SUPPORT_EMAIL: str = "support@cafirm.com"
    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # OneDrive - with defaults
    ONEDRIVE_CLIENT_ID: Optional[str] = None
    ONEDRIVE_CLIENT_SECRET: Optional[str] = None
    ONEDRIVE_TENANT_ID: Optional[str] = None
    ONEDRIVE_REDIRECT_URI: str = "http://localhost:8000/api/v1/onedrive/callback"
    
    class Config:
        # Use the .env file in the root directory
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True  # Make it case sensitive
        extra = "ignore"


# Create settings instance
settings = Settings()

# Log loaded settings on startup
logger.info("=" * 50)
logger.info("CONFIGURATION LOADED:")
logger.info(f"ONEDRIVE_CLIENT_ID: {settings.ONEDRIVE_CLIENT_ID is not None}")
logger.info(f"ONEDRIVE_TENANT_ID: {settings.ONEDRIVE_TENANT_ID is not None}")
logger.info(f"ONEDRIVE_REDIRECT_URI: {settings.ONEDRIVE_REDIRECT_URI}")
logger.info("=" * 50)