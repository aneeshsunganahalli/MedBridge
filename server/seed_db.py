import os
import sys
from datetime import date, time, timedelta

# Add server directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models import Base, User, Clinic, DoctorSchedule, Appointment, UserRole, AppointmentStatus
from app.auth import hash_password

def seed_db():
    print("Seeding database...")
    
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping seed.")
            print("\nCredentials:")
            for user in db.query(User).all():
                print(f"Role: {user.role.value:<10} | Email: {user.email:<25} | Password: password123")
            return

        # 1. Create Doctors
        doctor1 = User(
            full_name="Dr. Priya Sharma",
            email="priya.sharma@example.com",
            password_hash=hash_password("password123"),
            role=UserRole.doctor,
            phone="9876543210"
        )
        doctor2 = User(
            full_name="Dr. Arun Verma",
            email="arun.verma@example.com",
            password_hash=hash_password("password123"),
            role=UserRole.doctor,
            phone="9876543211"
        )
        db.add_all([doctor1, doctor2])
        db.commit()
        db.refresh(doctor1)
        db.refresh(doctor2)

        # 2. Create Patients
        patient1 = User(
            full_name="Rahul Kumar",
            email="rahul.kumar@example.com",
            password_hash=hash_password("password123"),
            role=UserRole.patient,
            phone="9876543220"
        )
        patient2 = User(
            full_name="Anjali Gupta",
            email="anjali.gupta@example.com",
            password_hash=hash_password("password123"),
            role=UserRole.patient,
            phone="9876543221"
        )
        db.add_all([patient1, patient2])
        db.commit()
        db.refresh(patient1)
        db.refresh(patient2)

        # 3. Create Clinics
        clinic1 = Clinic(
            doctor_id=doctor1.id,
            name="Sharma Orthopedics Clinic",
            address="Koramangala, Bengaluru",
            description="Specializing in sports injuries and joint replacements.",
            phone="080-1234567"
        )
        clinic2 = Clinic(
            doctor_id=doctor2.id,
            name="Verma Skin Care",
            address="Indiranagar, Bengaluru",
            description="Advanced dermatology and cosmetology.",
            phone="080-7654321"
        )
        db.add_all([clinic1, clinic2])
        db.commit()
        db.refresh(clinic1)
        db.refresh(clinic2)

        # 4. Create Schedules
        # Dr. Sharma: Monday to Friday, 9:00 AM to 1:00 PM
        schedules1 = [
            DoctorSchedule(doctor_id=doctor1.id, day_of_week=d, start_time=time(9, 0), end_time=time(13, 0), is_available=True)
            for d in range(5) # 0 to 4 (Monday to Friday)
        ]
        # Dr. Verma: Mon, Wed, Fri, 10:00 AM to 4:00 PM
        schedules2 = [
            DoctorSchedule(doctor_id=doctor2.id, day_of_week=d, start_time=time(10, 0), end_time=time(16, 0), is_available=True)
            for d in [0, 2, 4] # Mon, Wed, Fri
        ]
        db.add_all(schedules1 + schedules2)
        db.commit()

        # 5. Create Appointments
        today = date.today()
        # Find next Monday and Wednesday
        next_mon = today + timedelta(days=(0 - today.weekday()) % 7)
        if next_mon == today:
            next_mon += timedelta(days=7)
        
        next_wed = today + timedelta(days=(2 - today.weekday()) % 7)
        if next_wed == today:
            next_wed += timedelta(days=7)

        appointments = [
            # Rahul booking Dr. Sharma for next Monday at 9:00 AM
            Appointment(
                patient_id=patient1.id,
                doctor_id=doctor1.id,
                clinic_id=clinic1.id,
                appointment_date=next_mon,
                start_time=time(9, 0),
                end_time=time(9, 30),
                status=AppointmentStatus.booked,
                notes="Knee pain for 2 weeks."
            ),
            # Anjali booking Dr. Verma for next Wednesday at 11:00 AM
            Appointment(
                patient_id=patient2.id,
                doctor_id=doctor2.id,
                clinic_id=clinic2.id,
                appointment_date=next_wed,
                start_time=time(11, 0),
                end_time=time(11, 30),
                status=AppointmentStatus.booked,
                notes="Acne consultation."
            )
        ]
        db.add_all(appointments)
        db.commit()

        print("Database successfully seeded!")
        print("\nDummy Credentials Created:")
        print("--------------------------------------------------")
        print("Doctors:")
        print(f"1. Email: {doctor1.email:<25} | Password: password123")
        print(f"2. Email: {doctor2.email:<25} | Password: password123")
        print("\nPatients:")
        print(f"1. Email: {patient1.email:<25} | Password: password123")
        print(f"2. Email: {patient2.email:<25} | Password: password123")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
