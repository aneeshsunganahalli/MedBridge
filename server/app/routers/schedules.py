from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, DoctorSchedule
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from app.auth import require_role

router = APIRouter(prefix="/api/schedules", tags=["Doctor Schedules"])


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ScheduleResponse:
    """Add a new availability slot for the current doctor."""
    schedule = DoctorSchedule(
        doctor_id=current_user.id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_available=payload.is_available,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ScheduleResponse:
    """Update an existing schedule slot owned by the current doctor."""
    schedule = (
        db.query(DoctorSchedule)
        .filter(DoctorSchedule.id == schedule_id, DoctorSchedule.doctor_id == current_user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> None:
    """Delete a schedule slot owned by the current doctor."""
    schedule = (
        db.query(DoctorSchedule)
        .filter(DoctorSchedule.id == schedule_id, DoctorSchedule.doctor_id == current_user.id)
        .first()
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    db.delete(schedule)
    db.commit()


@router.get("/", response_model=list[ScheduleResponse])
def get_schedules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> list[ScheduleResponse]:
    """List all schedule slots for the current doctor."""
    return (
        db.query(DoctorSchedule)
        .filter(DoctorSchedule.doctor_id == current_user.id)
        .order_by(DoctorSchedule.day_of_week, DoctorSchedule.start_time)
        .all()
    )
