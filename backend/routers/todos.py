"""To-do list CRUD."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.todo import Todo
from schemas.todo import TodoCreate, TodoUpdate, TodoResponse
from auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[TodoResponse])
def list_todos(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Todo).filter(Todo.user_id == user.id).order_by(Todo.created_at).all()


@router.post("", response_model=TodoResponse)
def create_todo(
    data: TodoCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate shortlist_id if provided
    if data.shortlist_id:
        from models.university import UniversityShortlist
        shortlist = db.query(UniversityShortlist).filter(
            UniversityShortlist.id == data.shortlist_id,
            UniversityShortlist.user_id == user.id,
        ).first()
        if not shortlist:
            raise HTTPException(status_code=404, detail="Shortlist not found or does not belong to user")
    
    todo = Todo(
        id=str(uuid.uuid4()),
        user_id=user.id,
        shortlist_id=data.shortlist_id,
        title=data.title,
        description=data.description,
        category=data.category,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: str,
    data: TodoUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(todo, k, v)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(
    todo_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.user_id == user.id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(todo)
    db.commit()
    return {"ok": True}
