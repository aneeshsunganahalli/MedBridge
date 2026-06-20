import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { getPatientAppointments, cancelAppointment } from '../../api/appointments';
import { useNavigate } from 'react-router-dom';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getPatientAppointments();
      setAppointments(res.data);
    } catch {
      toast.error('Failed to load appointments');
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

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    if (tab === 'upcoming') return a.status === 'booked' && a.appointment_date >= today;
    if (tab === 'past') return a.status === 'completed' || (a.status === 'booked' && a.appointment_date < today);
    if (tab === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const emptyMessages = {
    upcoming: { icon: '📅', title: 'No upcoming appointments', msg: 'Book your first appointment to get started.', action: 'Book Appointment', to: '/book-appointment' },
    past: { icon: '📋', title: 'No past appointments', msg: 'Your completed appointments will show here.' },
    cancelled: { icon: '🚫', title: 'No cancelled appointments', msg: 'Cancelled appointments will appear here.' },
  };

  if (loading) {
    return <PageWrapper title="My Appointments"><SkeletonCard count={4} /></PageWrapper>;
  }

  return (
    <PageWrapper title="My Appointments">
      <div className="tabs">
        {['upcoming', 'past', 'cancelled'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length ? (
        filtered.map(appt => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            nameField="doctor_name"
            actions={
              tab === 'upcoming' && appt.status === 'booked' && (
                cancelConfirm === appt.id ? (
                  <div className="confirm-inline">
                    <span>Cancel?</span>
                    <Button size="sm" variant="danger" onClick={() => handleCancel(appt.id)}>Yes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setCancelConfirm(null)}>No</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setCancelConfirm(appt.id)}>Cancel</Button>
                )
              )
            }
          />
        ))
      ) : (
        <EmptyState
          icon={emptyMessages[tab].icon}
          title={emptyMessages[tab].title}
          message={emptyMessages[tab].msg}
          actionLabel={emptyMessages[tab].action}
          onAction={emptyMessages[tab].to ? () => navigate(emptyMessages[tab].to) : undefined}
        />
      )}
    </PageWrapper>
  );
}
