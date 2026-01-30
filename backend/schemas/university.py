from pydantic import BaseModel
from typing import Optional


class UniversityShortlistCreate(BaseModel):
    name: str  # Full university name
    country: str  # Country name
    domain: Optional[str] = None  # University domain (e.g., mit.edu)
    web_page: Optional[str] = None  # University website URL
    category: Optional[str] = None  # dream / target / safe
    cost_level: Optional[str] = None  # low / medium / high
    acceptance_chance: Optional[str] = None  # low / medium / high
    fit_reason: Optional[str] = None  # Why this university suits the student
    risks: Optional[str] = None  # Challenges or competitive aspects


class UniversityShortlistResponse(UniversityShortlistCreate):
    id: str
    user_id: str
    locked: bool

    class Config:
        from_attributes = True


class UniversityLock(BaseModel):
    lock: bool  # True to lock, False to unlock
