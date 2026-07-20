from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class FYMaster(Base):
    __tablename__ = "fy_master"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(String(10), unique=True, nullable=False, index=True)
    status = Column(Boolean, default=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    documents = relationship("Document", back_populates="fy")

    def __repr__(self):
        return f"<FYMaster {self.year}>"