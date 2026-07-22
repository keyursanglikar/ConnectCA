# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import logging

from app.core.database import get_db
from app.core.security import decode_token, verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.client import ClientMaster
from app.core.config import settings
from app.services.onedrive_service import OneDriveService

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# ============================================
# SCHEMAS / PYDANTIC MODELS
# ============================================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    role: Optional[str] = "CA"

class UserResponse(BaseModel):
    id: int
    username: str
    name: Optional[str] = None
    email: str
    role: str
    is_super_admin: bool = False
    is_active: bool = True
    is_verified: bool = False
    phone: Optional[str] = None
    created_at: Optional[datetime] = None
    onedrive_connected: bool = False
    onedrive_connected_at: Optional[datetime] = None
    first_time_ca_login: bool = False
    onedrive_refreshed: bool = False

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ============================================
# AUTH SERVICE FUNCTIONS
# ============================================

class AuthService:
    @staticmethod
    def create_user(db: Session, email: str, password: str, name: str, phone: str = None, role: str = "CA"):
        """Create a new user"""
        from app.core.security import get_password_hash
        
        username = email.split('@')[0]
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User(
            username=username,
            email=email,
            name=name,
            phone=phone,
            hashed_password=get_password_hash(password),
            role=UserRole(role.upper()) if role.upper() in [r.value for r in UserRole] else UserRole.CA,
            is_active=True,
            is_verified=True
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def create_tokens(user: User):
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})
        return access_token, refresh_token
    
    @staticmethod
    def refresh_access_token(refresh_token: str):
        payload = decode_token(refresh_token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return create_access_token(data={"sub": str(user_id)})

# ============================================
# ENDPOINTS
# ============================================

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login user and return user data with OneDrive status.
    ✅ Auto-refresh OneDrive token on EVERY login
    """
    # Find user by email or username
    user = db.query(User).filter(
        (User.email == login_data.email) | 
        (User.username == login_data.email)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    # ✅ Auto-verify client on successful login
    if user.role == UserRole.CLIENT and not user.is_verified:
        user.is_verified = True
        db.commit()
        print(f"✅ Client {user.email} auto-verified on login")
    
    # ============================================================
    # ✅ ONEDRIVE TOKEN AUTO-REFRESH ON LOGIN - PERMANENT FIX
    # ============================================================
    onedrive_connected = False
    onedrive_refreshed = False
    onedrive_error = None
    
    print(f"\n🔐 === ONEDRIVE TOKEN CHECK FOR {user.email} ===")
    
    # ✅ ALWAYS try to refresh on login if refresh token exists
    if user.onedrive_refresh_token:
        try:
            print("🔄 Refresh token found, auto-refreshing OneDrive token on login...")
            
            # Initialize OneDrive service
            service = OneDriveService(user=user, db=db)
            
            # ✅ Force refresh the token
            refresh_success = service._refresh_token()
            
            if refresh_success:
                onedrive_connected = True
                onedrive_refreshed = True
                # Refresh user object to get updated tokens
                db.refresh(user)
                print(f"✅ OneDrive token auto-refreshed successfully on login for {user.email}")
            else:
                onedrive_error = "Failed to refresh token"
                print(f"❌ Failed to refresh token on login for {user.email}")
                
        except Exception as e:
            onedrive_error = str(e)
            print(f"❌ Error auto-refreshing token on login: {e}")
    else:
        # No refresh token - check if there's an access token
        if user.onedrive_access_token:
            # Check if token is valid
            service = OneDriveService(user=user, db=db)
            if service._is_token_valid(user.onedrive_access_token):
                onedrive_connected = True
                print(f"✅ OneDrive token exists for {user.email} (no refresh token)")
            else:
                print(f"⚠️ OneDrive token exists but is invalid for {user.email}")
        else:
            print(f"ℹ️ No OneDrive tokens found for {user.email}")
    
    # ✅ Check if this is first time CA login (no OneDrive connection history)
    first_time_ca_login = False
    if user.role == UserRole.CA and not onedrive_connected:
        if not user.onedrive_connected_at:
            first_time_ca_login = True
            print(f"🆕 First time CA login for {user.email} - OneDrive connection needed")
        else:
            print(f"🔄 OneDrive connection exists but token invalid for {user.email} - needs reconnection")
    
    print(f"📊 OneDrive status: connected={onedrive_connected}, refreshed={onedrive_refreshed}")
    print("=" * 50)
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "is_super_admin": user.is_super_admin,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "phone": user.phone,
            "created_at": user.created_at,
            "onedrive_connected": onedrive_connected,
            "onedrive_connected_at": user.onedrive_connected_at,
            "onedrive_refreshed": onedrive_refreshed,  # ✅ Flag for frontend
            "onedrive_error": onedrive_error,
            "first_time_ca_login": first_time_ca_login
        }
    }


@router.post("/register", response_model=UserResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user"""
    existing = db.query(User).filter(
        (User.email == register_data.email) | (User.username == register_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    user = AuthService.create_user(
        db, 
        register_data.email, 
        register_data.password, 
        register_data.name,
        register_data.phone,
        register_data.role or "CA"
    )
    
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_super_admin": user.is_super_admin,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "phone": user.phone,
        "created_at": user.created_at,
        "onedrive_connected": False,
        "onedrive_connected_at": None,
        "first_time_ca_login": True if user.role == UserRole.CA else False
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Refresh access token"""
    new_access_token = AuthService.refresh_access_token(refresh_data.refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(refresh_data.refresh_token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    _, new_refresh_token = AuthService.create_tokens(user)
    
    onedrive_connected = bool(
        user.onedrive_access_token and 
        user.onedrive_token_expiry and 
        user.onedrive_token_expiry > datetime.utcnow().timestamp()
    )
    
    user_response = {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_super_admin": user.is_super_admin,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "phone": user.phone,
        "created_at": user.created_at,
        "onedrive_connected": onedrive_connected,
        "onedrive_connected_at": user.onedrive_connected_at,
        "first_time_ca_login": False
    }
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user info with OneDrive status"""
    onedrive_connected = bool(
        current_user.onedrive_access_token and 
        current_user.onedrive_token_expiry and 
        current_user.onedrive_token_expiry > datetime.utcnow().timestamp()
    )
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "is_super_admin": current_user.is_super_admin,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "phone": current_user.phone,
        "created_at": current_user.created_at,
        "onedrive_connected": onedrive_connected,
        "onedrive_connected_at": current_user.onedrive_connected_at,
        "first_time_ca_login": False
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Logout user (client-side token removal)"""
    return {"message": "Successfully logged out"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Send password reset email"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "type": "reset_password"
    }
    reset_token = create_access_token(
        token_data,
        expires_delta=timedelta(minutes=30)
    )
    
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
    print(f"Password reset link: {reset_link}")
    
    return {"message": "Password reset email sent"}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Reset password using token"""
    payload = decode_token(request.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    if payload.get("type") != "reset_password":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Change user password"""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/verify-email/{token}")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
) -> Any:
    """Verify user email"""
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    user.is_verified = True
    db.commit()
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    email: str,
    db: Session = Depends(get_db)
) -> Any:
    """Resend email verification link"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_verified:
        return {"message": "Email already verified"}
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "type": "email_verification"
    }
    verify_token = create_access_token(
        token_data,
        expires_delta=timedelta(days=7)
    )
    
    verify_link = f"{settings.FRONTEND_URL}/verify-email/{verify_token}"
    print(f"Verification link: {verify_link}")
    
    return {"message": "Verification email sent"}


@router.get("/check-auth")
async def check_auth(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Check if user is authenticated"""
    return {
        "authenticated": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            "is_super_admin": current_user.is_super_admin,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified
        }
    }