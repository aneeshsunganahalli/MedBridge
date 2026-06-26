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
        status_str = str(appt.status.value if hasattr(appt.status, 'value') else appt.status).replace('_', ' ').title()
        events.append({
            "type": "appointment",
            "timestamp": dt.isoformat(),
            "title": f"Appointment ({status_str})",
            "description": f"With {'Doctor' if current_user.role == 'patient' else 'Patient'}",
            "details": appt.post_visit_summary or appt.pre_clinic_concerns,
            "id": appt.id
        })

    # 2. Documents (Patients only for now, or we can check shared documents)
    if current_user.role == "patient":
        documents = db.query(Document).filter(Document.patient_id == current_user.id).all()
        for doc in documents:
            tag_str = doc.tag.value if hasattr(doc.tag, 'value') else doc.tag
            tag_label = tag_str.replace('_', ' ').title()
            events.append({
                "type": "document",
                "subtype": tag_str,
                "timestamp": doc.uploaded_at.isoformat(),
                "title": f"Document Uploaded: {doc.title}",
                "description": f"Type: {tag_label}",
                "details": doc.description,
                "id": doc.id
            })

    # 3. Reminders
    if current_user.role == "patient":
        reminders = db.query(Reminder).filter(Reminder.patient_id == current_user.id).all()
        
        # Group reminders by title and type
        groups = {}
        for rem in reminders:
            key = f"{rem.title}-{rem.type}"
            if key not in groups:
                groups[key] = []
            groups[key].append(rem)
            
        display_reminders = []
        for group in groups.values():
            group.sort(key=lambda r: r.reminder_time)
            next_pending = next((r for r in group if not r.is_completed), None)
            if next_pending:
                display_reminders.append(next_pending)
            else:
                display_reminders.append(group[-1])
                
        for rem in display_reminders:
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
