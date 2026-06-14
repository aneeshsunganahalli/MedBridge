from pydantic import BaseModel, Field
from typing import Optional


class ClinicCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None


class ClinicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    address: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None


class ClinicResponse(BaseModel):
    id: int
    doctor_id: int
    name: str
    address: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}
