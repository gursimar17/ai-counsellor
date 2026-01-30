import enum
from sqlalchemy import Column, DateTime, String, Text, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Define Enums for consistent data
class PrepStatus(enum.Enum):
    NOT_STARTED = "Not started"
    IN_PROGRESS = "In progress"
    DRAFT = "Draft"
    READY = "Ready"
    COMPLETED = "Completed"

class EducationLevel(enum.Enum):
    HIGH_SCHOOL = "High School"
    BACHELORS = "Bachelor's"
    MASTERS = "Master's"
    PHD = "PhD"

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    onboarding_complete = Column(Boolean, default=False)

    # Academic (Standardized)
    # Use plain strings to remain compatible with legacy DB values
    current_education_level = Column(String(100), nullable=True)
    degree_major = Column(String(255), nullable=True) # Usually text as majors are vast
    graduation_year = Column(Integer, nullable=True) # Changed to Integer for sorting
    gpa = Column(String(50), nullable=True)

    # Study goal
    intended_degree = Column(String(100), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    target_intake_year = Column(Integer, nullable=True) 
    preferred_countries = Column(JSON, nullable=True) 

    # Budget (Changed to Integer for calculations)
    budget_min = Column(Integer, nullable=True)
    budget_max = Column(Integer, nullable=True)
    funding_plan = Column(String(100), nullable=True) 

    # Readiness
    # Exams: dynamic list of exams and their statuses, stored as JSON
    exams = Column(JSON, nullable=True)
    # SOP status stored as plain string for backwards compatibility; validate on write
    sop_status = Column(String(50), default=PrepStatus.NOT_STARTED.value)

    # AI Stats
    strength_academics = Column(String(50), nullable=True)
    strength_exams = Column(String(50), nullable=True)
    strength_sop = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")