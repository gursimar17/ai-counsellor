"""Application guidance (unlocked after at least one university locked)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.university import UniversityShortlist
from models.todo import Todo
from auth import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("")
def get_application_guidance(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    locked = db.query(UniversityShortlist).filter(
        UniversityShortlist.user_id == user.id,
        UniversityShortlist.locked == True,
    ).all()
    if not locked:
        raise HTTPException(
            status_code=403,
            detail="Lock at least one university to unlock application guidance.",
        )
    todos = db.query(Todo).filter(Todo.user_id == user.id).order_by(Todo.created_at).all()
    return {
        "locked_universities": [
            {
                "id": u.id,
                "name": u.name,
                "country": u.country,
                "domain": u.domain,
                "web_page": u.web_page,
                "category": u.category,
                "cost_level": u.cost_level,
                "acceptance_chance": u.acceptance_chance,
                "fit_reason": u.fit_reason,
                "risks": u.risks,
                "locked": u.locked,
            }
            for u in locked
        ],
        "required_documents": [
            "Academic transcripts",
            "Degree certificate",
            "English proficiency (IELTS/TOEFL)",
            "GRE/GMAT (if required by program)",
            "Statement of Purpose (SOP)",
            "Letters of recommendation (2–3)",
            "CV/Resume",
            "Passport copy",
        ],
        "timeline": [
            "6–12 months before: Shortlist universities, take exams",
            "4–6 months before: Prepare SOP, LORs, transcripts",
            "2–4 months before: Submit applications",
            "1–2 months before: Follow up, prepare for interviews",
            "After decisions: Accept offer, apply for visa",
        ],
        "todos": [
            {"id": t.id, "title": t.title, "description": t.description, "completed": t.completed, "category": t.category, "shortlist_id": t.shortlist_id}
            for t in todos
        ],
    }
