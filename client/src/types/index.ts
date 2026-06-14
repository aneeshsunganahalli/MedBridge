export type UserRole = "patient" | "doctor";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  created_at: string;
}

export interface UserBrief {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Clinic {
  id: number;
  doctor_id: number;
  name: string;
  address?: string | null;
  description?: string | null;
  phone?: string | null;
}

export interface ClinicCreate {
  name: string;
  address?: string;
  description?: string;
  phone?: string;
}

export interface ClinicUpdate {
  name?: string;
  address?: string;
  description?: string;
  phone?: string;
}

export interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: number; // 0=Monday, 6=Sunday
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  is_available: boolean;
}

export interface ScheduleCreate {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
}

export interface ScheduleUpdate {
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  is_available?: boolean;
}

export type AppointmentStatus = "booked" | "completed" | "cancelled";

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  appointment_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  status: AppointmentStatus;
}

export interface AppointmentCreate {
  doctor_id: number;
  clinic_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
}

export type DocumentTag =
  | "prescription"
  | "report"
  | "scan"
  | "bill"
  | "discharge_summary"
  | "other";

export interface Document {
  id: number;
  patient_id: number;
  title: string;
  description?: string | null;
  tag: DocumentTag;
  file_path: string;
  original_filename: string;
  mime_type: string;
  ocr_text?: string | null;
  uploaded_at: string;
}

export interface ShareLinkCreate {
  is_folder_share: boolean;
  document_ids?: number[];
  expires_in_hours?: number;
}

export interface ShareLinkResponse {
  id: number;
  owner_id: number;
  token: string;
  expires_at: string;
  is_folder_share: boolean;
  share_url: string;
  qr_code_url: string;
}

export interface SharedDocumentResponse {
  owner_name: string;
  is_folder_share: boolean;
  documents: {
    id: number;
    title: string;
    description?: string | null;
    tag: string;
    original_filename: string;
    mime_type: string;
    ocr_text?: string | null;
    uploaded_at: string;
  }[];
}

export type ReminderType = "medication" | "appointment" | "custom";

export interface Reminder {
  id: number;
  patient_id: number;
  title: string;
  description?: string | null;
  reminder_time: string;
  type: ReminderType;
  is_completed: boolean;
}

export interface ReminderCreate {
  title: string;
  description?: string;
  reminder_time: string;
  type?: ReminderType;
}

export interface ReminderUpdate {
  title?: string;
  description?: string;
  reminder_time?: string;
  type?: ReminderType;
  is_completed?: boolean;
}

export interface UpcomingAppointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface UpcomingReminder {
  id: number;
  title: string;
  reminder_time: string;
  type: string;
  is_completed: boolean;
}

export interface DoctorDashboard {
  total_clinics: number;
  total_appointments: number;
  upcoming_appointments: UpcomingAppointment[];
  recent_appointments: UpcomingAppointment[];
}

export interface PatientDashboard {
  total_documents: number;
  total_appointments: number;
  upcoming_appointments: UpcomingAppointment[];
  upcoming_reminders: UpcomingReminder[];
}
