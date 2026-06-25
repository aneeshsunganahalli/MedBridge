import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { getAppointment, savePostVisitSummary } from '../../api/appointments';
import { formatDate } from '../../utils/format';

import client from '../../api/client';

export default function PostVisitSummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescriptions, setPrescriptions] = useState('');

  // Reminder state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [addingReminder, setAddingReminder] = useState(false);

  useEffect(() => {
    getAppointment(id)
      .then(res => {
        setAppointment(res.data);
        if (res.data.post_visit_summary) {
          try {
            const parsed = JSON.parse(res.data.post_visit_summary);
            setSymptoms(parsed.symptoms || '');
            setDiagnosis(parsed.diagnosis || '');
            setTreatment(parsed.treatment || '');
            setPrescriptions(parsed.prescriptions || '');
          } catch {
            setTreatment(res.data.post_visit_summary);
          }
        }
      })
      .catch(err => toast.error('Failed to load appointment'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const summaryPayload = JSON.stringify({
        symptoms,
        diagnosis,
        treatment,
        prescriptions
      });
      await savePostVisitSummary(id, summaryPayload);
      toast.success('Post-Visit Summary saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to save summary.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle || !reminderTime) {
      toast.error('Title and time are required for a reminder');
      return;
    }
    setAddingReminder(true);
    try {
      await client.post(`/api/reminders/patient/${appointment.patient_id}`, {
        title: reminderTitle,
        description: reminderDesc,
        reminder_time: new Date(reminderTime).toISOString(),
        type: 'medication',
        is_recurring: false
      });
      toast.success('Reminder added for patient!');
      setReminderTitle('');
      setReminderDesc('');
      setReminderTime('');
    } catch (err) {
      toast.error('Failed to add reminder');
    } finally {
      setAddingReminder(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Digital Post-Visit Summary">
        <SkeletonCard count={3} />
      </PageWrapper>
    );
  }

  if (!appointment) {
    return (
      <PageWrapper title="Digital Post-Visit Summary">
        <div className="empty-state">
          <h2>Appointment not found</h2>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Digital Post-Visit Summary">
      <div className="card mb-6" style={{ marginBottom: '24px' }}>
        <h3 className="card-title mb-4">Appointment Details</h3>
        <div className="vitals-grid" style={{ fontSize: '14px' }}>
          <div><strong>Patient:</strong> {appointment.patient_name}</div>
          <div><strong>Date:</strong> {formatDate(appointment.appointment_date)} at {appointment.start_time}</div>
          <div><strong>Clinic:</strong> {appointment.clinic_name}</div>
          <div><strong>Status:</strong> <span className="badge badge-blue">{appointment.status}</span></div>
          {appointment.pre_clinic_concerns && (
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <strong>Pre-Clinic Concerns / Reason for Visit:</strong><br />
              <div style={{ padding: '8px', background: 'var(--color-background)', borderRadius: '4px', marginTop: '4px' }}>
                {appointment.pre_clinic_concerns}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title mb-4" style={{ marginBottom: '16px' }}>Visit Notes & Summary</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input 
            label="Symptoms & Vitals" 
            type="textarea" 
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="Patient reported symptoms..."
          />
          
          <Input 
            label="Diagnosis" 
            type="textarea" 
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Primary and secondary diagnoses..."
          />
          
          <Input 
            label="Treatment Plan & Follow-up" 
            type="textarea" 
            value={treatment}
            onChange={e => setTreatment(e.target.value)}
            placeholder="Plan, instructions, and next steps..."
          />
          
          <Input 
            label="Prescriptions" 
            type="textarea" 
            value={prescriptions}
            onChange={e => setPrescriptions(e.target.value)}
            placeholder="Medication, dosage, and duration..."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => navigate('/my-appointments')}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save Summary</Button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="card-title mb-4" style={{ marginBottom: '16px', color: 'var(--color-primary)' }}>Set Patient Reminder</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>Add a specific medication or follow-up reminder directly to the patient's timeline.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="two-col" style={{ gap: '16px' }}>
            <Input 
              label="Reminder Title (e.g. Take Amoxicillin)" 
              value={reminderTitle}
              onChange={e => setReminderTitle(e.target.value)}
            />
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
              />
            </div>
          </div>
          <Input 
            label="Additional Instructions" 
            value={reminderDesc}
            onChange={e => setReminderDesc(e.target.value)}
            placeholder="Take with food, etc."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button variant="secondary" loading={addingReminder} onClick={handleAddReminder}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Reminder for Patient
            </Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
