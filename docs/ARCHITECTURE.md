# MedBridge System Architecture

## 1. Overview
MedBridge is a modern client-server web application designed to connect patients with medical services, manage appointments, and handle medical documents. It leverages an AI-integrated backend for triage and data processing. 

The system consists of a **React/Vite Frontend** and a **FastAPI (Python) Backend**, utilizing **SQLite** for the database, and is containerized using **Docker**.

---

## 2. Tech Stack

### 2.1 Frontend (Client)
- **Framework:** React 19 

### 2.2 Backend (Server)
- **Framework:** FastAPI

- **Authentication:** JWT (python-jose, bcrypt)
- **AI Integration:** Google GenAI (Gemini)
- **Background Tasks/Scheduling:** APScheduler

### 2.3 Database
- **Engine:** SQLite 
- **Management:** SQLAlchemy Models


---



## 4. Key Workflows and Data Flow

1. **Authentication Flow:**
   - User inputs credentials on the React frontend.
   - Frontend sends a POST request to `/auth/login`.
   - Backend validates against the SQLite database using bcrypt.
   - Backend returns a JWT. Frontend stores it and attaches it as an `Authorization: Bearer` header for subsequent requests.

2. **Document Upload & OCR:**
   - User uploads a medical document via the frontend.
   - Document is sent to `/documents/upload` via `multipart/form-data`.
   - Backend saves the file in the `/uploads/` directory.
   - (Optional) Backend triggers `ocr.py` using `PyMuPDF` to extract text and potentially uses GenAI to structure the parsed data.

3. **AI Triage & Agents:**
   - User interacts with the Medbridge AI component.
   - Frontend calls `/ai/` endpoints.
   - `agent.py` constructs a prompt with user context and queries Google GenAI.
   - The response is streamed or returned to the client and rendered using `react-markdown`.

4. **Background Reminders:**
   - `scheduler.py` runs a background APScheduler instance.
   - It periodically queries the database for upcoming appointments.
   - Uses the Twilio API to dispatch SMS reminders to patients.


