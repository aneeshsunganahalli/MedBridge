import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { getDoctorAppointments, cancelAppointment, completeAppointment } from '../../api/appointments';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getDoctorAppointments();
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

  const handleComplete = async (id) => {
    try {
      await completeAppointment(id);
      toast.success('Appointment marked as completed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    if (tab === 'upcoming') return a.status === 'booked' && a.appointment_date >= today;
    if (tab === 'past') return a.status === 'completed' || a.status === 'cancelled' || a.appointment_date < today;
    return true;
  });

  // Sort: upcoming soonest first, past most recent first
  const sorted = [...filtered].sort((a, b) => {
    if (tab === 'upcoming') {
      return a.appointment_date.localeCompare(b.appointment_date) || a.start_time.localeCompare(b.start_time);
    }
    return b.appointment_date.localeCompare(a.appointment_date) || b.start_time.localeCompare(a.start_time);
  });

  if (loading) {
    return <PageWrapper title="My Appointments"><SkeletonCard count={4} /></PageWrapper>;
  }

  return (
    <PageWrapper title="My Appointments">
      <div className="tabs">
        {['upcoming', 'past'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {sorted.length ? (
        sorted.map(appt => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            nameField="patient_name"
            actions={
              tab === 'upcoming' && appt.status === 'booked' && (
                <>
                  <Button size="sm" variant="primary" onClick={() => handleComplete(appt.id)}>
                    Mark Complete
                  </Button>
                  {cancelConfirm === appt.id ? (
                    <div className="confirm-inline">
                      <span>Cancel?</span>
                      <Button size="sm" variant="danger" onClick={() => handleCancel(appt.id)}>Yes</Button>
                      <Button size="sm" variant="ghost" onClick={() => setCancelConfirm(null)}>No</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setCancelConfirm(appt.id)}>Cancel</Button>
                  )}
                </>
              )
            }
          />
        ))
      ) : (
        <EmptyState
          icon={tab === 'upcoming' ? '🗓️' : '📋'}
          title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          message={tab === 'upcoming' ? 'Upcoming patient appointments will appear here.' : 'Completed appointments will show here.'}
        />
      )}
    </PageWrapper>
  );
}
