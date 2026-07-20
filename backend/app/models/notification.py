# from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from app.core.database import Base


# class Notification(Base):
#     __tablename__ = "notifications"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     type = Column(String(50), nullable=False)  # login, document, payment, status, submission
#     message = Column(String(500), nullable=False)
#     is_read = Column(Boolean, default=False)
#     data = Column(JSON, default=dict)
#     created_at = Column(DateTime, server_default=func.now())

#     # Relationships
#     user = relationship("User", back_populates="notifications")

#     def __repr__(self):
#         return f"<Notification {self.type}: {self.message[:50]}>"


# app/models/notification.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.type} - {self.id}>"