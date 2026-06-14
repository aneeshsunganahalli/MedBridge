"""
Gemini OCR utility — extracts text from images and PDFs using Google Gemini API.
Uses the google-genai SDK (new, supported package).
"""
import base64
import logging
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# Prompt sent to Gemini for OCR extraction and Markdown formatting
OCR_PROMPT = (
    "You are an OCR agent that extracts text from medical documents/images and formats it for Markdown rendering. "
    "Your output MUST be 100% valid Markdown compatible syntax.\n\n"
    "TEXT EXTRACTION RULES:\n"
    "1. Analyze the entire image/page carefully, including handwritten text.\n"
    "2. For unclear handwriting, use context clues or mark as [unclear].\n"
    "3. Organize content logically with proper markdown structure.\n"
    "4. Group related information under appropriate headings.\n\n"
    "MARKDOWN FORMATTING REQUIREMENTS:\n"
    "- Headers: # ## ### (always with space after #)\n"
    "- Bold: **text** (no spaces inside asterisks)\n"
    "- Italic: *text* (no spaces inside asterisks)\n"
    "- Lists: Use - or * with space after, or 1. 2. 3. for numbered lists\n"
    "- Blockquotes: > text (for handwritten notes, annotations, or callouts)\n"
    "- Tables: Use proper Markdown table syntax if structured/tabular data is present\n"
    "- Line breaks: Use double newlines for paragraphs\n"
    "- Horizontal rules: ---\n\n"
    "CRITICAL REQUIREMENT: Return only the raw formatted Markdown. Do NOT wrap your output in code blocks (such as ```markdown or ```)."
)


def _get_client() -> Optional[genai.Client]:
    """Return a Gemini client if an API key is configured, otherwise None."""
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set — OCR will be skipped.")
        return None
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _ocr_image_bytes(client: genai.Client, image_bytes: bytes, mime_type: str) -> str:
    """Send a single image to Gemini and return the extracted text."""
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[OCR_PROMPT, image_part],
    )
    return response.text.strip() if response.text else ""


def ocr_image(file_path: str, mime_type: str) -> str:
    """Run OCR on an image file and return extracted text."""
    try:
        client = _get_client()
        if not client:
            return ""
        image_bytes = Path(file_path).read_bytes()
        return _ocr_image_bytes(client, image_bytes, mime_type)
    except Exception as e:
        logger.error(f"OCR failed for image {file_path}: {e}")
        return ""


def ocr_pdf(file_path: str) -> str:
    """
    Extract text from a PDF by rendering each page as an image and running
    Gemini OCR on it. Returns the concatenated text from all pages.
    """
    try:
        client = _get_client()
        if not client:
            return ""

        doc = fitz.open(file_path)
        all_text: list[str] = []

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            # Render page to a PNG image at 2x resolution for better OCR
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            image_bytes = pix.tobytes("png")
            page_text = _ocr_image_bytes(client, image_bytes, "image/png")
            if page_text:
                all_text.append(f"--- Page {page_num + 1} ---\n{page_text}")

        doc.close()
        return "\n\n".join(all_text)
    except Exception as e:
        logger.error(f"OCR failed for PDF {file_path}: {e}")
        return ""


def run_ocr(file_path: str, mime_type: str) -> str:
    """
    Unified OCR entry point. Dispatches to image or PDF handler based on
    the document's MIME type.
    """
    if mime_type == "application/pdf":
        return ocr_pdf(file_path)
    elif mime_type.startswith("image/"):
        return ocr_image(file_path, mime_type)
    else:
        logger.warning(f"Unsupported MIME type for OCR: {mime_type}")
        return ""
