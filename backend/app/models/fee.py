from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class FeeCategory(Base):
    __tablename__ = "fee_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    base_fee = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    gst_rate = Column(DECIMAL(5, 2), default=18.00)
    
    keywords = Column(JSON, default=list)
    fee_type = Column(String(50), default="basic")
    
    is_active = Column(Boolean, default=True)
    is_system_default = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="fee_categories")
    fee_match_entries = relationship("ClientFeeMatch", back_populates="fee_category", cascade="all, delete-orphan")
    bill_items = relationship("BillItem", back_populates="fee_category")  # Added

    def __repr__(self):
        return f"<FeeCategory {self.name} ({self.code})>"


class ClientFeeMatch(Base):
    __tablename__ = "client_fee_matches"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    fee_category_id = Column(Integer, ForeignKey("fee_categories.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    
    fee_amount = Column(DECIMAL(10, 2), nullable=False)
    gst_amount = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    
    matched_keywords = Column(JSON, default=list)
    match_confidence = Column(DECIMAL(5, 2), default=0.00)
    is_auto_matched = Column(Boolean, default=True)
    is_applied = Column(Boolean, default=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    client = relationship("ClientMaster", back_populates="client_fee_matches")
    fee_category = relationship("FeeCategory", back_populates="fee_match_entries")
    document = relationship("Document", back_populates="document_fee_matches")

    def __repr__(self):
        return f"<ClientFeeMatch {self.client_id} - {self.fee_category_id}>"

class PublishedFeePamplate(Base):
    __tablename__ = "published_fee_pamplate"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    
    fee_data = Column(JSON, nullable=False, default=list)
    total_fee = Column(DECIMAL(10, 2), default=0.00)
    total_gst = Column(DECIMAL(10, 2), default=0.00)
    grand_total = Column(DECIMAL(10, 2), default=0.00)
    
    is_active = Column(Boolean, default=True)
    is_viewed = Column(Boolean, default=False)
    viewed_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    
    # NEW: Version tracking
    version = Column(Integer, default=1)
    
    # NEW: Track which items were accepted (store IDs)
    accepted_item_ids = Column(JSON, default=list)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="published_fee_pamphlets")
    client = relationship("ClientMaster", back_populates="published_pamplates")

    def __repr__(self):
        return f"<PublishedFeePamplate {self.client_id} - {self.user_id} - v{self.version}>"