from pydantic import BaseModel
from typing import Optional


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    shortlist_id: Optional[str] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    category: Optional[str] = None
    shortlist_id: Optional[str] = None


class TodoResponse(TodoCreate):
    id: str
    user_id: str
    shortlist_id: Optional[str] = None
    completed: bool

    class Config:
        from_attributes = True
