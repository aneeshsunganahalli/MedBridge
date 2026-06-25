from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Reminder
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.auth import require_role

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> ReminderResponse:
    """Create a new reminder (patients only)."""
    reminder = Reminder(
        patient_id=current_user.id,
        title=payload.title,
        description=payload.description,
        reminder_time=payload.reminder_time,
        type=payload.type,
        is_completed=False,
        is_recurring=payload.is_recurring,
        recurrence_pattern=payload.recurrence_pattern,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.post("/patient/{patient_id}", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder_for_patient(
    patient_id: int,
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ReminderResponse:
    """Create a new reminder for a specific patient (doctors only)."""
    # Verify patient exists
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    reminder = Reminder(
        patient_id=patient_id,
        title=payload.title,
        description=payload.description,
        reminder_time=payload.reminder_time,
        type=payload.type,
        is_completed=False,
        is_recurring=payload.is_recurring,
        recurrence_pattern=payload.recurrence_pattern,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    payload: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> ReminderResponse:
    """Update a reminder owned by the current patient."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.patient_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    update_data = payload.model_dump(exclude_unset=True)
    
    # Handle recurring reminder completion
    if "is_completed" in update_data and update_data["is_completed"] and not reminder.is_completed:
        if reminder.is_recurring and reminder.recurrence_pattern:
            from datetime import timedelta
            
            next_time = reminder.reminder_time
            if reminder.recurrence_pattern == "daily":
                next_time += timedelta(days=1)
            elif reminder.recurrence_pattern == "weekly":
                next_time += timedelta(weeks=1)
            elif reminder.recurrence_pattern == "monthly":
                next_time += timedelta(days=30)
            elif reminder.recurrence_pattern == "yearly":
                next_time += timedelta(days=365)
            
            # Create the next occurrence
            next_reminder = Reminder(
                patient_id=reminder.patient_id,
                title=reminder.title,
                description=reminder.description,
                reminder_time=next_time,
                type=reminder.type,
                is_completed=False,
                is_recurring=True,
                recurrence_pattern=reminder.recurrence_pattern,
            )
            db.add(next_reminder)

    for field, value in update_data.items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> None:
    """Delete a reminder owned by the current patient."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.patient_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")

    db.delete(reminder)
    db.commit()


@router.get("/", response_model=list[ReminderResponse])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> list[ReminderResponse]:
    """List all reminders for the current patient, ordered by time."""
    return (
        db.query(Reminder)
        .filter(Reminder.patient_id == current_user.id)
        .order_by(Reminder.reminder_time.asc())
        .all()
    )


from pydantic import BaseModel
import json
from google import genai
from google.genai import types
from datetime import datetime, timedelta
from app.config import settings

class SmartReminderRequest(BaseModel):
    prompt: str
    
class SmartReminderResponse(BaseModel):
    message: str
    count: int

SMART_SYSTEM_INSTRUCTION = """You are an AI medical assistant.
The user will describe a medication or appointment schedule in natural language.
Extract the schedule and return a JSON object with this exact structure:
{
  "title": "Short title (e.g. Take Amoxicillin)",
  "instructions": "Detailed instructions",
  "daily_times": ["08:00", "20:00"], 
  "duration_days": 7,
  "type": "medication"
}
If duration is not specified, assume 1. If it's a single event, return one time and 1 duration day.
For type, use 'medication', 'appointment', or 'custom'.
Do NOT include markdown formatting, ONLY pure JSON.
"""

@router.post("/smart", response_model=SmartReminderResponse)
def create_smart_reminders(
    payload: SmartReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient"))
) -> SmartReminderResponse:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="AI service unavailable")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        config = types.GenerateContentConfig(
            system_instruction=SMART_SYSTEM_INSTRUCTION,
            temperature=0.1,
            response_mime_type="application/json"
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[payload.prompt],
            config=config,
        )
        
        data = json.loads(response.text.strip())
        
        title = data.get("title", "Smart Reminder")
        instructions = data.get("instructions", "")
        daily_times = data.get("daily_times", ["09:00"])
        duration = data.get("duration_days", 1)
        r_type = data.get("type", "custom")
        
        count = 0
        now = datetime.now()
        for day in range(duration):
            for time_str in daily_times:
                try:
                    h, m = map(int, time_str.split(':'))
                    reminder_time = now.replace(hour=h, minute=m, second=0, microsecond=0) + timedelta(days=day)
                    
                    reminder = Reminder(
                        patient_id=current_user.id,
                        title=title,
                        description=instructions,
                        reminder_time=reminder_time,
                        type=r_type,
                        is_completed=False,
                        is_recurring=False
                    )
                    db.add(reminder)
                    count += 1
                except Exception:
                    continue
                    
        db.commit()
        return SmartReminderResponse(message="Smart reminders generated successfully", count=count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
