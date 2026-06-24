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
