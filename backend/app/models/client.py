from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, DECIMAL, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ClientStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"


class ClientType(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"
    HUF = "HUF"
    PARTNERSHIP = "PARTNERSHIP"
    COMPANY = "COMPANY"
    LLP = "LLP"


class FeeStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class ClientMaster(Base):
    __tablename__ = "client_masters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    ca_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    client_type = Column(Enum(ClientType), default=ClientType.INDIVIDUAL)
    pan_number = Column(String(20), nullable=True)
    aadhaar_number = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    business_name = Column(String(255), nullable=True)
    gst_number = Column(String(50), nullable=True)
    dob = Column(DateTime, nullable=True)
    
    status = Column(Enum(ClientStatus), default=ClientStatus.PENDING)
    is_verified = Column(Boolean, default=False)
    
    total_fee = Column(DECIMAL(10, 2), default=0.00)
    paid_fee = Column(DECIMAL(10, 2), default=0.00)
    pending_fee = Column(DECIMAL(10, 2), default=0.00)
    fee_status = Column(Enum(FeeStatus), default=FeeStatus.PENDING)
    fee_confirmed = Column(Boolean, default=False)
    fee_confirmed_at = Column(DateTime, nullable=True)
    
    documents_required = Column(JSON, default=list)
    documents_uploaded = Column(JSON, default=list)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="client_profile")
    ca_user = relationship("User", foreign_keys=[ca_user_id], back_populates="clients")
    documents = relationship("Document", back_populates="client", lazy="dynamic")
    published_pamplates = relationship("PublishedFeePamplate", back_populates="client")
    client_fee_matches = relationship("ClientFeeMatch", back_populates="client", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="client")
    client_submissions = relationship("ClientSubmission", back_populates="client", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ClientMaster id={self.id} user_id={self.user_id}>"