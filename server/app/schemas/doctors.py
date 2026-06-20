from pydantic import BaseModel
from typing import Optional
from datetime import time


class ClinicBrief(BaseModel):
    id: int
    name: str
    address: Optional[str] = None

    model_config = {"from_attributes": True}


class ScheduleBrief(BaseModel):
    id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool

    model_config = {"from_attributes": True}


class DoctorListItem(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    clinics: list[ClinicBrief]
    schedules: list[ScheduleBrief]

    model_config = {"from_attributes": True}
