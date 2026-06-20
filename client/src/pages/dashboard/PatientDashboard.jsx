import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { getPatientDashboard } from '../../api/dashboard';
import { cancelAppointment } from '../../api/appointments';
import { updateReminder } from '../../api/reminders';
import { formatRelativeTime } from '../../utils/format';

const REMINDER_ICONS = { medication: '💊', appointment: '📅', custom: '🔔' };

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getPatientDashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      setCancelConfirm(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  const handleReminderDone = async (id) => {
    try {
      await updateReminder(id, { is_completed: true });
      toast.success('Reminder marked as done');
      load();
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="stat-cards-row">
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
        </div>
        <SkeletonCard count={3} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Dashboard">
      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-card-label">Total Appointments</div>
          <div className="stat-card-value">{data?.total_appointments || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Documents</div>
          <div className="stat-card-value">{data?.total_documents || 0}</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-header">
            <h2 className="section-title">Upcoming Appointments</h2>
          </div>
          {data?.upcoming_appointments?.length ? (
            data.upcoming_appointments.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                nameField="doctor_name"
                actions={
                  appt.status === 'booked' && (
                    cancelConfirm === appt.id ? (
                      <div className="confirm-inline">
                        <span>Cancel?</span>
                        <Button size="sm" variant="danger" onClick={() => handleCancel(appt.id)}>Yes</Button>
                        <Button size="sm" variant="ghost" onClick={() => setCancelConfirm(null)}>No</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setCancelConfirm(appt.id)}>
                        Cancel
                      </Button>
                    )
                  )
                }
              />
            ))
          ) : (
            <EmptyState
              icon="📅"
              title="No upcoming appointments"
              message="Book your first appointment to get started."
              actionLabel="Book Appointment"
              onAction={() => navigate('/book-appointment')}
            />
          )}
        </div>

        <div>
          <div className="section-header">
            <h2 className="section-title">Upcoming Reminders</h2>
          </div>
          {data?.upcoming_reminders?.length ? (
            data.upcoming_reminders.map(rem => (
              <div key={rem.id} className={`reminder-row ${rem.is_completed ? 'completed' : ''}`}>
                <button
                  className={`reminder-check ${rem.is_completed ? 'checked' : ''}`}
                  onClick={() => !rem.is_completed && handleReminderDone(rem.id)}
                >
                  ✓
                </button>
                <span className="reminder-icon">{REMINDER_ICONS[rem.type] || '🔔'}</span>
                <div className="reminder-content">
                  <div className="reminder-title">{rem.title}</div>
                  <div className="reminder-time">{formatRelativeTime(rem.reminder_time)}</div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🔔"
              title="No upcoming reminders"
              message="Your reminders will appear here."
              actionLabel="Add Reminder"
              onAction={() => navigate('/reminders')}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
