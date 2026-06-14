import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, Document, DocumentTag
from app.schemas.document import DocumentResponse
from app.auth import require_role
from app.ocr import run_ocr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}


def _save_upload(file: UploadFile, patient_id: int) -> tuple[str, str]:
    """
    Save an uploaded file to disk under uploads/{patient_id}/{uuid_filename}.
    Returns (file_path, original_filename).
    """
    ext = os.path.splitext(file.filename or "file")[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    patient_dir = os.path.join(settings.UPLOAD_DIR, str(patient_id))
    os.makedirs(patient_dir, exist_ok=True)

    file_path = os.path.join(patient_dir, unique_name)
    with open(file_path, "wb") as f:
        content = file.file.read()
        f.write(content)

    return file_path, file.filename or "unknown"


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tag: str = Form("other"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> DocumentResponse:
    """
    Upload a document (patients only). Supports PDF, PNG, JPG, JPEG, WEBP.
    OCR is run automatically after upload if a Gemini API key is configured.
    """
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not supported. "
                   f"Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # Validate tag
    try:
        doc_tag = DocumentTag(tag)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tag '{tag}'. Allowed: {[t.value for t in DocumentTag]}",
        )

    # Save file to disk
    file_path, original_filename = _save_upload(file, current_user.id)

    # Run OCR automatically
    ocr_text = ""
    try:
        ocr_text = run_ocr(file_path, file.content_type or "")
    except Exception as e:
        logger.error(f"OCR failed for {file_path}: {e}")

    document = Document(
        patient_id=current_user.id,
        title=title,
        description=description,
        tag=doc_tag,
        file_path=file_path,
        original_filename=original_filename,
        mime_type=file.content_type or "application/octet-stream",
        ocr_text=ocr_text or None,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> DocumentResponse:
    """Get a single document owned by the current patient."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.patient_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> list[DocumentResponse]:
    """List all documents for the current patient, optionally filtered by tag."""
    query = db.query(Document).filter(Document.patient_id == current_user.id)

    if tag:
        # Validate the tag value
        try:
            doc_tag = DocumentTag(tag)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid tag '{tag}'. Allowed: {[t.value for t in DocumentTag]}",
            )
        query = query.filter(Document.tag == doc_tag)

    return query.order_by(Document.uploaded_at.desc()).all()


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> None:
    """Delete a document and its file from disk."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.patient_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Remove file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    db.delete(document)
    db.commit()


@router.get("/{document_id}/file")
def get_document_file(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> FileResponse:
    """Serve the raw uploaded document file (patients only)."""
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.patient_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    return FileResponse(
        path=document.file_path,
        media_type=document.mime_type,
        filename=document.original_filename,
    )
