import { formatDate, formatTime } from '../../utils/format';
import AppointmentStatusBadge from './AppointmentStatusBadge';

export default function AppointmentCard({ appointment, nameField = 'doctor_name', actions }) {
  return (
    <div className="appt-card">
      <div className="appt-card-info">
        <div className="appt-card-name">{appointment[nameField]}</div>
        <div className="appt-card-detail">
          {appointment.clinic_name} · {formatDate(appointment.appointment_date)} · {formatTime(appointment.start_time)}
        </div>
      </div>
      <div className="appt-card-actions">
        <AppointmentStatusBadge status={appointment.status} />
        {actions}
      </div>
    </div>
  );
}
