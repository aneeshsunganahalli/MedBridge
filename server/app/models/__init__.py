from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date, Time,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime
import enum


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"


class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"


class DocumentTag(str, enum.Enum):
    prescription = "prescription"
    report = "report"
    scan = "scan"
    bill = "bill"
    discharge_summary = "discharge_summary"
    other = "other"


class ReminderType(str, enum.Enum):
    medication = "medication"
    appointment = "appointment"
    custom = "custom"


# ─── User ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: int = Column(Integer, primary_key=True, index=True)
    full_name: str = Column(String(255), nullable=False)
    email: str = Column(String(255), unique=True, index=True, nullable=False)
    password_hash: str = Column(String(255), nullable=False)
    role: str = Column(SAEnum(UserRole), nullable=False)
    phone: str = Column(String(20), nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    clinics = relationship("Clinic", back_populates="doctor", cascade="all, delete-orphan")
    schedules = relationship("DoctorSchedule", back_populates="doctor", cascade="all, delete-orphan")
    patient_appointments = relationship(
        "Appointment", back_populates="patient", foreign_keys="Appointment.patient_id"
    )
    doctor_appointments = relationship(
        "Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id"
    )
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")
    share_links = relationship("ShareLink", back_populates="owner", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="patient", cascade="all, delete-orphan")


# ─── Clinic ──────────────────────────────────────────────────────────────────

class Clinic(Base):
    __tablename__ = "clinics"

    id: int = Column(Integer, primary_key=True, index=True)
    doctor_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    name: str = Column(String(255), nullable=False)
    address: str = Column(Text, nullable=True)
    description: str = Column(Text, nullable=True)
    phone: str = Column(String(20), nullable=True)

    # Relationships
    doctor = relationship("User", back_populates="clinics")
    appointments = relationship("Appointment", back_populates="clinic")


# ─── Doctor Schedule ─────────────────────────────────────────────────────────

class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"

    id: int = Column(Integer, primary_key=True, index=True)
    doctor_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week: int = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time: str = Column(Time, nullable=False)
    end_time: str = Column(Time, nullable=False)
    is_available: bool = Column(Boolean, default=True, nullable=False)

    # Relationships
    doctor = relationship("User", back_populates="schedules")


# ─── Appointment ─────────────────────────────────────────────────────────────

class Appointment(Base):
    __tablename__ = "appointments"

    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinic_id: int = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status: str = Column(
        SAEnum(AppointmentStatus), default=AppointmentStatus.booked, nullable=False
    )
    notes: str = Column(Text, nullable=True)

    # Relationships
    patient = relationship("User", back_populates="patient_appointments", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="doctor_appointments", foreign_keys=[doctor_id])
    clinic = relationship("Clinic", back_populates="appointments")


# ─── Document ────────────────────────────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    tag: str = Column(SAEnum(DocumentTag), default=DocumentTag.other, nullable=False)
    file_path: str = Column(String(500), nullable=False)
    original_filename: str = Column(String(255), nullable=False)
    mime_type: str = Column(String(100), nullable=False)
    ocr_text: str = Column(Text, nullable=True)
    uploaded_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    patient = relationship("User", back_populates="documents")
    shared_in = relationship("ShareDocument", back_populates="document", cascade="all, delete-orphan")


# ─── Share Link ──────────────────────────────────────────────────────────────

class ShareLink(Base):
    __tablename__ = "share_links"

    id: int = Column(Integer, primary_key=True, index=True)
    owner_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    token: str = Column(String(255), unique=True, index=True, nullable=False)
    expires_at: datetime = Column(DateTime, nullable=False)
    is_folder_share: bool = Column(Boolean, default=False, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="share_links")
    shared_documents = relationship("ShareDocument", back_populates="share_link", cascade="all, delete-orphan")


# ─── Share Document (mapping table) ─────────────────────────────────────────

class ShareDocument(Base):
    __tablename__ = "share_documents"

    id: int = Column(Integer, primary_key=True, index=True)
    share_link_id: int = Column(Integer, ForeignKey("share_links.id"), nullable=False)
    document_id: int = Column(Integer, ForeignKey("documents.id"), nullable=False)

    # Relationships
    share_link = relationship("ShareLink", back_populates="shared_documents")
    document = relationship("Document", back_populates="shared_in")


# ─── Reminder ────────────────────────────────────────────────────────────────

class Reminder(Base):
    __tablename__ = "reminders"

    id: int = Column(Integer, primary_key=True, index=True)
    patient_id: int = Column(Integer, ForeignKey("users.id"), nullable=False)
    title: str = Column(String(255), nullable=False)
    description: str = Column(Text, nullable=True)
    reminder_time: datetime = Column(DateTime, nullable=False)
    type: str = Column(SAEnum(ReminderType), default=ReminderType.custom, nullable=False)
    is_completed: bool = Column(Boolean, default=False, nullable=False)

    # Relationships
    patient = relationship("User", back_populates="reminders")
