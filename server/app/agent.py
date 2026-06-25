import logging
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from google import genai
from google.genai import types

from app.config import settings
from app.models import Document, Reminder, ReminderType, User

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are an AI medical assistant agent.
Your task is to analyze the OCR text of a medical prescription.
You must extract the medications prescribed and generate a JSON response.
Do NOT include any markdown formatting, only pure JSON.

Output JSON format:
{
  "medications": [
    {
      "name": "Medication Name",
      "dosage": "Dosage instructions (e.g. 500mg)",
      "frequency": "How often to take it (e.g. Twice a day)",
      "duration_days": 7,
      "instructions": "Dynamic descriptive instructions (e.g., Take one tablet after breakfast and one after dinner)",
      "daily_times": ["08:00", "20:00"]
    }
  ]
}

If no medications are found, return {"medications": []}.
"""

def process_prescription_with_llm(document: Document, db: Session):
    """
    Background task to process a prescription document using an LLM.
    Extracts medications, updates the patient's active medications, and creates reminders.
    """
    if not document.ocr_text:
        logger.info(f"Document {document.id} has no OCR text to process.")
        return

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set. Cannot run LLM agent.")
        return

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.1,
            response_mime_type="application/json"
        )
        
        prompt = f"Analyze this prescription text:\n\n{document.ocr_text}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config=config,
        )
        
        result_text = response.text.strip()
        
        try:
            data = json.loads(result_text)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse LLM JSON output for document {document.id}: {result_text}")
            return
            
        medications = data.get("medications", [])
        if not medications:
            logger.info(f"No medications found in document {document.id}.")
            return
            
        patient = db.query(User).filter(User.id == document.patient_id).first()
        if not patient:
            return
            
        # Update active medications string for the patient
        current_meds = patient.active_medications or ""
        new_meds = []
        now = datetime.now()
        for med in medications:
            name = med.get("name", "")
            dosage = med.get("dosage", "")
            freq = med.get("frequency", "")
            instructions = med.get("instructions", f"Dosage: {dosage}\\nFrequency: {freq}")
            daily_times = med.get("daily_times", ["09:00"])
            if name:
                med_str = f"{name} {dosage} ({freq})"
                new_meds.append(med_str)
                
                duration = med.get("duration_days") or 7
                for day in range(duration):
                    for time_str in daily_times:
                        try:
                            # parse HH:MM
                            h, m = map(int, time_str.split(':'))
                            reminder_time = now.replace(hour=h, minute=m, second=0, microsecond=0) + timedelta(days=day)
                            # If it's today but in the past, maybe skip or just keep it (for completeness)
                            # We'll just keep it.
                            reminder = Reminder(
                                patient_id=patient.id,
                                title=f"Take {name}",
                                description=instructions,
                                reminder_time=reminder_time,
                                type=ReminderType.medication,
                                is_completed=False,
                                is_recurring=False
                            )
                            db.add(reminder)
                        except Exception as time_err:
                            logger.error(f"Failed to parse time {time_str}: {time_err}")
                            continue
        
        if new_meds:
            if current_meds:
                patient.active_medications = current_meds + "\\n" + "\\n".join(new_meds)
            else:
                patient.active_medications = "\\n".join(new_meds)
                
        db.commit()
        logger.info(f"Successfully processed prescription {document.id}. Added {len(medications)} meds.")
        
    except Exception as e:
        logger.error(f"Error in LLM agent processing document {document.id}: {e}")
