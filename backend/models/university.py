"""University shortlist and lock."""
from sqlalchemy import Column, DateTime, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class UniversityShortlist(Base):
    __tablename__ = "university_shortlists"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # External API or dummy: name, country, etc. stored as we fetch
    name = Column(String(500), nullable=False)
    country = Column(String(100), nullable=False)
    domain = Column(String(255), nullable=True)
    web_page = Column(Text, nullable=True)
    # Our computed fields
    category = Column(String(50), nullable=True)  # dream / target / safe
    cost_level = Column(String(50), nullable=True)  # low / medium / high
    acceptance_chance = Column(String(50), nullable=True)  # low / medium / high
    fit_reason = Column(Text, nullable=True)
    risks = Column(Text, nullable=True)
    locked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="shortlists")
    todos = relationship("Todo", back_populates="shortlist")
