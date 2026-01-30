from pydantic import BaseModel
from typing import Optional, List, Any


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    actions: Optional[List[Any]] = None

    class Config:
        from_attributes = True


class CounsellorResponse(BaseModel):
    message: str
    actions: Optional[List[Any]] = None  # shortlist_add, lock, todo_add, etc.
