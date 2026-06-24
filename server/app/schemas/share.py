from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ShareLinkCreate(BaseModel):
    is_folder_share: bool = False
    document_ids: Optional[list[int]] = None  # Required when is_folder_share=False
    expires_in_hours: int = 24
    allowed_emails: Optional[list[str]] = None


class ShareLinkResponse(BaseModel):
    id: int
    owner_id: int
    token: str
    expires_at: datetime
    is_folder_share: bool
    allowed_emails: Optional[list[str]] = None
    share_url: str
    qr_code_url: str

    model_config = {"from_attributes": True}


class SharedDocumentResponse(BaseModel):
    """Response returned when accessing a shared link (no auth required)."""
    owner_name: str
    is_folder_share: bool
    documents: list[dict]
