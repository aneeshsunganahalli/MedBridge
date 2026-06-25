from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User, Appointment, Document, Reminder
from app.auth import get_current_user

router = APIRouter(prefix="/api/timeline", tags=["Timeline"])

@router.get("/")
def get_timeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a unified chronological timeline of health events for the current user."""
    events = []
    
    # 1. Appointments
    if current_user.role == "patient":
        appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    else:
        appointments = db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
        
    for appt in appointments:
        # Combine date and time for sorting
        dt = datetime.combine(appt.appointment_date, appt.start_time)
        events.append({
            "type": "appointment",
            "timestamp": dt.isoformat(),
            "title": f"Appointment ({appt.status})",
            "description": f"With {'Doctor' if current_user.role == 'patient' else 'Patient'}",
            "details": appt.post_visit_summary or appt.pre_clinic_concerns,
            "id": appt.id
        })

    # 2. Documents (Patients only for now, or we can check shared documents)
    if current_user.role == "patient":
        documents = db.query(Document).filter(Document.patient_id == current_user.id).all()
        for doc in documents:
            events.append({
                "type": "document",
                "subtype": doc.tag,
                "timestamp": doc.uploaded_at.isoformat(),
                "title": f"Document Uploaded: {doc.title}",
                "description": f"Type: {doc.tag}",
                "details": doc.description,
                "id": doc.id
            })

    # 3. Reminders
    if current_user.role == "patient":
        reminders = db.query(Reminder).filter(Reminder.patient_id == current_user.id).all()
        for rem in reminders:
            events.append({
                "type": "reminder",
                "subtype": rem.type,
                "timestamp": rem.reminder_time.isoformat(),
                "title": f"Reminder: {rem.title}",
                "description": f"Status: {'Completed' if rem.is_completed else 'Pending'}",
                "details": rem.description,
                "id": rem.id
            })
            
    # Sort descending (newest first)
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    return events
