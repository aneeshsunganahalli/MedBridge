import os
import sys
import random
import uuid
from datetime import date, time, timedelta, datetime
# Add server directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, User, Clinic, DoctorSchedule, Appointment, UserRole, AppointmentStatus, Reminder, ReminderType, Document, DocumentTag, ShareLink, ShareDocument, TriageSession
from app.auth import hash_password

def seed_db():
    print("Seeding database with a massive dataset...")
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Drop and recreate for massive dataset seeding
        print("Dropping existing tables to start fresh...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        pwd = hash_password("password123")
        hashed_pwd = pwd
        
        # --- 1. CONFIGURING DUMMY DATA POOLS ---
        doctor_names = [
            ("Dr. Priya Sharma", "Orthopedics"), ("Dr. Arun Verma", "Dermatology"), 
            ("Dr. Rajesh Iyer", "Cardiology"), ("Dr. Sneha Reddy", "Pediatrics"),
            ("Dr. Amit Patel", "Neurology"), ("Dr. Kavita Nair", "Gynecology"),
            ("Dr. Vikram Singh", "General Medicine"), ("Dr. Neha Gupta", "Ophthalmology"),
            ("Dr. Rohan Das", "Psychiatry"), ("Dr. Meera Joshi", "ENT Specialty"),
            ("Dr. Sanjay Rao", "Gastroenterology"), ("Dr. Divya Menon", "Endocrinology"),
            ("Dr. Alok Mishra", "Pulmonology"), ("Dr. Pooja Hegde", "Dentistry"),
            ("Dr. Sandeep Gill", "Urology"), ("Dr. Ananya Ray", "Oncology"),
            ("Dr. Harish Kumar", "Nephrology"), ("Dr. Swati Shah", "Rheumatology"),
            ("Dr. Nitin Deshmukh", "Podiatry"), ("Dr. Shalini Bose", "Allergy & Immunology")
        ]
        
        patient_first_names = ["Rahul", "Anjali", "Suresh", "Priyanka", "Amit", "Deepika", "Vijay", "Sunita", "Ramesh", "Kiran", "Arjun", "Pooja", "Vikram", "Sneha", "Karan", "Raj", "Kavya", "Mohit", "Tara", "Rohan"]
        patient_last_names = ["Kumar", "Gupta", "Sharma", "Reddy", "Singh", "Joshi", "Das", "Nair", "Patel", "Verma", "Rao", "Menon", "Iyer", "Desai", "Bose", "Chawla", "Ahuja", "Khanna", "Mehta", "Bhat"]
        
        locations = ["Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "HSR Layout", "MG Road", "Malleshwaram", "Marathahalli", "Electronic City", "Bellandur"]
        symptoms = ["Routine checkup", "Mild fever and cough", "Chronic back pain", "Follow-up consultation", "Skin rash", "Migraine headaches", "Joint stiffness", "Stomach discomfort", "Fatigue", "Shortness of breath"]

        # --- 2. CREATE DOCTORS ---
        doctors_list = []
        for i, (name, specialty) in enumerate(doctor_names):
            email = f"{name.lower().replace(' ', '').replace('.', '')}@example.com"
            doc = User(
                full_name=name,
                email=email,
                password_hash=hashed_pwd,
                role=UserRole.doctor,
                phone=f"9876543{i:03d}"
            )
            db.add(doc)
            doctors_list.append((doc, specialty))
            
        db.commit() # Commit to generate User IDs for doctors

        # --- 3. CREATE CLINICS ---
        clinics_list = []
        for doc, specialty in doctors_list:
            db.refresh(doc)
            loc = random.choice(locations)
            clinic_name = f"{doc.full_name.split(' ')[1]}'s {specialty} Clinic"
            
            clinic = Clinic(
                doctor_id=doc.id,
                name=clinic_name,
                address=f"{random.randint(1, 150)}, 4th Cross, {loc}, Bengaluru",
                description=f"Premier destination for advanced {specialty.lower()} healthcare services.",
                phone=f"080-{random.randint(1000000, 9999999)}"
            )
            db.add(clinic)
            clinics_list.append(clinic)
            
        db.commit() # Commit to generate Clinic IDs

        # --- 4. CREATE PATIENTS ---
        patients_list = []
        # Generate 150 unique patients
        for i in range(150):
            f_name = random.choice(patient_first_names)
            l_name = random.choice(patient_last_names)
            full_name = f"{f_name} {l_name}"
            email = f"{f_name.lower()}.{l_name.lower()}{i}@example.com"
            
            patient = User(
                full_name=full_name,
                email=email,
                password_hash=hashed_pwd,
                role=UserRole.patient,
                phone=f"9123456{i:03d}",
                blood_type=random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
                allergies=random.choice(["None", "Penicillin", "Peanuts", "Dust", "Pollen", "None", "Dairy"]),
                medical_conditions=random.choice(["None", "Hypertension", "Diabetes", "Asthma", "None", "Thyroid"])
            )
            db.add(patient)
            patients_list.append(patient)
            
        db.commit() # Commit to generate Patient IDs
        for p in patients_list:
            db.refresh(p)

        # --- 5. CREATE SCHEDULES FOR DOCTORS ---
        for doc, _ in doctors_list:
            # Each doctor works 4-6 days
            working_days = random.sample(range(7), random.randint(4, 6))
            
            for day in working_days:
                shift = random.choice([
                    (time(9, 0), time(13, 0)),
                    (time(14, 0), time(18, 0)),
                    (time(9, 0), time(17, 0))
                ])
                schedule = DoctorSchedule(
                    doctor_id=doc.id,
                    day_of_week=day,
                    start_time=shift[0],
                    end_time=shift[1],
                    is_available=True
                )
                db.add(schedule)
        db.commit()

        # --- 6. CREATE APPOINTMENTS ---
        today = date.today()
        # Generate ~400 appointments over the past 30 days and next 30 days
        for _ in range(400):
            patient = random.choice(patients_list)
            clinic = random.choice(clinics_list)
            
            # Pick a random day in the range -30 to +30 days
            random_days = random.randint(-30, 30)
            appointment_date = today + timedelta(days=random_days)
            
            hour = random.randint(9, 17)
            start_time = time(hour, 0)
            end_time = time(hour, 30)
            
            if random_days < 0:
                status = AppointmentStatus.completed
            else:
                status = random.choice([AppointmentStatus.booked, AppointmentStatus.booked, AppointmentStatus.cancelled])
            
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=clinic.doctor_id, 
                clinic_id=clinic.id,
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=end_time,
                status=status,
                pre_clinic_concerns=random.choice(symptoms),
                post_visit_summary="Patient advised to rest and take prescribed medication." if status == AppointmentStatus.completed else None
            )
            db.add(appt)
            
        db.commit()

        # --- 7. CREATE DOCUMENTS ---
        documents_list = []
        for patient in patients_list:
            # Randomly 0 to 4 documents per patient
            for _ in range(random.randint(0, 4)):
                doc_tag = random.choice(list(DocumentTag))
                doc = Document(
                    patient_id=patient.id,
                    title=f"{doc_tag.value.capitalize().replace('_', ' ')} for {patient.full_name}",
                    description=f"Uploaded {doc_tag.value.replace('_', ' ')} during consultation.",
                    tag=doc_tag,
                    file_path=f"uploads/{uuid.uuid4()}.pdf",
                    original_filename=f"{doc_tag.value}.pdf",
                    mime_type="application/pdf",
                    ocr_text="Mock OCR text containing medical terms like blood pressure, glucose, heart rate.",
                    uploaded_at=datetime.utcnow() - timedelta(days=random.randint(1, 100))
                )
                db.add(doc)
                documents_list.append(doc)
        db.commit()
        for d in documents_list:
            db.refresh(d)

        # --- 8. CREATE SHARE LINKS & SHARE DOCUMENTS ---
        for _ in range(80):
            patient = random.choice(patients_list)
            # Find if patient has documents
            patient_docs = [d for d in documents_list if d.patient_id == patient.id]
            if patient_docs:
                sl = ShareLink(
                    owner_id=patient.id,
                    token=str(uuid.uuid4()),
                    expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 30)),
                    is_folder_share=False,
                    allowed_emails="doctor@example.com,family@example.com"
                )
                db.add(sl)
                db.commit()
                db.refresh(sl)
                
                # share 1-3 docs
                docs_to_share = random.sample(patient_docs, min(len(patient_docs), random.randint(1, 3)))
                for d in docs_to_share:
                    sd = ShareDocument(
                        share_link_id=sl.id,
                        document_id=d.id
                    )
                    db.add(sd)
        db.commit()

        # --- 9. CREATE REMINDERS ---
        for patient in patients_list:
            if random.random() > 0.4:
                # Recurring prescription fill
                reminder_time = datetime.combine(today + timedelta(days=random.randint(1, 14)), time(9, 0))
                med_reminder = Reminder(
                    patient_id=patient.id,
                    title="Prescription Fill",
                    description="Refill your medication at the local pharmacy.",
                    reminder_time=reminder_time,
                    type=ReminderType.medication,
                    is_completed=False,
                    is_recurring=True,
                    recurrence_pattern="monthly"
                )
                db.add(med_reminder)

            if random.random() > 0.4:
                # Daily pill
                pill_reminder = Reminder(
                    patient_id=patient.id,
                    title="Take Vitamins / Supplements",
                    description="Take after breakfast",
                    reminder_time=datetime.combine(today, time(8, 0)),
                    type=ReminderType.medication,
                    is_completed=False,
                    is_recurring=True,
                    recurrence_pattern="daily"
                )
                db.add(pill_reminder)
                
            if random.random() > 0.6:
                # Appointment reminder
                appt_reminder = Reminder(
                    patient_id=patient.id,
                    title="Upcoming Appointment",
                    description="You have a doctor's appointment soon.",
                    reminder_time=datetime.combine(today + timedelta(days=random.randint(1, 5)), time(10, 0)),
                    type=ReminderType.appointment,
                    is_completed=False,
                    is_recurring=False
                )
                db.add(appt_reminder)
        db.commit()

        # --- 10. CREATE TRIAGE SESSIONS ---
        for _ in range(80):
            patient = random.choice(patients_list)
            clinic = random.choice(clinics_list)
            ts = TriageSession(
                phone=patient.phone,
                clinic_id=clinic.id,
                patient_id=patient.id,
                channel=random.choice(["sms", "whatsapp"]),
                complaint=random.choice(symptoms),
                status=random.choice(["pending", "responded", "closed"]),
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            )
            db.add(ts)
        db.commit()
        
        print("\n==================================================")
        print("DATABASE SUCCESSFULLY SEEDED WITH BULK DATA!")
        print("==================================================")
        print(f"Doctors created: {len(doctors_list)}")
        print(f"Clinics created: {len(clinics_list)}")
        print(f"Patients created: {len(patients_list)}")
        print(f"Appointments scheduled: 400 records")
        print(f"Documents uploaded: {len(documents_list)}")
        print(f"Share links generated: ~80 records")
        print(f"Reminders set: tons")
        print(f"Triage sessions created: 80 records")
        print("\nAll generated accounts use the password: password123")
        print("\n--- ANY OF THESE VALID DOCTOR EMAILS ---")
        for doc, spec in doctors_list[:5]:
            print(f"{doc.email:<30} ({spec})")
            
        print("\n--- ANY OF THESE VALID PATIENT EMAILS ---")
        for pat in patients_list[:5]:
            print(f"{pat.email}")
        print("==================================================")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()