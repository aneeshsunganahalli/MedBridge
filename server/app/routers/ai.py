from typing import List, Optional
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.database import get_db
from app.models import User, Document
from app.auth import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Chatbot"])

class ChatMessage(BaseModel):
    role: str # 'user' or 'model'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    document_ids: Optional[List[int]] = None

class ChatResponse(BaseModel):
    response: str

# System instruction to fine-tune the Gemini model
SYSTEM_INSTRUCTION = """You are MedbridgeAI, an advanced medical triage assistant and health-literacy translator for rural public clinics. 
Your goal is to guide patients through a supportive symptom-gathering dialogue, help them understand medical terminology, and route them to the correct type of doctor based on their symptoms.
If the user provides context from their medical documents, use it to answer their objective questions about their health records.
DO NOT provide definitive medical diagnoses or prescribe treatments. Advise them to consult a professional for a proper diagnosis.
If asked non-medical questions, politely refuse and state your purpose.
Be empathetic, clear, and professional. Use formatting like bullet points or bold text to make your response easy to read."""

@router.post("/chat", response_model=ChatResponse)
def chat_with_medbridge_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ChatResponse:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is currently unavailable."
        )

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Retrieve documents if requested
    context_text = ""
    if request.document_ids:
        docs = db.query(Document).filter(
            Document.id.in_(request.document_ids),
            Document.patient_id == current_user.id
        ).all()
        
        for doc in docs:
            if not doc.ocr_text and os.path.exists(doc.file_path):
                # Try to run OCR dynamically if it failed during upload
                from app.utils.encryption import decrypt_data
                from app.ocr import run_ocr_bytes
                try:
                    with open(doc.file_path, "rb") as f:
                        encrypted_bytes = f.read()
                    
                    try:
                        decrypted_bytes = decrypt_data(encrypted_bytes)
                    except Exception as e:
                        logger.error(f"Failed to decrypt document {doc.id} for dynamic OCR: {e}")
                        decrypted_bytes = encrypted_bytes

                    new_ocr_text = run_ocr_bytes(decrypted_bytes, doc.mime_type)
                    if new_ocr_text:
                        doc.ocr_text = new_ocr_text
                        db.commit()
                except Exception as e:
                    logger.error(f"Dynamic OCR failed for document {doc.id}: {e}")

            if doc.ocr_text:
                context_text += f"--- Document: {doc.title} ---\n{doc.ocr_text}\n\n"
    
    # Prepare contents for Gemini
    contents = []
    
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_INSTRUCTION,
        temperature=0.4,
    )
    
    for msg in request.messages:
        role = msg.role if msg.role in ['user', 'model'] else 'user'
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
        
    # If context is provided, append it to the last user message
    if context_text and len(contents) > 0 and contents[-1].role == 'user':
        last_part = contents[-1].parts[0]
        enriched_text = f"Context from my medical documents:\n{context_text}\n\nMy Question/Input:\n{last_part.text}"
        contents[-1].parts[0] = types.Part.from_text(text=enriched_text)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config,
        )
        return ChatResponse(response=response.text or "I'm sorry, I couldn't generate a response.")
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to communicate with AI service."
        )
