from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DocumentStatus(str, enum.Enum):
    PENDING_UPLOAD = "pending_upload"
    UPLOADED = "uploaded"
    APPROVED = "approved"
    REJECTED = "rejected"
    RE_UPLOAD = "re_upload_required"


class Data(Base):
    __tablename__ = "data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("client_masters.id", ondelete="CASCADE"), nullable=False)
    fy_id = Column(Integer, ForeignKey("fy_master.id", ondelete="CASCADE"), nullable=False)
    file_title = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    document_type = Column(String(50), nullable=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING_UPLOAD)
    gdrive_file_id = Column(String(255), nullable=True)
    gdrive_web_link = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="documents")
    client = relationship("ClientMaster", backref="documents")
    fy = relationship("FYMaster", backref="documents")

    def __repr__(self):
        return f"<Document {self.file_title}>"