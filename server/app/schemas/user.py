from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserBrief(BaseModel):
    """Minimal user info for embedding in other responses."""
    id: int
    full_name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}
