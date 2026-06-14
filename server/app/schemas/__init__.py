from app.schemas.auth import (
    TokenResponse,
    TokenData,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.user import UserResponse, UserBrief
from app.schemas.clinic import ClinicCreate, ClinicUpdate, ClinicResponse
from app.schemas.schedule import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from app.schemas.appointment import AppointmentCreate, AppointmentResponse
from app.schemas.document import DocumentResponse
from app.schemas.share import ShareLinkCreate, ShareLinkResponse, SharedDocumentResponse
from app.schemas.reminder import ReminderCreate, ReminderUpdate, ReminderResponse
from app.schemas.dashboard import DoctorDashboard, PatientDashboard
