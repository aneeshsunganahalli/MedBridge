from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.medical_snapshot import MedicalProfileResponse, MedicalProfileUpdate
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/medical-profile", tags=["Medical Profile"])

@router.get("/", response_model=MedicalProfileResponse)
def get_medical_profile(
    current_user: User = Depends(get_current_user),
) -> MedicalProfileResponse:
    """Return the current user's medical profile (snapshot)."""
    return current_user

@router.put("/", response_model=MedicalProfileResponse)
def update_medical_profile(
    payload: MedicalProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> MedicalProfileResponse:
    """Update the current patient's medical profile fields."""
    if payload.blood_type is not None:
        current_user.blood_type = payload.blood_type
    if payload.allergies is not None:
        current_user.allergies = payload.allergies
    if payload.emergency_contact_name is not None:
        current_user.emergency_contact_name = payload.emergency_contact_name
    if payload.emergency_contact_phone is not None:
        current_user.emergency_contact_phone = payload.emergency_contact_phone
    if payload.active_medications is not None:
        current_user.active_medications = payload.active_medications
    if payload.medical_conditions is not None:
        current_user.medical_conditions = payload.medical_conditions

    db.commit()
    db.refresh(current_user)
    return current_user
