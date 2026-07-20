from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class CAMaster(Base):
    __tablename__ = "ca_masters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    firm_name = Column(String(255), nullable=True)
    firm_address = Column(Text, nullable=True)
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(20), nullable=True)
    specialization = Column(String(100), nullable=True)
    experience = Column(Integer, nullable=True)
    registration_number = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="ca_master")

    def __repr__(self):
        return f"<CAMaster user_id={self.user_id}>"