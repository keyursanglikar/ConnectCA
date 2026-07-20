# app/schemas/notification.py
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class NotificationBase(BaseModel):
    user_id: int
    type: str
    message: str
    data: Optional[dict] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    is_read: bool = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    message: str
    is_read: bool
    data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    notifications: List[NotificationResponse]