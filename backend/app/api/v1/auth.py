from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_token
from app.schemas.auth import (
    LoginRequest, 
    RegisterRequest, 
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    ChangePasswordRequest
)
from app.schemas.user import UserResponse, TokenData
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService
from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.client import ClientMaster

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Login user and return tokens"""
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your administrator."
        )
    
    access_token, refresh_token = AuthService.create_tokens(user)
    
    # Log the user role for debugging
    print(f"🔑 User logged in: {user.email}")
    print(f"   Role: {user.role}")
    print(f"   Is Super Admin: {user.is_super_admin}")
    
    # If client logs in, send notification to CA
    if user.role == UserRole.CLIENT:
        try:
            # Find the client record
            client = db.query(ClientMaster).filter(
                ClientMaster.email == user.email
            ).first()
            
            if client:
                # Find the CA
                ca = db.query(User).filter(User.id == client.user_id).first()
                
                if ca:
                    # Create notification in database for CA
                    NotificationService.create_client_login_notification(
                        db=db,
                        ca_user_id=ca.id,
                        client_name=client.name,
                        client_email=client.email
                    )
                    
                    # Send email notification to CA
                    login_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    await EmailService.send_client_login_notification(
                        client_email=client.email,
                        client_name=client.name,
                        ca_email=ca.email,
                        ca_name=ca.name or "CA Firm",
                        login_time=login_time
                    )
                    
                    print(f"📧 Login notification sent to CA: {ca.email}")
                    
                    # Update client's last login time
                    # client.last_login = datetime.utcnow()
                    # db.commit()
        except Exception as e:
            print(f"⚠️ Failed to send login notification: {e}")
            import traceback
            traceback.print_exc()
            # Don't block login if notification fails
    
    # Prepare user response
    user_response = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_super_admin": user.is_super_admin,
        "is_active": user.is_active,
        "is_verified": user.is_verified
    }
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.post("/register", response_model=UserResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Register a new user"""
    # Check if user exists
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
    
    return user


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
    
    # Create new refresh token
    payload = decode_token(refresh_data.refresh_token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    _, new_refresh_token = AuthService.create_tokens(user)
    
    # Prepare user response
    user_response = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_super_admin": user.is_super_admin,
        "is_active": user.is_active,
        "is_verified": user.is_verified
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
) -> Any:
    """Get current user information"""
    return current_user


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
    
    # Generate password reset token
    from app.core.security import create_access_token
    from datetime import timedelta
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "type": "reset_password"
    }
    reset_token = create_access_token(
        token_data,
        expires_delta=timedelta(minutes=30)
    )
    
    # Send password reset email
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
    
    await EmailService.send_email(
        to_email=user.email,
        subject="Password Reset Request",
        body=f"""
Dear {user.name},

You requested to reset your password. Please click the link below to reset your password:

{reset_link}

This link will expire in 30 minutes.

If you didn't request this, please ignore this email.

Best regards,
CA Firm Management Team
        """,
        html_body=f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }}
        .header {{ background-color: #1B2A4A; padding: 20px; color: white; text-align: center; }}
        .content {{ padding: 20px; }}
        .button {{ background-color: #1B2A4A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }}
    </style>
</head>
<body>
    <div class="header">
        <h2>Password Reset Request</h2>
    </div>
    <div class="content">
        <p>Dear <strong>{user.name}</strong>,</p>
        <p>You requested to reset your password. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" class="button">🔑 Reset Password</a>
        </div>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <div class="footer">
            <p>Best regards,<br>CA Firm Management Team</p>
        </div>
    </div>
</body>
</html>
        """
    )
    
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
    
    from app.core.security import get_password_hash
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    # Send confirmation email
    await EmailService.send_email(
        to_email=user.email,
        subject="Password Reset Successful",
        body=f"""
Dear {user.name},

Your password has been successfully reset.

If you didn't perform this action, please contact support immediately.

Best regards,
CA Firm Management Team
        """
    )
    
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Change user password"""
    from app.core.security import verify_password, get_password_hash
    
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
    
    # Generate verification token
    from app.core.security import create_access_token
    from datetime import timedelta
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "type": "email_verification"
    }
    verify_token = create_access_token(
        token_data,
        expires_delta=timedelta(days=7)
    )
    
    # Send verification email
    verify_link = f"{settings.FRONTEND_URL}/verify-email/{verify_token}"
    
    await EmailService.send_email(
        to_email=user.email,
        subject="Verify Your Email Address",
        body=f"""
Dear {user.name},

Please verify your email address by clicking the link below:

{verify_link}

This link will expire in 7 days.

Best regards,
CA Firm Management Team
        """
    )
    
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