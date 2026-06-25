import logging
from twilio.rest import Client
from app.config import settings

logger = logging.getLogger(__name__)

def get_twilio_client():
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio credentials not configured. SMS will be simulated.")
        return None
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

def send_message(to: str, body: str, channel: str = "sms") -> bool:
    """
    Sends an SMS or WhatsApp message using Twilio.
    Returns True on success, False otherwise.
    """
    client = get_twilio_client()
    if not client:
        logger.info(f"SIMULATED {channel.upper()} to {to}: {body}")
        return True

    try:
        if channel == "whatsapp":
            from_number = f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER or settings.TWILIO_PHONE_NUMBER}"
            to_number = f"whatsapp:{to}"
        else:
            from_number = settings.TWILIO_PHONE_NUMBER
            to_number = to

        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to_number
        )
        logger.info(f"Sent {channel} message to {to}, SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send {channel} message to {to}: {e}")
        return False
