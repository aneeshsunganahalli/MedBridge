from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class MedicalProfileResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    active_medications: Optional[str] = None
    medical_conditions: Optional[str] = None

    model_config = {"from_attributes": True}

class MedicalProfileUpdate(BaseModel):
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    active_medications: Optional[str] = None
    medical_conditions: Optional[str] = None
