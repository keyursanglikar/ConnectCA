from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_super_admin
from app.models.user import User, UserRole
from app.models.ca_master import CAMaster
from app.models.client import ClientMaster, ClientStatus
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.schemas.client import ClientCreate, ClientResponse, ClientStatusUpdate
from app.services.auth_service import AuthService
from app.services.client_service import ClientService
from app.services.email_service import EmailService
from app.core.security import get_password_hash

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

# ============ CA User Management ============

@router.post("/ca-users", response_model=UserResponse)
async def create_ca_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Create a new CA user with all details (Super Admin only)"""
    # Check if user exists
    existing = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user (only user table fields)
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.email,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        hashed_password=hashed_password,
        role=UserRole.CA,
        is_super_admin=False,
        is_verified=True,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create CA Master record with CA-specific fields
    ca_master = CAMaster(
        user_id=db_user.id,
        firm_name=user_data.firm_name,
        firm_address=user_data.firm_address,
        gst_number=user_data.gst_number,
        pan_number=user_data.pan_number,
        specialization=user_data.specialization,
        experience=user_data.experience,
        registration_number=user_data.registration_number
    )
    
    db.add(ca_master)
    db.commit()
    db.refresh(ca_master)
    
    # Send credentials email
    try:
        await EmailService.send_ca_credentials(
            email=db_user.email,
            name=db_user.name,
            username=db_user.username,
            password=user_data.password,
            firm_name=user_data.firm_name
        )
    except Exception as e:
        print(f"Email sending failed: {e}")
    
    return db_user


@router.get("/ca-users", response_model=List[UserResponse])
async def get_ca_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Get all CA users with filters (Super Admin only)"""
    query = db.query(User).filter(User.role == UserRole.CA)
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.phone.ilike(f"%{search}%"))
        )
    
    if status:
        if status.lower() == "active":
            query = query.filter(User.is_active == True)
        elif status.lower() == "inactive":
            query = query.filter(User.is_active == False)
    
    users = query.offset(skip).limit(limit).all()
    
    # Add client count for each CA
    for user in users:
        client_count = db.query(ClientMaster).filter(ClientMaster.user_id == user.id).count()
        setattr(user, 'client_count', client_count)
    
    return users


@router.get("/ca-users/{user_id}", response_model=UserResponse)
async def get_ca_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Get a specific CA user with full details (Super Admin only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CA
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CA user not found"
        )
    
    # Get client count
    client_count = db.query(ClientMaster).filter(ClientMaster.user_id == user.id).count()
    setattr(user, 'client_count', client_count)
    
    return user


@router.put("/ca-users/{user_id}", response_model=UserResponse)
async def update_ca_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Update a CA user's details (Super Admin only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CA
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CA user not found"
        )
    
    update_data = user_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key != "password" and hasattr(user, key):
            setattr(user, key, value)
    
    # If password is being updated
    if hasattr(user_data, 'password') and user_data.password:
        user.hashed_password = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/ca-users/{user_id}")
async def delete_ca_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Delete a CA user (Super Admin only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CA
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CA user not found"
        )
    
    # Check if user has clients
    client_count = db.query(ClientMaster).filter(ClientMaster.user_id == user_id).count()
    if client_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete CA with {client_count} clients. Please reassign or delete clients first."
        )
    
    # Delete CA master record first
    ca_master = db.query(CAMaster).filter(CAMaster.user_id == user_id).first()
    if ca_master:
        db.delete(ca_master)
    
    db.delete(user)
    db.commit()
    
    return {"message": "CA user deleted successfully"}


@router.post("/ca-users/{user_id}/toggle-status")
async def toggle_ca_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Toggle CA user active status (Super Admin only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CA
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CA user not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "message": f"CA user {'activated' if user.is_active else 'deactivated'} successfully",
        "is_active": user.is_active
    }


@router.post("/ca-users/{user_id}/reset-password")
async def reset_ca_user_password(
    user_id: int,
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
) -> Any:
    """Reset CA user password (Super Admin only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.role == UserRole.CA
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CA user not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    # Send new credentials email
    try:
        await EmailService.send_ca_credentials(
            email=user.email,
            name=user.name,
            username=user.username,
            password=new_password,
            firm_name=user.firm_name
        )
    except:
        pass
    
    return {"message": "Password reset successfully. New credentials sent via email."}


@router.post("/ca-users/generate-password")
async def generate_random_password(
    length: int = Query(10, ge=8, le=20)
) -> Any:
    """Generate a random password (Helper endpoint)"""
    import secrets
    import string
    
    # Ensure at least one of each type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(string.punctuation)
    ]
    
    # Fill rest with random characters
    remaining = length - len(password)
    all_chars = string.ascii_letters + string.digits + string.punctuation
    password.extend(secrets.choice(all_chars) for _ in range(remaining))
    
    # Shuffle
    secrets.SystemRandom().shuffle(password)
    
    return {"password": ''.join(password)}