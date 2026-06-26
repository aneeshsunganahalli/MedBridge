# MedBridge System Architecture Summary

## 1. Overview
MedBridge is a client-server application built to connect patients and medical services, manage appointments, and handle medical documents. It features an AI-integrated backend for triage and data processing.

---

## 2. Tech Stack

### Frontend (Client)
- **Framework:** React 19 (via Vite)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4
- **HTTP Client:** Axios

### Backend (Server)
- **Framework:** FastAPI (Python)
- **Database ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic 2.0
- **Authentication:** JWT (python-jose, bcrypt)
- **AI Integration:** Google GenAI (Gemini)
- **Background Tasks/Scheduling:** APScheduler
- **Utilities:** PyMuPDF & FPDF2 (PDF/OCR processing)

### Database
- **Engine:** SQLite (`medbridge.db`)

---

## 3. Major System Modules

### Client-Side Modules (Frontend)
- **User Interface:** Reusable UI components (modals, forms, AI chat interfaces).
- **State & Context:** Global state management (e.g., AuthContext).
- **API Client Layer:** Centralized API request handlers communicating with the backend.
- **Views/Pages:** Dashboard, Login, Appointments, and AI Triage interfaces.

### Server-Side Modules (Backend)
- **API Gateway (Router):** The core FastAPI router that dispatches incoming requests to the respective domains.
- **Auth & Security:** User authentication, JWT issuance, and secure routing.
- **Appointments & Scheduling:** Logic for booking and managing clinic availability and schedules.
- **Health Records & Documents:** Manages medical data, handles uploads, and performs Optical Character Recognition (OCR) for data extraction.
- **AI & Triage Engine (`agent.py`, `ai.py`):** Integrates with Google GenAI to process patient history, summarize documents, and power the interactive AI triage system.
- **Notification Manager (`scheduler.py`):** Operates on a background loop to trigger automated appointment reminders.

### Data Layer
- **Relational Storage:** SQLite handles all structured entities like user profiles, clinics, and appointments.
- **Local File Storage:** A dedicated local directory (`/uploads/`) stores unstructured data such as uploaded medical PDFs and generated QR code files.
