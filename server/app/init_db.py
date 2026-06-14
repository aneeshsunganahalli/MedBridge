import os
from app.config import settings
from app.models import Base
from app.database import engine


def init_database() -> None:
    """Create all database tables and the uploads directory."""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Ensure the uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    print("✅ Database tables created successfully.")
    print(f"✅ Upload directory '{settings.UPLOAD_DIR}' ready.")


if __name__ == "__main__":
    init_database()