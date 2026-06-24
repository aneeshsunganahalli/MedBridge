import { formatDate, formatTime } from '../../utils/format';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { doctors as localDoctors } from '../../../assets/assets_frontend/assets';

export default function AppointmentCard({ appointment, nameField = 'doctor_name', actions, children }) {
  const isDoctorView = nameField === 'patient_name';
  const docImage = !isDoctorView && appointment.doctor_id 
    ? (localDoctors[(appointment.doctor_id % 15)]?.image || localDoctors[0].image) 
    : null;

  return (
    <div className="appt-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div className="appt-card-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
          {docImage && (
            <img 
              src={docImage} 
              alt="Doctor" 
              className="appt-card-avatar"
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', background: 'var(--color-background)', flexShrink: 0 }} 
            />
          )}
          <div style={{ minWidth: 0 }}>
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
      {children && (
        <div className="appt-card-children" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
