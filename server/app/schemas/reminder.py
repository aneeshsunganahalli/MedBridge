from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    reminder_time: datetime
    type: str = Field(default="custom", pattern="^(medication|appointment|custom)$")
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|yearly)$")


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    reminder_time: Optional[datetime] = None
    type: Optional[str] = Field(None, pattern="^(medication|appointment|custom)$")
    is_completed: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|yearly)$")


class ReminderResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    description: Optional[str] = None
    reminder_time: datetime
    type: str
    is_completed: bool
    is_recurring: bool
    recurrence_pattern: Optional[str] = None

    model_config = {"from_attributes": True}
