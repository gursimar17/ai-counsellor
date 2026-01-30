"""Profile (onboarding) CRUD and completion gate."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.profile import Profile
from schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_or_404(db: Session, user_id: str) -> Profile:
    p = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Profile not found")
    return p


@router.get("", response_model=ProfileResponse)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_or_404(db, user.id)
    return profile


@router.put("", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = _get_or_404(db, user.id)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/complete")
def complete_onboarding(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark onboarding complete. Requires required fields to be set."""
    profile = _get_or_404(db, user.id)
    profile.onboarding_complete = True
    db.commit()
    return {"onboarding_complete": True}
