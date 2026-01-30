"""Dashboard: profile summary, stage, strength, todos."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.user import User
from models.profile import Profile
from models.todo import Todo
from models.university import UniversityShortlist
from auth import get_current_user
from services.stage import get_stage, get_stage_label
from services.profile_strength import strength_academics, strength_exams, strength_sop
from schemas.profile import ProfileResponse
from schemas.todo import TodoResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    shortlists = db.query(UniversityShortlist).filter(UniversityShortlist.user_id == user.id).all()
    locked_count = sum(1 for s in shortlists if s.locked)
    stage = get_stage(profile, len(shortlists), locked_count)

    # Update cached strengths if we have a simple calculator
    if profile:
        profile.strength_academics = strength_academics(profile.gpa, profile.degree_major)
        # profile.exams is a JSON list of {name, status}
        profile.strength_exams = strength_exams(profile.exams)
        profile.strength_sop = strength_sop(profile.sop_status)
        db.commit()

    todos = db.query(Todo).filter(Todo.user_id == user.id).order_by(Todo.created_at).all()

    return {
        "profile_summary": {
            "education": profile.degree_major or profile.current_education_level or "—",
            "target_intake": profile.target_intake_year or "—",
            "countries": profile.preferred_countries or [],
            "budget": f"{profile.budget_min or '?'} - {profile.budget_max or '?'}" if (profile.budget_min or profile.budget_max) else "—",
        } if profile else None,
        "profile_strength": {
            "academics": profile.strength_academics if profile else "—",
            "exams": profile.strength_exams if profile else "—",
            "sop": profile.strength_sop if profile else "—",
        } if profile else None,
        "stage": stage,
        "stage_label": get_stage_label(stage),
        "onboarding_complete": bool(profile and profile.onboarding_complete),
        "todos": [TodoResponse.model_validate(t) for t in todos],
        "shortlisted_count": len(shortlists),
        "locked_count": locked_count,
    }
