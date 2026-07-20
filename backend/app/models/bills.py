from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class BillStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    bill_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(Enum(BillStatus), default=BillStatus.PENDING)
    
    total_amount = Column(DECIMAL(10, 2), default=0.00)
    gst_amount = Column(DECIMAL(10, 2), default=0.00)
    grand_total = Column(DECIMAL(10, 2), default=0.00)
    
    notes = Column(Text, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships - Use back_populates
    client = relationship("ClientMaster", back_populates="bills")
    user = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Bill {self.bill_number}>"


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    fee_category_id = Column(Integer, ForeignKey("fee_categories.id", ondelete="SET NULL"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    description = Column(String(500), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    gst_amount = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships - Use back_populates
    bill = relationship("Bill", back_populates="items")
    fee_category = relationship("FeeCategory", back_populates="bill_items")
    document = relationship("Document", back_populates="bill_items")

    def __repr__(self):
        return f"<BillItem {self.description}>"