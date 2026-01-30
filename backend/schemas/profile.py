from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class ExamBase(BaseModel):
    name: str
    status: str


SOPStatus = Literal["Not started", "In progress", "Draft", "Ready"]


class ProfileCreate(BaseModel):
    current_education_level: Optional[str] = None
    degree_major: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None
    intended_degree: Optional[str] = None
    field_of_study: Optional[str] = None
    target_intake_year: Optional[int] = None
    preferred_countries: Optional[List[str]] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    funding_plan: Optional[str] = None
    exams: Optional[List[ExamBase]] = None
    # Accept string values for sop_status to preserve compatibility with existing DB values.
    sop_status: Optional[str] = None


class ProfileUpdate(ProfileCreate):
    pass


class ProfileResponse(ProfileCreate):
    id: str
    user_id: str
    onboarding_complete: bool
    strength_academics: Optional[str] = None
    strength_exams: Optional[str] = None
    strength_sop: Optional[str] = None

    class Config:
        from_attributes = True
