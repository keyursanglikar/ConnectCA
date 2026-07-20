# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import Any, List
# from datetime import datetime

# from app.core.database import get_db
# from app.core.dependencies import get_current_user
# from app.models.user import User
# from app.models.notification import Notification
# from pydantic import BaseModel

# router = APIRouter(prefix="/notifications", tags=["Notifications"])


# class NotificationResponse(BaseModel):
#     id: int
#     user_id: int
#     type: str
#     message: str
#     read: bool
#     data: dict
#     created_at: datetime

#     class Config:
#         from_attributes = True


# @router.get("/", response_model=List[NotificationResponse])
# async def get_notifications(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     """Get all notifications for current user"""
#     notifications = db.query(Notification).filter(
#         Notification.user_id == current_user.id
#     ).order_by(Notification.created_at.desc()).limit(50).all()
#     return notifications


# @router.post("/{notification_id}/read")
# async def mark_notification_read(
#     notification_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     """Mark notification as read"""
#     notification = db.query(Notification).filter(
#         Notification.id == notification_id,
#         Notification.user_id == current_user.id
#     ).first()
    
#     if not notification:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Notification not found"
#         )
    
#     notification.read = True
#     db.commit()
    
#     return {"message": "Notification marked as read"}


# @router.post("/read-all")
# async def mark_all_notifications_read(
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ) -> Any:
#     """Mark all notifications as read"""
#     db.query(Notification).filter(
#         Notification.user_id == current_user.id,
#         Notification.read == False
#     ).update({"read": True})
#     db.commit()
    
#     return {"message": "All notifications marked as read"}





# app/api/v1/notifications.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.notification import Notification  # ✅ Import from models
from app.schemas.notification import (
    NotificationResponse,
    NotificationCreate,
    NotificationUpdate,
    NotificationListResponse
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ============ GET NOTIFICATIONS ============
@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all notifications for the current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    total = query.count()
    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "unread_count": db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count(),
        "notifications": notifications
    }


# ============ MARK AS READ ============
@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read"}


# ============ MARK ALL AS READ ============
@router.post("/mark-all-read")
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {"message": "All notifications marked as read"}


# ============ DELETE NOTIFICATION ============
@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


# ============ CREATE NOTIFICATION (Internal) ============
@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new notification (internal use)"""
    notification = Notification(
        user_id=notification_data.user_id,
        type=notification_data.type,
        message=notification_data.message,
        data=notification_data.data,
        is_read=False,
        created_at=datetime.utcnow()
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification