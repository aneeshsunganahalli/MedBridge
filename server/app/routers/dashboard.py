from datetime import datetime, date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import (
    User, Clinic, Appointment, Document, Reminder,
    AppointmentStatus,
)
from app.schemas.dashboard import DoctorDashboard, PatientDashboard, UpcomingAppointment
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _appt_to_dict(appt: Appointment) -> dict:
    """Convert Appointment ORM to UpcomingAppointment-compatible dict with resolved names."""
    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "doctor_id": appt.doctor_id,
        "clinic_id": appt.clinic_id,
        "appointment_date": appt.appointment_date,
        "start_time": appt.start_time,
        "end_time": appt.end_time,
        "status": appt.status,
        "pre_clinic_concerns": appt.pre_clinic_concerns,
        "post_visit_summary": appt.post_visit_summary,
        "patient_name": appt.patient.full_name if appt.patient else "",
        "doctor_name": appt.doctor.full_name if appt.doctor else "",
        "clinic_name": appt.clinic.name if appt.clinic else "",
    }


@router.get("/doctor", response_model=DoctorDashboard)
def doctor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> DoctorDashboard:
    """Return dashboard stats for the current doctor."""
    total_clinics = db.query(Clinic).filter(Clinic.doctor_id == current_user.id).count()

    total_appointments = (
        db.query(Appointment).filter(Appointment.doctor_id == current_user.id).count()
    )

    today = date.today()

    # Upcoming: booked appointments from today onwards, ordered soonest first
    upcoming_appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.doctor), joinedload(Appointment.clinic))
        .filter(
            Appointment.doctor_id == current_user.id,
            Appointment.status == AppointmentStatus.booked,
            Appointment.appointment_date >= today,
        )
        .order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc())
        .limit(10)
        .all()
    )

    # Recent: completed or past appointments, ordered most recent first
    recent_appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.doctor), joinedload(Appointment.clinic))
        .filter(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date < today,
        )
        .order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .limit(10)
        .all()
    )

    return DoctorDashboard(
        total_clinics=total_clinics,
        total_appointments=total_appointments,
        upcoming_appointments=[_appt_to_dict(a) for a in upcoming_appointments],
        recent_appointments=[_appt_to_dict(a) for a in recent_appointments],
    )


@router.get("/patient", response_model=PatientDashboard)
def patient_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> PatientDashboard:
    """Return dashboard stats for the current patient."""
    total_documents = (
        db.query(Document).filter(Document.patient_id == current_user.id).count()
    )

    total_appointments = (
        db.query(Appointment).filter(Appointment.patient_id == current_user.id).count()
    )

    today = date.today()
    now = datetime.utcnow()

    upcoming_appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.patient), joinedload(Appointment.doctor), joinedload(Appointment.clinic))
        .filter(
            Appointment.patient_id == current_user.id,
            Appointment.status == AppointmentStatus.booked,
            Appointment.appointment_date >= today,
        )
        .order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc())
        .limit(10)
        .all()
    )

    upcoming_reminders_all = (
        db.query(Reminder)
        .filter(
            Reminder.patient_id == current_user.id,
            Reminder.is_completed == False,  # noqa: E712
            Reminder.reminder_time >= now,
        )
        .order_by(Reminder.reminder_time.asc())
        .all()
    )

    seen_groups = set()
    upcoming_reminders = []
    for rem in upcoming_reminders_all:
        key = f"{rem.title}-{rem.type}"
        if key not in seen_groups:
            upcoming_reminders.append(rem)
            seen_groups.add(key)
        if len(upcoming_reminders) >= 10:
            break

    return PatientDashboard(
        total_documents=total_documents,
        total_appointments=total_appointments,
        upcoming_appointments=[_appt_to_dict(a) for a in upcoming_appointments],
        upcoming_reminders=upcoming_reminders,
    )
