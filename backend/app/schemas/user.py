from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = "CA"


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    # CA Specific Fields (stored in ca_masters)
    firm_name: Optional[str] = Field(None, max_length=255)
    firm_address: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=50)
    pan_number: Optional[str] = Field(None, max_length=20)
    specialization: Optional[str] = Field(None, max_length=100)
    experience: Optional[int] = Field(None, ge=0, le=50)
    registration_number: Optional[str] = Field(None, max_length=50)
    birthdate: Optional[datetime] = None
    profile_picture: Optional[str] = None
    
    is_super_admin: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    birthdate: Optional[datetime] = None
    profile_picture: Optional[str] = None
    
    # CA Specific Fields
    firm_name: Optional[str] = Field(None, max_length=255)
    firm_address: Optional[str] = None
    gst_number: Optional[str] = Field(None, max_length=50)
    pan_number: Optional[str] = Field(None, max_length=20)
    specialization: Optional[str] = Field(None, max_length=100)
    experience: Optional[int] = Field(None, ge=0, le=50)
    registration_number: Optional[str] = Field(None, max_length=50)
    
    # Status
    is_active: Optional[bool] = None
    
    # Password (optional)
    password: Optional[str] = Field(None, min_length=8)


class UserResponse(UserBase):
    id: int
    is_super_admin: bool
    is_active: bool
    is_verified: bool
    
    # CA Specific Fields
    firm_name: Optional[str] = None
    firm_address: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[int] = None
    registration_number: Optional[str] = None
    birthdate: Optional[datetime] = None
    profile_picture: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    # Additional fields (not in DB)
    client_count: Optional[int] = 0

    class Config:
        from_attributes = True


class TokenData(BaseModel):
    user_id: int
    email: str
    role: str
    is_super_admin: bool = False


class UserInDB(UserResponse):
    hashed_password: str

    class Config:
        from_attributes = True