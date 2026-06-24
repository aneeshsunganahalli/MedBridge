from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


class UpcomingAppointment(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    clinic_id: int
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    pre_clinic_concerns: Optional[str] = None
    post_visit_summary: Optional[str] = None
    patient_name: str
    doctor_name: str
    clinic_name: str

    model_config = {"from_attributes": True}


class UpcomingReminder(BaseModel):
    id: int
    title: str
    reminder_time: datetime
    type: str
    is_completed: bool

    model_config = {"from_attributes": True}


class DoctorDashboard(BaseModel):
    total_clinics: int
    total_appointments: int
    upcoming_appointments: list[UpcomingAppointment]
    recent_appointments: list[UpcomingAppointment]


class PatientDashboard(BaseModel):
    total_documents: int
    total_appointments: int
    upcoming_appointments: list[UpcomingAppointment]
    upcoming_reminders: list[UpcomingReminder]
