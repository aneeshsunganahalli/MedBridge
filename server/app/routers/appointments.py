from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models import (
    User, Appointment, DoctorSchedule, Clinic, Reminder,
    AppointmentStatus, ReminderType,
)
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def _validate_doctor_availability(
    db: Session, doctor_id: int, appointment_date, start_time, end_time
) -> None:
    """
    Ensure the doctor has a matching schedule slot on the given day/time
    and that no overlapping booked appointment exists.
    """
    # Check doctor has an available schedule for that day-of-week and time window
    day_of_week = appointment_date.weekday()  # 0=Monday
    schedule = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.day_of_week == day_of_week,
            DoctorSchedule.is_available == True,  # noqa: E712
            DoctorSchedule.start_time <= start_time,
            DoctorSchedule.end_time >= end_time,
        )
        .first()
    )
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not available at the requested time",
        )

    # Check for overlapping booked appointments
    overlap = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == doctor_id,
            Appointment.appointment_date == appointment_date,
            Appointment.status == AppointmentStatus.booked,
            # Overlapping condition: existing.start < new.end AND existing.end > new.start
            Appointment.start_time < end_time,
            Appointment.end_time > start_time,
        )
        .first()
    )
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time slot is already booked",
        )


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> AppointmentResponse:
    """Book an appointment (patients only). Validates availability and prevents overlaps."""
    # Verify the doctor exists and is actually a doctor
    doctor = db.query(User).filter(User.id == payload.doctor_id, User.role == "doctor").first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    # Verify the clinic exists and belongs to the doctor
    clinic = (
        db.query(Clinic)
        .filter(Clinic.id == payload.clinic_id, Clinic.doctor_id == payload.doctor_id)
        .first()
    )
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found for this doctor")

    # Validate availability & prevent double-booking
    _validate_doctor_availability(
        db, payload.doctor_id, payload.appointment_date, payload.start_time, payload.end_time
    )

    appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        clinic_id=payload.clinic_id,
        appointment_date=payload.appointment_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=AppointmentStatus.booked,
    )
    db.add(appointment)
    db.flush()  # Get the appointment ID before creating the reminder

    # Automatically create a reminder for the patient 1 hour before the appointment
    appointment_datetime = datetime.combine(payload.appointment_date, payload.start_time)
    reminder_time = appointment_datetime - timedelta(hours=1)
    reminder = Reminder(
        patient_id=current_user.id,
        title=f"Appointment with {doctor.full_name}",
        description=f"Your appointment at {clinic.name} is in 1 hour.",
        reminder_time=reminder_time,
        type=ReminderType.appointment,
        is_completed=False,
    )
    db.add(reminder)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppointmentResponse:
    """Cancel an appointment. Patients can cancel their own appointments."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    # Only the patient who booked or the doctor assigned can cancel
    if current_user.id not in (appointment.patient_id, appointment.doctor_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if appointment.status != AppointmentStatus.booked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel an appointment with status '{appointment.status}'",
        )

    appointment.status = AppointmentStatus.cancelled
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("/patient", response_model=list[AppointmentResponse])
def patient_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> list[AppointmentResponse]:
    """List all appointments for the current patient."""
    return (
        db.query(Appointment)
        .filter(Appointment.patient_id == current_user.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .all()
    )


@router.get("/doctor", response_model=list[AppointmentResponse])
def doctor_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> list[AppointmentResponse]:
    """List all appointments for the current doctor."""
    return (
        db.query(Appointment)
        .filter(Appointment.doctor_id == current_user.id)
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .all()
    )
