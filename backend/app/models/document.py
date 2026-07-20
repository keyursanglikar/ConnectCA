# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, DECIMAL, JSON
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.core.database import Base
# import enum


# class DocumentStatus(str, enum.Enum):
#     PENDING_UPLOAD = "PENDING_UPLOAD"
#     UPLOADED = "UPLOADED"
#     APPROVED = "APPROVED"
#     REJECTED = "REJECTED"
#     RE_UPLOAD_REQUIRED = "RE_UPLOAD_REQUIRED"


# class Document(Base):
#     __tablename__ = "documents"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
#     fy_id = Column(Integer, ForeignKey("fy_master.id", ondelete="CASCADE"), nullable=False)
    
#     document_type = Column(String(100), nullable=False)
#     file_title = Column(String(255), nullable=False)
#     file_name = Column(String(255), nullable=True)
#     file_size = Column(Integer, nullable=True)
#     file_type = Column(String(50), nullable=True)
    
#     status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING_UPLOAD)
#     gdrive_file_id = Column(String(255), nullable=True)
#     gdrive_web_link = Column(String(500), nullable=True)
#     local_path = Column(String(500), nullable=True)
    
#     remarks = Column(Text, nullable=True)
#     uploaded_at = Column(DateTime, server_default=func.now())
#     updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
#     uploaded_by = Column(String(50), default="client")
    
#     # ⭐ SINGLE SOURCE OF TRUTH - Classification results stored once
#     bill_as = Column(String(50), default="ignore")
#     detected_label = Column(String(255), nullable=True)
#     confidence = Column(String(20), nullable=True)
    
#     # Fee confirmation tracking
#     fee_confirmed = Column(Boolean, default=False)
#     fee_confirmed_at = Column(DateTime, nullable=True)

#     # Relationships
#     user = relationship("User", back_populates="documents")
#     client = relationship("ClientMaster", back_populates="documents")
#     fy = relationship("FYMaster", back_populates="documents")
#     document_fee_matches = relationship("ClientFeeMatch", back_populates="document", cascade="all, delete-orphan")
#     bill_items = relationship("BillItem", back_populates="document")

#     def __repr__(self):
#         return f"<Document {self.file_title} ({self.status})>"






# app/models/document.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum, DECIMAL, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DocumentStatus(str, enum.Enum):
    PENDING_UPLOAD = "PENDING_UPLOAD"
    UPLOADED = "UPLOADED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RE_UPLOAD_REQUIRED = "RE_UPLOAD_REQUIRED"


class DocumentSource(str, enum.Enum):
    CLIENT = "client"
    CA = "ca"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    fy_id = Column(Integer, ForeignKey("fy_master.id", ondelete="CASCADE"), nullable=False)
    
    document_type = Column(String(100), nullable=False)
    file_title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
    
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING_UPLOAD)
    source = Column(String(20), default=DocumentSource.CLIENT)
    
    gdrive_file_id = Column(String(255), nullable=True)
    gdrive_web_link = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=True)
    
    # OneDrive integration
    onedrive_link = Column(String(500), nullable=True)
    onedrive_file_id = Column(String(255), nullable=True)
    is_view_only = Column(Boolean, default=True)
    
    remarks = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    uploaded_by = Column(String(50), default="client")
    
    # Classification results
    bill_as = Column(String(50), default="ignore")
    detected_label = Column(String(255), nullable=True)
    confidence = Column(String(20), nullable=True)
    
    # Fee confirmation tracking
    fee_confirmed = Column(Boolean, default=False)
    fee_confirmed_at = Column(DateTime, nullable=True)
    
    # Submission reference - Foreign key to client_submissions
    submission_id = Column(Integer, ForeignKey("client_submissions.id", ondelete="SET NULL"), nullable=True)

    # ✅ FIX: Only define relationships that exist
    user = relationship("User", back_populates="documents")
    client = relationship("ClientMaster", back_populates="documents")
    fy = relationship("FYMaster", back_populates="documents")
    document_fee_matches = relationship("ClientFeeMatch", back_populates="document", cascade="all, delete-orphan")
    bill_items = relationship("BillItem", back_populates="document")
    # ✅ FIX: Remove the 'submission' relationship if it's not defined in ClientSubmission
    # submission = relationship("ClientSubmission", back_populates="documents")

    def __repr__(self):
        return f"<Document {self.file_title} ({self.status})>"