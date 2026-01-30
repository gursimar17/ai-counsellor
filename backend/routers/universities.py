"""University discovery, shortlist, and locking."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.profile import Profile
from models.university import UniversityShortlist
from models.todo import Todo
from auth import get_current_user
from schemas.university import UniversityShortlistCreate, UniversityShortlistResponse, UniversityLock
from services.universities import fetch_universities
from services.stage import get_stage
import uuid

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("/search")
async def search(
    country: str | None = Query(None),
    name: str | None = Query(None),
    user: User = Depends(get_current_user),
):
    """Search external API for universities. Returns list with cost/acceptance."""
    results = await fetch_universities(country=country, name=name)
    return {"universities": results}


@router.get("/shortlist", response_model=list[UniversityShortlistResponse])
def list_shortlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(UniversityShortlist).filter(UniversityShortlist.user_id == user.id).order_by(UniversityShortlist.locked.desc(), UniversityShortlist.created_at).all()
    return rows


@router.post("/shortlist", response_model=UniversityShortlistResponse)
def add_to_shortlist(
    data: UniversityShortlistCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rec = UniversityShortlist(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=data.name,
        country=data.country,
        domain=data.domain,
        web_page=data.web_page,
        category=data.category,
        cost_level=data.cost_level,
        acceptance_chance=data.acceptance_chance,
        fit_reason=data.fit_reason,
        risks=data.risks,
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.delete("/shortlist/{shortlist_id}")
def remove_from_shortlist(
  shortlist_id: str,
  user: User = Depends(get_current_user),
  db: Session = Depends(get_db),
):
    rec = db.query(UniversityShortlist).filter(
        UniversityShortlist.id == shortlist_id,
        UniversityShortlist.user_id == user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    # Remove any todos tied to this shortlist explicitly to ensure cleanup
    try:
        db.query(Todo).filter(Todo.shortlist_id == rec.id, Todo.user_id == user.id).delete(synchronize_session=False)
    except Exception:
        pass
    db.delete(rec)
    db.commit()
    return {"ok": True}


@router.post("/shortlist/{shortlist_id}/lock")
def set_lock(
  shortlist_id: str,
  body: UniversityLock,
  user: User = Depends(get_current_user),
  db: Session = Depends(get_db),
):
    rec = db.query(UniversityShortlist).filter(
        UniversityShortlist.id == shortlist_id,
        UniversityShortlist.user_id == user.id,
    ).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    # If locking newly, generate recommended todo checklist for this university
    was_locked = bool(rec.locked)
    rec.locked = body.lock
    db.commit()

    if body.lock and not was_locked:
        # Create a standard set of todos for an application to this university
        # Add one or two university-specific unique tasks using fit_reason/risk/domain
        unique_hint = None
        if rec.fit_reason:
            unique_hint = rec.fit_reason.split(".")[0]
        elif rec.risks:
            unique_hint = rec.risks.split(".")[0]
        elif rec.domain:
            unique_hint = f"Mention faculty or labs from {rec.domain}"
        else:
            unique_hint = rec.country

        templates = [
            {"title": f"Prepare Statement of Purpose (SOP) for {rec.name}", "category": "sop"},
            {"title": f"Request 2-3 Letters of Recommendation for {rec.name}", "category": "lor"},
            {"title": f"Collect official transcripts for {rec.name}", "category": "documents"},
            {"title": f"Schedule/prepare for English test (IELTS/TOEFL) if required for {rec.name}", "category": "exams"},
            {"title": f"Schedule/prepare for GRE/GMAT if required for {rec.name}", "category": "exams"},
            {"title": f"Complete and submit application to {rec.name}", "category": "forms"},
            {"title": f"Apply for scholarships/financial aid for {rec.name}", "category": "finance"},
        ]

        # university-specific unique tasks
        unique_tasks = []
        if unique_hint:
            unique_tasks.append({
                "title": f"Tailor SOP to highlight: {unique_hint}",
                "category": "sop",
            })
            unique_tasks.append({
                "title": f"Address key challenge: {unique_hint} in your application materials for {rec.name}",
                "category": "strategy",
            })

        all_templates = templates + unique_tasks
        for t in all_templates:
            todo = Todo(
                id=str(uuid.uuid4()),
                user_id=user.id,
                shortlist_id=rec.id,
                title=t["title"],
                description=None,
                category=t.get("category"),
            )
            db.add(todo)
        db.commit()

    return {"locked": rec.locked}


@router.get("/recommendations")
async def recommendations(
  user: User = Depends(get_current_user),
  db: Session = Depends(get_db),
):
    """Return universities tailored to profile (preferred countries) as dream/target/safe."""
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    countries = (profile.preferred_countries or [])[:3] or ["United States", "United Kingdom", "Canada"]
    all_recs = []
    print(f"[DEBUG] Fetching recommendations for countries: {countries}")
    
    for c in countries:
        try:
            recs = await fetch_universities(country=c)
            for r in recs:
                r["category"] = _category_for(r.get("acceptance_chance", "medium"), r.get("cost_level", "medium"))
            all_recs.extend(recs[:15])
            print(f"[DEBUG] Got {len(recs)} recommendations for {c}")
        except Exception as e:
            print(f"[DEBUG] Error fetching recommendations for {c}: {e}")
            continue
    
    # Dedupe by name
    seen = set()
    out = []
    for r in all_recs:
        if r["name"] in seen:
            continue
        seen.add(r["name"])
        out.append(r)
    
    dream = [x for x in out if x.get("category") == "dream"]
    target = [x for x in out if x.get("category") == "target"]
    safe = [x for x in out if x.get("category") == "safe"]
    print(f"[DEBUG] Returning {len(dream)} dream, {len(target)} target, {len(safe)} safe universities")
    result = {"dream": dream[:5], "target": target[:5], "safe": safe[:5]}
    print(f"[DEBUG] Final response object: {result}")
    return result


def _category_for(acceptance: str, cost: str) -> str:
    if acceptance == "low" and cost in ("high", "medium"):
        return "dream"
    if acceptance == "high":
        return "safe"
    return "target"
