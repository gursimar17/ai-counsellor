"""AI Counsellor chat and action execution."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.profile import Profile
from models.university import UniversityShortlist
from models.todo import Todo
from models.chat import ChatMessage
from auth import get_current_user
from schemas.chat import ChatMessageCreate, ChatMessageResponse, CounsellorResponse
from services.counsellor import invoke_counsellor

router = APIRouter(prefix="/counsellor", tags=["counsellor"])


@router.get("/history", response_model=list[ChatMessageResponse])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return rows


@router.post("/chat", response_model=CounsellorResponse)
def chat(
    body: ChatMessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    shortlists = db.query(UniversityShortlist).filter(UniversityShortlist.user_id == user.id).all()

    # Save user message
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role="user",
        content=body.content,
    )
    db.add(user_msg)
    db.commit()

    # Get AI response and actions
    response_text, actions = invoke_counsellor(db, user.id, body.content, profile, shortlists)
    print(f"[DEBUG] Actions returned from AI: {actions}")

    # Execute actions
    executed = []
    for a in actions:
        t = a.get("type")
        print(f"[DEBUG] Executing action type: {t}, data: {a}")
        if t == "shortlist_add":
            name = a.get("name") or "Unknown"
            country = a.get("country") or "Unknown"
            # Extract all fields with defaults
            domain = a.get("domain")
            category = a.get("category") or "target"  # default to target if not specified
            cost_level = a.get("cost_level")
            acceptance_chance = a.get("acceptance_chance")
            fit_reason = a.get("fit_reason") or f"Recommended for {country}"
            risks = a.get("risks") or "Standard competitive admission"
            
            print(f"[DEBUG] Adding university: name={name}, country={country}, domain={domain}, category={category}, cost={cost_level}, acceptance={acceptance_chance}")
            
            rec = UniversityShortlist(
                id=str(uuid.uuid4()),
                user_id=user.id,
                name=name,
                country=country,
                domain=domain,
                web_page=a.get("web_page"),  # Include web_page if provided
                category=category,
                cost_level=cost_level,
                acceptance_chance=acceptance_chance,
                fit_reason=fit_reason,
                risks=risks,
            )
            db.add(rec)
            executed.append({"type": "shortlist_add", "name": name, "country": country, "category": category})
            print(f"[DEBUG] University queued for DB save: fit_reason={fit_reason}, risks={risks}, domain={domain}")
        elif t == "todo_add":
            title = a.get("title") or "Task"
            shortlist_id = a.get("shortlist_id")
            # Validate shortlist_id belongs to user if provided
            if shortlist_id:
                shortlist_check = db.query(UniversityShortlist).filter(
                    UniversityShortlist.id == shortlist_id,
                    UniversityShortlist.user_id == user.id,
                ).first()
                if not shortlist_check:
                    shortlist_id = None  # Discard invalid shortlist_id
            todo = Todo(
                id=str(uuid.uuid4()),
                user_id=user.id,
                shortlist_id=shortlist_id,
                title=title,
                category=a.get("category"),
            )
            db.add(todo)
            executed.append({"type": "todo_add", "title": title, "shortlist_id": shortlist_id})
        elif t == "lock" and a.get("shortlist_id"):
            rec = db.query(UniversityShortlist).filter(
                UniversityShortlist.id == a["shortlist_id"],
                UniversityShortlist.user_id == user.id,
            ).first()
            if rec:
                rec.locked = True
                executed.append({"type": "lock", "shortlist_id": rec.id})

    db.commit()
    print(f"[DEBUG] All actions committed to DB. Executed: {executed}")

    # Save assistant message with full action details for frontend
    assistant_msg = ChatMessage(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role="assistant",
        content=response_text,
        actions=actions if actions else None,  # Store full actions with all details
    )
    db.add(assistant_msg)
    db.commit()

    return CounsellorResponse(message=response_text, actions=actions if actions else None)  # Return full actions
