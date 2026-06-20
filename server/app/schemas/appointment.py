from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date, time, datetime


class AppointmentCreate(BaseModel):
    doctor_id: int
    clinic_id: int
    appointment_date: date
    start_time: time
    end_time: time
    notes: Optional[str] = None

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v: time, info) -> time:
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v

    @field_validator("appointment_date")
    @classmethod
    def not_in_past(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("appointment_date cannot be in the past")
        return v


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    clinic_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class AppointmentDetailResponse(AppointmentResponse):
    """Enriched response with resolved names for list views."""
    patient_name: str
    doctor_name: str
    clinic_name: str


class BookedSlotResponse(BaseModel):
    """Slot info returned for availability checking."""
    start_time: time
    end_time: time
    status: str

    model_config = {"from_attributes": True}
