from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Clinic
from app.schemas.clinic import ClinicCreate, ClinicUpdate, ClinicResponse
from app.auth import require_role

router = APIRouter(prefix="/api/clinics", tags=["Clinics"])


@router.post("/", response_model=ClinicResponse, status_code=status.HTTP_201_CREATED)
def create_clinic(
    payload: ClinicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ClinicResponse:
    """Create a new clinic (doctors only)."""
    clinic = Clinic(
        doctor_id=current_user.id,
        name=payload.name,
        address=payload.address,
        description=payload.description,
        phone=payload.phone,
    )
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}/public")
def get_clinic_public(clinic_id: int, db: Session = Depends(get_db)):
    """Public endpoint to get basic clinic info for the reception page."""
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    return {
        "id": clinic.id,
        "name": clinic.name,
        "address": clinic.address,
        "doctor_name": clinic.doctor.full_name if clinic.doctor else "Doctor"
    }


@router.put("/{clinic_id}", response_model=ClinicResponse)
def update_clinic(
    clinic_id: int,
    payload: ClinicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ClinicResponse:
    """Update an existing clinic owned by the current doctor."""
    clinic = (
        db.query(Clinic)
        .filter(Clinic.id == clinic_id, Clinic.doctor_id == current_user.id)
        .first()
    )
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(clinic, field, value)

    db.commit()
    db.refresh(clinic)
    return clinic


@router.get("/{clinic_id}", response_model=ClinicResponse)
def get_clinic(
    clinic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> ClinicResponse:
    """Get a single clinic owned by the current doctor."""
    clinic = (
        db.query(Clinic)
        .filter(Clinic.id == clinic_id, Clinic.doctor_id == current_user.id)
        .first()
    )
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    return clinic


@router.get("/", response_model=list[ClinicResponse])
def list_doctor_clinics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
) -> list[ClinicResponse]:
    """List all clinics owned by the current doctor."""
    return db.query(Clinic).filter(Clinic.doctor_id == current_user.id).all()
