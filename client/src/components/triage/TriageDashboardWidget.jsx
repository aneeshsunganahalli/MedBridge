import { useState, useEffect } from 'react';
import { getActiveTriageSessions, closeTriageSession } from '../../api/triage';
import { useToast } from '../ui/Toast';
import { formatRelativeTime } from '../../utils/format';
import Button from '../ui/Button';

export default function TriageDashboardWidget() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadSessions = async () => {
    try {
      const res = await getActiveTriageSessions();
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load triage sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // Poll every 30 seconds for new triage messages
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = async (id) => {
    try {
      await closeTriageSession(id);
      toast.success('Triage session closed');
      loadSessions();
    } catch (err) {
      toast.error('Failed to close session');
    }
  };

  if (loading) {
    return <div className="skeleton" style={{ height: '150px' }}></div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>No active SMS triage sessions.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '0' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
            background: 'var(--color-danger)', animation: 'pulse 2s infinite' 
          }}></span>
          Live Triage Queue
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {sessions.length} active
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sessions.map(session => (
          <div key={session.id} style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: session.status === 'responded' ? '#f0f9ff' : 'transparent'
          }}>
            <div>
              <div style={{ fontWeight: '500', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {session.patient_name || session.phone}
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: '10px', 
                  background: 'var(--color-border)', 
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase'
                }}>
                  {session.channel}
                </span>
                {session.status === 'pending' && (
                  <span style={{ fontSize: '0.75rem', color: '#eab308' }}>Awaiting reply...</span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                {session.complaint ? (
                  <strong>Complaint: {session.complaint}</strong>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>No complaint provided yet.</span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {formatRelativeTime(session.updated_at)}
              </div>
            </div>
            <div>
              <Button size="sm" variant="ghost" onClick={() => handleClose(session.id)}>
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
