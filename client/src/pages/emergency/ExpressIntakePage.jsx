import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { loadSnapshot, isOffline } from '../../utils/offlineStore';
import { generateExpressIntakeQR } from '../../utils/offlineQR';
import { listDocuments } from '../../api/documents';
import { createShareLink } from '../../api/sharing';

export default function ExpressIntakePage() {
  const [offlineStatus, setOfflineStatus] = useState(isOffline());
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [intakeQR, setIntakeQR] = useState(null);
  const [concerns, setConcerns] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

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
          setIntakeQR(await generateExpressIntakeQR(data, '', null));
        }
        if (!isOffline()) {
          try {
            const docs = await listDocuments();
            setDocuments(docs.data);
          } catch (e) {
            console.error('Failed to load documents');
          }
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

  const handleGenerateQR = async () => {
    setGenerating(true);
    let shareToken = null;
    try {
      if (selectedDocs.length > 0 && !offlineStatus) {
        const res = await createShareLink({
          is_folder_share: false,
          document_ids: selectedDocs,
          expires_in_hours: 24
        });
        shareToken = res.data.token;
      }
      setIntakeQR(await generateExpressIntakeQR(snapshot, concerns, shareToken));
      toast.success('QR Code updated');
    } catch (err) {
      toast.error('Failed to generate updated QR');
    } finally {
      setGenerating(false);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  if (loading) {
    return (
      <PageWrapper title="Express Intake">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ width: '100%', maxWidth: '400px', height: '400px', borderRadius: '8px' }}></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Express Intake">
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
            Please log in while connected to the internet to save your medical snapshot to this device.
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
            background: 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 100%)',
            borderRadius: '24px',
            boxShadow: '0 10px 30px rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(14, 165, 233, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(14, 165, 233, 0.15)'; }}
          >
            <h2 style={{ color: '#0284c7', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1.75rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Express Intake
            </h2>
            <p style={{ color: '#0369a1', marginBottom: '2rem', fontSize: '1.05rem', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
              Scan at clinic reception to securely transfer your complete medical snapshot and check in instantly.
            </p>
            
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <Input
                label="Pre-appointment Concerns"
                type="textarea"
                placeholder="What is the main reason for your visit today?"
                value={concerns}
                onChange={e => setConcerns(e.target.value)}
                style={{ background: 'white' }}
              />
              
              {!offlineStatus && documents.length > 0 && (
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.9)' }}>
                  <label className="form-label" style={{ color: '#0284c7', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Include Documents (Optional)
                  </label>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #bae6fd', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                    {documents.map(doc => (
                      <label key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer', fontSize: '0.95rem', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(doc.id)}
                          onChange={() => toggleDocSelection(doc.id)}
                          style={{ marginRight: '0.75rem', width: '18px', height: '18px', accentColor: '#0ea5e9', cursor: 'pointer' }}
                        />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#0369a1' }}>{doc.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Button variant="primary" loading={generating} onClick={handleGenerateQR}>
                  Update QR Code
                </Button>
              </div>
            </div>

            {intakeQR ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}>
                  <img src={intakeQR} alt="Express Intake QR Code" style={{ width: '250px', height: '250px', display: 'block', borderRadius: '8px' }} />
                </div>
                <a 
                  href={intakeQR} 
                  download="express_intake_qr.png" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0284c7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0ea5e9'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export QR Code
                </a>
              </div>
            ) : (
              <div className="skeleton" style={{ width: '250px', height: '250px', margin: '0 auto', borderRadius: '16px' }}></div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
