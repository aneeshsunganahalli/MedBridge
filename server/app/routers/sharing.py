import io
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
import qrcode

from app.database import get_db
from app.models import User, Document, ShareLink, ShareDocument
from app.schemas.share import ShareLinkCreate, ShareLinkResponse, SharedDocumentResponse
from app.auth import require_role, get_current_user

router = APIRouter(prefix="/api/sharing", tags=["Document Sharing"])


@router.post("/", response_model=ShareLinkResponse, status_code=status.HTTP_201_CREATED)
def create_share_link(
    payload: ShareLinkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient")),
) -> ShareLinkResponse:
    """
    Create a shareable link for documents.
    - Folder share: grants access to ALL of the patient's documents.
    - Selective share: grants access only to the specified document_ids.
    """
    # For selective shares, validate the document IDs belong to this patient
    if not payload.is_folder_share:
        if not payload.document_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="document_ids is required for selective (non-folder) shares",
            )
        docs = (
            db.query(Document)
            .filter(
                Document.id.in_(payload.document_ids),
                Document.patient_id == current_user.id,
            )
            .all()
        )
        if len(docs) != len(payload.document_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more document IDs are invalid or do not belong to you",
            )

    token = uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(hours=payload.expires_in_hours)

    allowed_emails_str = None
    if payload.allowed_emails:
        allowed_emails_str = ",".join([e.strip() for e in payload.allowed_emails if e.strip()])

    share_link = ShareLink(
        owner_id=current_user.id,
        token=token,
        expires_at=expires_at,
        is_folder_share=payload.is_folder_share,
        allowed_emails=allowed_emails_str,
    )
    db.add(share_link)
    db.flush()

    # For selective shares, create mapping rows
    if not payload.is_folder_share and payload.document_ids:
        for doc_id in payload.document_ids:
            db.add(ShareDocument(share_link_id=share_link.id, document_id=doc_id))

    db.commit()
    db.refresh(share_link)

    base_url = str(request.base_url).rstrip("/")
    share_url = f"{base_url}/shared/{token}"
    qr_code_url = f"{base_url}/api/sharing/qr/{token}"

    return ShareLinkResponse(
        id=share_link.id,
        owner_id=share_link.owner_id,
        token=share_link.token,
        expires_at=share_link.expires_at,
        is_folder_share=share_link.is_folder_share,
        allowed_emails=share_link.allowed_emails.split(",") if share_link.allowed_emails else None,
        share_url=share_url,
        qr_code_url=qr_code_url,
    )


@router.get("/qr/{token}")
def generate_qr_code(
    token: str, 
    request: Request, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a QR code image for the share link. Requires auth."""
    share_link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not share_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found")

    # Only allow owner or allowed emails to view the QR code
    is_owner = (share_link.owner_id == current_user.id)
    is_allowed = False
    if share_link.allowed_emails:
        allowed_list = [e.strip() for e in share_link.allowed_emails.split(",")]
        is_allowed = current_user.email in allowed_list

    if not is_owner and not is_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this QR code")

    # Use frontend URL from settings instead of backend request.base_url
    from app.config import settings
    frontend_url = settings.BACKEND_CORS_ORIGINS[0] if settings.BACKEND_CORS_ORIGINS else str(request.base_url).rstrip("/")
    share_url = f"{frontend_url}/shared/{token}"

    # Generate QR code in memory
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(share_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")

@router.get("/shared-with-me")
def get_shared_with_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active share links where the current user is in the allowed list."""
    search_str = f"%{current_user.email}%"
    links = db.query(ShareLink).filter(
        ShareLink.expires_at > datetime.utcnow(),
        ShareLink.allowed_emails.like(search_str)
    ).all()
    
    valid_links = []
    for link in links:
        if link.allowed_emails:
            emails = [e.strip() for e in link.allowed_emails.split(",")]
            if current_user.email in emails:
                valid_links.append(link)

    result = []
    for link in valid_links:
        owner = db.query(User).filter(User.id == link.owner_id).first()
        result.append({
            "id": link.id,
            "token": link.token,
            "owner_name": owner.full_name if owner else "Unknown",
            "is_folder_share": link.is_folder_share,
            "expires_at": link.expires_at.isoformat()
        })
    return result


@router.get("/access/{token}", response_model=SharedDocumentResponse)
def access_shared_documents(
    token: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Access shared documents via a public token.
    Requires login, checks allowed_emails if restricted.
    """
    share_link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not share_link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link not found")

    # Check expiration
    if datetime.utcnow() > share_link.expires_at:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Share link has expired")

    # Check allowed emails
    if share_link.allowed_emails and current_user.id != share_link.owner_id:
        allowed_list = share_link.allowed_emails.split(",")
        if current_user.email not in allowed_list:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Your email is not in the allowed list.")

    owner = db.query(User).filter(User.id == share_link.owner_id).first()

    if share_link.is_folder_share:
        # Return all documents belonging to the owner
        documents = db.query(Document).filter(Document.patient_id == share_link.owner_id).all()
    else:
        # Return only the specifically shared documents
        shared_doc_ids = (
            db.query(ShareDocument.document_id)
            .filter(ShareDocument.share_link_id == share_link.id)
            .all()
        )
        doc_ids = [row[0] for row in shared_doc_ids]
        documents = db.query(Document).filter(Document.id.in_(doc_ids)).all()

    doc_list = [
        {
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "tag": doc.tag if isinstance(doc.tag, str) else doc.tag.value,
            "original_filename": doc.original_filename,
            "mime_type": doc.mime_type,
            "ocr_text": doc.ocr_text,
            "uploaded_at": doc.uploaded_at.isoformat(),
        }
        for doc in documents
    ]

    return SharedDocumentResponse(
        owner_name=owner.full_name if owner else "Unknown",
        is_folder_share=share_link.is_folder_share,
        documents=doc_list,
    )

from fastapi.responses import StreamingResponse, FileResponse
import io
import logging
from app.utils.encryption import decrypt_data

logger = logging.getLogger(__name__)

@router.get("/access/{token}/documents/{document_id}/file")
def get_shared_document_file(
    token: str,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Access and download a shared document file using the sharing token.
    Requires login, checks allowed_emails.
    """
    share_link = db.query(ShareLink).filter(ShareLink.token == token).first()
    if not share_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )

    # Check expiration
    if datetime.utcnow() > share_link.expires_at:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Share link has expired",
        )

    # Check allowed emails
    if share_link.allowed_emails and current_user.id != share_link.owner_id:
        allowed_list = share_link.allowed_emails.split(",")
        if current_user.email not in allowed_list:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Verify document belongs to the owner of this share link
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document or document.patient_id != share_link.owner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # If it is not a folder share, verify that this specific document is shared
    if not share_link.is_folder_share:
        is_shared = (
            db.query(ShareDocument)
            .filter(
                ShareDocument.share_link_id == share_link.id,
                ShareDocument.document_id == document_id,
            )
            .first()
        )
        if not is_shared:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this document is not permitted under this share link",
            )

    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )

    with open(document.file_path, "rb") as f:
        encrypted_bytes = f.read()

    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
    except Exception as e:
        logger.error(f"Failed to decrypt shared document {document.id}: {e}")
        decrypted_bytes = encrypted_bytes

    return StreamingResponse(
        io.BytesIO(decrypted_bytes),
        media_type=document.mime_type,
        headers={"Content-Disposition": f'inline; filename="{document.original_filename}"'}
    )
