import { formatDate, formatTime } from '../../utils/format';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { doctors as localDoctors } from '../../../assets/assets_frontend/assets';

export default function AppointmentCard({ appointment, nameField = 'doctor_name', actions }) {
  const isDoctorView = nameField === 'patient_name';
  const docImage = !isDoctorView && appointment.doctor_id 
    ? (localDoctors[(appointment.doctor_id % 15)]?.image || localDoctors[0].image) 
    : null;

  return (
    <div className="appt-card">
      <div className="appt-card-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {docImage && (
          <img 
            src={docImage} 
            alt="Doctor" 
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-background)' }} 
          />
        )}
        <div>
          <div className="appt-card-name">{appointment[nameField]}</div>
          <div className="appt-card-detail">
            {appointment.clinic_name} · {formatDate(appointment.appointment_date)} · {formatTime(appointment.start_time)}
          </div>
        </div>
      </div>
      <div className="appt-card-actions">
        <AppointmentStatusBadge status={appointment.status} />
        {actions}
      </div>
    </div>
  );
}
