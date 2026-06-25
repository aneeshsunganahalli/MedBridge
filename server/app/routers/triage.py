from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User, Clinic, TriageSession, Appointment, AppointmentStatus
from app.schemas.triage import TriageInitiateRequest, TriageInitiateResponse, TriageSessionResponse
from app.utils.sms_service import send_message
from app.auth import require_role

router = APIRouter(prefix="/api/triage", tags=["Triage"])

@router.post("/initiate", response_model=TriageInitiateResponse)
def initiate_triage(payload: TriageInitiateRequest, db: Session = Depends(get_db)):
    """Public endpoint to initiate a triage session via SMS/WhatsApp."""
    clinic = db.query(Clinic).filter(Clinic.id == payload.clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")

    # Clean phone number (strip whitespace)
    phone = payload.phone.strip()

    # Look up patient
    patient = db.query(User).filter(User.phone == phone, User.role == "patient").first()
    
    # Check if there's an existing active session
    session = db.query(TriageSession).filter(
        TriageSession.phone == phone,
        TriageSession.status != "closed"
    ).first()

    if not session:
        session = TriageSession(
            phone=phone,
            clinic_id=clinic.id,
            patient_id=patient.id if patient else None,
            channel=payload.channel,
            status="pending"
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Prepare message
    if patient:
        msg = f"Hi {patient.full_name.split()[0]}, welcome to {clinic.name}. Reply with: 1 for Fever, 2 for Pain, 3 for Follow-up, 4 for Prescription Refill, or type your main complaint."
    else:
        msg = f"Welcome to {clinic.name}. Reply with your name and main complaint to check in."

    # Send message via Twilio
    success = send_message(phone, msg, payload.channel)
    
    return TriageInitiateResponse(
        session_id=session.id,
        message="Message sent successfully" if success else "Failed to send message (check server logs). Simulated locally.",
        status=session.status
    )

@router.post("/webhook")
async def twilio_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives incoming SMS/WhatsApp messages from Twilio."""
    form_data = await request.form()
    from_number = form_data.get("From", "")
    body = form_data.get("Body", "").strip()

    # Clean up whatsapp: prefix if present
    phone = from_number.replace("whatsapp:", "")
    channel = "whatsapp" if "whatsapp:" in from_number else "sms"

    # Find active session
    session = db.query(TriageSession).filter(
        TriageSession.phone == phone,
        TriageSession.status == "pending"
    ).order_by(TriageSession.created_at.desc()).first()

    if not session:
        # If no active session, we might just ignore or send a default reply
        return Response(status_code=200)

    # Process complaint
    complaint_map = {
        "1": "Fever",
        "2": "Pain",
        "3": "Follow-up",
        "4": "Prescription Refill"
    }
    processed_complaint = complaint_map.get(body, body)

    session.complaint = processed_complaint
    session.status = "responded"
    db.commit()

    # If it's a known patient, try to update their latest booked appointment for today at this clinic
    if session.patient_id:
        today = datetime.utcnow().date()
        appt = db.query(Appointment).filter(
            Appointment.patient_id == session.patient_id,
            Appointment.clinic_id == session.clinic_id,
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.booked
        ).first()

        if appt:
            if appt.pre_clinic_concerns:
                appt.pre_clinic_concerns += f"\n[Triage Update]: {processed_complaint}"
            else:
                appt.pre_clinic_concerns = f"[Triage]: {processed_complaint}"
            db.commit()

        reply_msg = f"Thanks! Your doctor has been notified about: {processed_complaint}. Please have a seat in the waiting area."
    else:
        reply_msg = f"Thanks! The reception desk has received your info: {processed_complaint}. We will call you shortly."

    send_message(phone, reply_msg, channel)
    return Response(status_code=200)

@router.get("/active", response_model=list[TriageSessionResponse])
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor"))
):
    """Get active triage sessions for the doctor's clinics."""
    # Find all clinics for this doctor
    clinics = db.query(Clinic).filter(Clinic.doctor_id == current_user.id).all()
    clinic_ids = [c.id for c in clinics]

    sessions = db.query(TriageSession).filter(
        TriageSession.clinic_id.in_(clinic_ids),
        TriageSession.status != "closed"
    ).order_by(TriageSession.updated_at.desc()).all()

    result = []
    for s in sessions:
        resp = TriageSessionResponse.model_validate(s)
        if s.patient:
            resp.patient_name = s.patient.full_name
        result.append(resp)

    return result

@router.patch("/{session_id}/close", response_model=TriageSessionResponse)
def close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor"))
):
    """Close a triage session."""
    session = db.query(TriageSession).filter(TriageSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Verify doctor owns the clinic
    clinic = db.query(Clinic).filter(Clinic.id == session.clinic_id, Clinic.doctor_id == current_user.id).first()
    if not clinic:
        raise HTTPException(status_code=403, detail="Not authorized")

    session.status = "closed"
    db.commit()
    db.refresh(session)
    
    resp = TriageSessionResponse.model_validate(session)
    if session.patient:
        resp.patient_name = session.patient.full_name
    return resp
