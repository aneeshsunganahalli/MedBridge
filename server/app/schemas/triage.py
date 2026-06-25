from pydantic import BaseModel, constr
from typing import Optional
from datetime import datetime

class TriageInitiateRequest(BaseModel):
    phone: str
    clinic_id: int
    channel: str = "sms"  # "sms" or "whatsapp"

class TriageInitiateResponse(BaseModel):
    session_id: int
    message: str
    status: str

class TriageSessionResponse(BaseModel):
    id: int
    phone: str
    clinic_id: int
    patient_id: Optional[int] = None
    patient_name: Optional[str] = None
    channel: str
    complaint: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
