from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError

from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.core.security import (
    verify_password, 
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.config import settings


class AuthService:
    """Authentication service"""

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password"""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    @staticmethod
    def create_user(db: Session, user_data: RegisterRequest) -> User:
        """Create a new user"""
        hashed_password = get_password_hash(user_data.password)
        
        db_user = User(
            email=user_data.email,
            username=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            hashed_password=hashed_password,
            role=UserRole(user_data.role) if user_data.role else UserRole.CA,
            is_verified=False,
            is_active=True
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def create_super_admin(db: Session) -> User:
        """Create super admin user if not exists"""
        admin = db.query(User).filter(
            User.email == settings.ADMIN_EMAIL
        ).first()
        
        if admin:
            # Ensure admin has correct role
            if admin.role != UserRole.SUPER_ADMIN:
                admin.role = UserRole.SUPER_ADMIN
                admin.is_super_admin = True
                db.commit()
                db.refresh(admin)
            return admin
        
        hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
        
        admin = User(
            email=settings.ADMIN_EMAIL,
            username=settings.ADMIN_EMAIL,
            name="Super Admin",
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            is_super_admin=True,
            is_verified=True,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return admin

    @staticmethod
    def create_tokens(user: User) -> Tuple[str, str]:
        """Create access and refresh tokens for user"""
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_super_admin": user.is_super_admin,
            "is_active": user.is_active
        }
        
        access_token = create_access_token(
            token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        refresh_token = create_refresh_token(token_data)
        
        return access_token, refresh_token

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[str]:
        """Refresh access token using refresh token"""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Create new access token
        token_data = {
            "sub": user_id,
            "email": payload.get("email"),
            "role": payload.get("role"),
            "is_super_admin": payload.get("is_super_admin", False)
        }
        
        return create_access_token(
            token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )

    @staticmethod
    def verify_email(db: Session, token: str) -> bool:
        """Verify user email using token"""
        payload = decode_token(token)
        if not payload:
            return False
        
        user_id = payload.get("sub")
        if not user_id:
            return False
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        
        user.is_verified = True
        db.commit()
        return True