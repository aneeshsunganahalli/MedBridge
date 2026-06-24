import os
import sys
import random
from datetime import date, time, timedelta
# Add server directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, User, Clinic, DoctorSchedule, Appointment, UserRole, AppointmentStatus
from app.auth import hash_password

def seed_db():
    print("Seeding database with a massive dataset...")
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

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
        
        patient_first_names = ["Rahul", "Anjali", "Suresh", "Priyanka", "Amit", "Deepika", "Vijay", "Sunita", "Ramesh", "Kiran"]
        patient_last_names = ["Kumar", "Gupta", "Sharma", "Reddy", "Singh", "Joshi", "Das", "Nair", "Patel", "Verma"]
        
        locations = ["Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "HSR Layout", "MG Road", "Malleshwaram", "Marathahalli"]
        symptoms = ["Routine checkup", "Mild fever and cough", "Chronic back pain", "Follow-up consultation", "Skin rash", "Migraine headaches", "Joint stiffness", "Stomach discomfort"]

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
        # Generate 50 unique patients
        for i in range(50):
            f_name = random.choice(patient_first_names)
            l_name = random.choice(patient_last_names)
            full_name = f"{f_name} {l_name}"
            email = f"{f_name.lower()}.{l_name.lower()}{i}@example.com"
            
            patient = User(
                full_name=full_name,
                email=email,
                password_hash=hashed_pwd,
                role=UserRole.patient,
                phone=f"9123456{i:03d}"
            )
            db.add(patient)
            patients_list.append(patient)
            
        db.commit() # Commit to generate Patient IDs
        for p in patients_list:
            db.refresh(p)

        # --- 5. CREATE SCHEDULES FOR DOCTORS ---
        for doc, _ in doctors_list:
            # Each doctor works 4-5 random weekdays
            working_days = random.sample(range(5), random.randint(4, 5))
            # Shift assignment: either morning (9-1) or afternoon (2-6)
            shift = random.choice([
                (time(9, 0), time(13, 0)),
                (time(14, 0), time(18, 0))
            ])
            
            for day in working_days:
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
        # Generate ~60 appointments over the next 14 days
        for _ in range(60):
            patient = random.choice(patients_list)
            clinic = random.choice(clinics_list)
            
            # Pick a random day in the next 2 weeks
            random_days_ahead = random.randint(1, 14)
            appointment_date = today + timedelta(days=random_days_ahead)
            
            # Select a random hourly time block between 9 AM and 5 PM
            hour = random.randint(9, 17)
            start_time = time(hour, 0)
            end_time = time(hour, 30)
            
            # Mix up statuses
            status = random.choice([AppointmentStatus.booked, AppointmentStatus.booked, AppointmentStatus.booked, AppointmentStatus.completed])
            
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=clinic.doctor_id, # Match clinic's assigned doctor
                clinic_id=clinic.id,
                appointment_date=appointment_date,
                start_time=start_time,
                end_time=end_time,
                status=status,
                notes=random.choice(symptoms)
            )
            db.add(appt)
            
        db.commit()
        
        print("\n==================================================")
        print("DATABASE SUCCESSFULLY SEEDED WITH BULK DATA!")
        print("==================================================")
        print(f"Doctors created: {len(doctors_list)}")
        print(f"Clinics created: {len(clinics_list)}")
        print(f"Patients created: {len(patients_list)}")
        print("Appointments scheduled: ~60 records")
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