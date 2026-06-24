import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import { getQrCodeBlobUrl } from '../../api/sharing';

export default function QRCodePage() {
  const { token } = useParams();
  const [qrUrl, setQrUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    getQrCodeBlobUrl(token)
      .then(url => setQrUrl(url))
      .catch(err => {
        if (err.response?.status === 403) {
          setError('Access denied. You do not have permission to view this QR code.');
        } else if (err.response?.status === 404) {
          setError('Share link not found.');
        } else {
          setError('Failed to load QR code. Please try again.');
        }
      })
      .finally(() => setLoading(false));

    return () => {
      // Cleanup object URL
      if (qrUrl) {
        URL.revokeObjectURL(qrUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `share-qr-${token}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading) {
    return (
      <PageWrapper title="Share QR Code">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="skeleton" style={{ width: '200px', height: '200px', borderRadius: '8px' }}></div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Share QR Code">
        <div className="empty-state">
          <div className="empty-state-icon-svg" style={{ color: 'var(--color-danger)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="empty-state-title">Error</h2>
          <p className="empty-state-text">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/my-documents')} style={{ marginTop: '1rem' }}>
            Back to Documents
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Share QR Code">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '3rem 1rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-sm)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Scan to Access</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
          Anyone who scans this QR code will be able to access the shared documents (if they have the required permissions).
        </p>
        
        {qrUrl && (
          <div style={{ 
            padding: '1rem', 
            border: '1px solid var(--color-border)', 
            borderRadius: '12px',
            background: '#fafafa',
            marginBottom: '2rem'
          }}>
            <img src={qrUrl} alt="QR Code" style={{ width: '100%', maxWidth: '250px', height: 'auto', display: 'block' }} />
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" onClick={handleDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export QR Code
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
