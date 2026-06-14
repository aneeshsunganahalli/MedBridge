from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    description: Optional[str] = None
    tag: str
    file_path: str
    original_filename: str
    mime_type: str
    ocr_text: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
