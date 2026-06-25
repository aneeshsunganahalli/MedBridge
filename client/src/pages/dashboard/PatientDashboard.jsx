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
import { uploadDocument } from '../../api/documents';
import { formatRelativeTime } from '../../utils/format';
import Drawer from '../../components/ui/Drawer';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useRef } from 'react';

const REMINDER_ICONS = {
  medication: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h9" />
    </svg>
  ),
  appointment: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  custom: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerResult, setScannerResult] = useState('');
  const [scannerDrawerOpen, setScannerDrawerOpen] = useState(false);
  const scannerFileInput = useRef(null);

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

  const handleMedicineScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScannerLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', 'Medicine Packaging Scan');
      fd.append('tag', 'medicine_packaging');

      const res = await uploadDocument(fd);

      // Auto-send prompt to AI
      const prompt = "I have uploaded a scan of my medicine packaging. Can you tell me what this medicine is for, its active chemicals, and any important warnings?";

      const payload = {
        messages: [{ role: 'user', content: prompt }],
        document_ids: [res.data.id]
      };

      const aiRes = await axios.post('/api/ai/chat', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('mb_token')}` }
      });

      setScannerResult(aiRes.data.response);
      setScannerDrawerOpen(true);
    } catch (err) {
      toast.error('Failed to scan medicine packaging');
    } finally {
      setScannerLoading(false);
      if (scannerFileInput.current) scannerFileInput.current.value = '';
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
      <div className="ai-scanner-banner" style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, #3498db 100%)',
        color: '#fff',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '60%' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>AI Medicine Scanner</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.4 }}>
            Upload a photo of your medicine packaging to instantly learn what it does, its active chemicals, and any important warnings.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={scannerFileInput}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleMedicineScan}
          />
          <Button
            variant="secondary"
            loading={scannerLoading}
            onClick={() => scannerFileInput.current?.click()}
            style={{ backgroundColor: '#fff', color: 'var(--color-primary)', border: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Scan Medicine
          </Button>
        </div>
      </div>

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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <span className="reminder-icon">{REMINDER_ICONS[rem.type] || REMINDER_ICONS.custom}</span>
                <div className="reminder-content">
                  <div className="reminder-title">{rem.title}</div>
                  <div className="reminder-time">{formatRelativeTime(rem.reminder_time)}</div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No upcoming reminders"
              message="Your reminders will appear here."
              actionLabel="Add Reminder"
              onAction={() => navigate('/reminders')}
            />
          )}
        </div>
      </div>

      <Drawer
        open={scannerDrawerOpen}
        onClose={() => setScannerDrawerOpen(false)}
        title="Medicine Analysis"
        footer={
          <Button variant="secondary" onClick={() => setScannerDrawerOpen(false)}>Close</Button>
        }
      >
        <div style={{ lineHeight: 1.6 }}>
          <ReactMarkdown>{scannerResult}</ReactMarkdown>
        </div>
      </Drawer>
    </PageWrapper>
  );
}
