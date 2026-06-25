import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import { loadSnapshot, isOffline } from '../../utils/offlineStore';
import { generateEmergencyQR, generateExpressIntakeQR } from '../../utils/offlineQR';

export default function OfflineEmergencyPage() {
  const [offlineStatus, setOfflineStatus] = useState(isOffline());
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emergencyQR, setEmergencyQR] = useState(null);
  const [intakeQR, setIntakeQR] = useState(null);

  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function fetchData() {
      try {
        const data = await loadSnapshot();
        setSnapshot(data);
        if (data) {
          setEmergencyQR(await generateEmergencyQR(data));
          setIntakeQR(await generateExpressIntakeQR(data));
        }
      } catch (err) {
        console.error('Failed to load snapshot:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Emergency Snapshot">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '400px', borderRadius: '8px' }}></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Emergency Snapshot">
      {offlineStatus && (
        <div style={{
          background: 'var(--color-danger)',
          color: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '500'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.61 10.61A2.003 2.003 0 0 0 12 14a2 2 0 0 0 1.39-.61"/><path d="M13.41 9.41A4.002 4.002 0 0 0 16 16a4 4 0 0 0 1.41-1.41"/><path d="M16.24 6.24A8.004 8.004 0 0 0 20 20a8 8 0 0 0 1.76-1.76"/><line x1="2" y1="2" x2="22" y2="22"/>
          </svg>
          You are currently offline. Showing cached snapshot.
        </div>
      )}

      {!snapshot ? (
        <div className="empty-state">
          <div className="empty-state-icon-svg">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h2 className="empty-state-title">No Medical Snapshot Found</h2>
          <p className="empty-state-text">
            Please log in while connected to the internet to save your emergency medical snapshot to this device.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Last synced: {new Date(snapshot.timestamp).toLocaleString()}
          </div>

          <div style={{
            textAlign: 'center', 
            padding: '2.5rem',
            background: 'linear-gradient(145deg, #fef2f2 0%, #fecaca 100%)',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(239, 68, 68, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(239, 68, 68, 0.15)'; }}
          >
            <h2 style={{ color: '#dc2626', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.75rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Emergency SOS
            </h2>
            <p style={{ color: '#991b1b', marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
              Show this to first responders. Contains critical information like blood type, allergies, and emergency contacts.
            </p>
            {emergencyQR ? (
              <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                <img src={emergencyQR} alt="Emergency QR Code" style={{ width: '250px', height: '250px', display: 'block', borderRadius: '8px' }} />
              </div>
            ) : (
              <div className="skeleton" style={{ width: '250px', height: '250px', margin: '0 auto 1.5rem auto', borderRadius: '16px' }}></div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="primary" 
                onClick={() => {
                  if (!emergencyQR) return;
                  const a = document.createElement('a');
                  a.href = emergencyQR;
                  a.download = `emergency-sos.png`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
                disabled={!emergencyQR}
                style={{ background: '#dc2626', borderColor: '#b91c1c' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export QR Code
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
