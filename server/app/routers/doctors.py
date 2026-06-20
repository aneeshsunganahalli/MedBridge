from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, UserRole
from app.schemas.doctors import DoctorListItem

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


@router.get("/", response_model=list[DoctorListItem])
def list_doctors(db: Session = Depends(get_db)) -> list[DoctorListItem]:
    """Public endpoint: list all doctors with their clinics and schedules."""
    doctors = (
        db.query(User)
        .filter(User.role == UserRole.doctor)
        .options(joinedload(User.clinics), joinedload(User.schedules))
        .all()
    )
    return doctors
