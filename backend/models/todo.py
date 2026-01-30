"""To-do tasks (AI-generated and user)."""
from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shortlist_id = Column(String(36), ForeignKey("university_shortlists.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    category = Column(String(100), nullable=True)  # sop / exams / forms / general
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="todos")
    shortlist = relationship("UniversityShortlist", back_populates="todos")
