import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { initiateTriage } from '../../api/triage';
import axios from 'axios'; // We use raw axios for the public clinic endpoint

export default function ReceptionPage() {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState('sms');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch public clinic info
    axios.get(`/api/clinics/${clinicId}/public`)
      .then(res => setClinic(res.data))
      .catch(() => setClinic(null))
      .finally(() => setLoading(false));
  }, [clinicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setSubmitting(true);
    try {
      await initiateTriage({ phone, clinic_id: parseInt(clinicId), channel });
      setSuccess(true);
    } catch (err) {
      alert('Failed to initiate triage. Please check your phone number.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Clinic Not Found</h2>
          <p>Please check the QR code or link.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          Welcome to {clinic.name}
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Dr. {clinic.doctor_name}
        </p>
      </div>

      {!success ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '400px' }}>
          
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Have the App?</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Scan your Express Intake QR code or log in to view your appointments.
            </p>
            <Button variant="secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Open Web App
            </Button>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>— OR —</div>

          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', textAlign: 'center' }}>Quick Check-in</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', textAlign: 'center' }}>
              No app needed. Continue via text message.
            </p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Your Phone Number</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="form-input" 
                  placeholder="+1 234 567 8900" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Channel</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="channel" 
                      value="sms" 
                      checked={channel === 'sms'} 
                      onChange={e => setChannel(e.target.value)} 
                    />
                    SMS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name="channel" 
                      value="whatsapp" 
                      checked={channel === 'whatsapp'} 
                      onChange={e => setChannel(e.target.value)} 
                    />
                    WhatsApp
                  </label>
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={submitting || !phone}>
                {submitting ? 'Sending...' : 'Send Me a Text'}
              </Button>
            </form>
          </div>

        </div>
      ) : (
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 style={{ marginBottom: '1rem' }}>Check Your Phone!</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            We've sent a message to {phone}. Please reply to check in with the reception desk.
          </p>
        </div>
      )}

    </div>
  );
}
