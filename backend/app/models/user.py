# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, JSON, Float
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.core.database import Base
# from app.models.ca_master import CAMaster  # Add this import
# import enum


# class UserRole(str, enum.Enum):
#     SUPER_ADMIN = "SUPER_ADMIN"
#     CA = "CA"
#     STAFF = "STAFF"
#     CLIENT = "CLIENT"


# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     username = Column(String(255), unique=True, nullable=False, index=True)
#     name = Column(String(255), nullable=True)
#     email = Column(String(255), unique=True, nullable=False, index=True)
#     hashed_password = Column(String(255), nullable=False)
#     role = Column(Enum(UserRole), default=UserRole.CA)
#     is_super_admin = Column(Boolean, default=False)
#     is_active = Column(Boolean, default=True)
#     is_verified = Column(Boolean, default=False)
#     phone = Column(String(20), nullable=True)
    
#     # ✅ OneDrive Integration Fields
#     onedrive_access_token = Column(String(2000), nullable=True)
#     onedrive_refresh_token = Column(String(2000), nullable=True)
#     onedrive_token_expiry = Column(Float, nullable=True)  # Unix timestamp
#     onedrive_email = Column(String(255), nullable=True)
#     onedrive_connected_at = Column(DateTime, nullable=True)
    
#     # ✅ Last Login Field
#     last_login = Column(DateTime, nullable=True)
    
#     created_at = Column(DateTime, server_default=func.now())
#     updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

#     # Relationships
#     ca_master = relationship("CAMaster", back_populates="user", uselist=False)
#     clients = relationship("ClientMaster", foreign_keys="ClientMaster.ca_user_id", back_populates="ca_user")
#     client_profile = relationship("ClientMaster", foreign_keys="ClientMaster.user_id", back_populates="user", uselist=False)
#     documents = relationship("Document", back_populates="user")
#     fee_categories = relationship("FeeCategory", back_populates="user")
#     notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
#     bills = relationship("Bill", back_populates="user")
#     published_fee_pamphlets = relationship("PublishedFeePamplate", back_populates="user")
#     ca_submissions = relationship("ClientSubmission", foreign_keys="ClientSubmission.ca_user_id", back_populates="ca_user")

#     def __repr__(self):
#         return f"<User {self.username} ({self.email})>"


# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

# ✅ Import CAMaster to resolve the relationship
from app.models.ca_master import CAMaster  # Add this import


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    CA = "CA"
    STAFF = "STAFF"
    CLIENT = "CLIENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CA)
    is_super_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    phone = Column(String(20), nullable=True)
    
    # ✅ OneDrive Integration Fields
    onedrive_access_token = Column(String(5000), nullable=True)  # Increased to 5000
    onedrive_refresh_token = Column(String(5000), nullable=True)  # Increased to 5000
    onedrive_token_expiry = Column(Float, nullable=True)
    onedrive_email = Column(String(255), nullable=True)
    onedrive_connected_at = Column(DateTime, nullable=True)
    
    # ✅ Last Login Field
    last_login = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # ✅ Relationships
    ca_master = relationship("CAMaster", back_populates="user", uselist=False)
    clients = relationship("ClientMaster", foreign_keys="ClientMaster.ca_user_id", back_populates="ca_user")
    client_profile = relationship("ClientMaster", foreign_keys="ClientMaster.user_id", back_populates="user", uselist=False)
    documents = relationship("Document", back_populates="user")
    fee_categories = relationship("FeeCategory", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user")
    published_fee_pamphlets = relationship("PublishedFeePamplate", back_populates="user")
    ca_submissions = relationship("ClientSubmission", foreign_keys="ClientSubmission.ca_user_id", back_populates="ca_user")

    def __repr__(self):
        return f"<User {self.username} ({self.email})>"