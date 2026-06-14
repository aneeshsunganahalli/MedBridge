"""
APScheduler-based reminder scheduler.
Checks for due reminders every minute and logs them.
Architecture supports future SMS/email notification channels.
"""
import logging
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Reminder

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def check_due_reminders() -> None:
    """
    Query for all incomplete reminders whose reminder_time has passed
    and log them. This is the hook point for future notification channels
    (SMS, email, push, etc.).
    """
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        due_reminders = (
            db.query(Reminder)
            .filter(
                Reminder.is_completed == False,  # noqa: E712
                Reminder.reminder_time <= now,
            )
            .all()
        )

        for reminder in due_reminders:
            # ── Log the reminder ────────────────────────────────────────
            logger.info(
                f"🔔 REMINDER DUE — "
                f"Patient ID: {reminder.patient_id} | "
                f"Title: {reminder.title} | "
                f"Type: {reminder.type} | "
                f"Time: {reminder.reminder_time}"
            )

            # ── Future: send SMS / email / push notification here ──────
            # notify_patient(reminder)

            # Mark as completed so it isn't triggered again
            reminder.is_completed = True

        db.commit()

        if due_reminders:
            logger.info(f"✅ Processed {len(due_reminders)} due reminder(s).")
    except Exception as e:
        logger.error(f"Error checking reminders: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> None:
    """Start the APScheduler background scheduler with a 1-minute interval."""
    scheduler.add_job(
        check_due_reminders,
        "interval",
        minutes=1,
        id="check_due_reminders",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("🕐 Reminder scheduler started (checking every 1 minute).")


def stop_scheduler() -> None:
    """Gracefully shut down the scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("🛑 Reminder scheduler stopped.")
