import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { getDoctorDashboard } from '../../api/dashboard';
import { completeAppointment } from '../../api/appointments';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getDoctorDashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (id) => {
    try {
      await completeAppointment(id);
      toast.success('Appointment marked as completed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete appointment');
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="stat-cards-row">
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
        </div>
        <SkeletonCard count={3} />
      </PageWrapper>
    );
  }

  const todayCount = data?.upcoming_appointments?.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointment_date === today;
  }).length || 0;

  return (
    <PageWrapper title="Dashboard">
      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-card-label">Total Clinics</div>
          <div className="stat-card-value">{data?.total_clinics || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Appointments</div>
          <div className="stat-card-value">{data?.total_appointments || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Today's Appointments</div>
          <div className="stat-card-value">{todayCount}</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-header">
            <h2 className="section-title">Upcoming Appointments</h2>
          </div>
          {data?.upcoming_appointments?.length ? (
            data.upcoming_appointments.slice(0, 5).map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                nameField="patient_name"
                actions={
                  appt.status === 'booked' && (
                    <Button size="sm" variant="primary" onClick={() => handleComplete(appt.id)}>
                      Mark Complete
                    </Button>
                  )
                }
              />
            ))
          ) : (
            <EmptyState icon="🗓️" title="No upcoming appointments" message="Your upcoming appointments will appear here." />
          )}
        </div>

        <div>
          <div className="section-header">
            <h2 className="section-title">Recent Appointments</h2>
          </div>
          {data?.recent_appointments?.length ? (
            data.recent_appointments.slice(0, 5).map(appt => (
              <AppointmentCard key={appt.id} appointment={appt} nameField="patient_name" />
            ))
          ) : (
            <EmptyState icon="📋" title="No recent appointments" message="Past appointments will appear here." />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
