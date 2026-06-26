import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import { getSharedDocuments, viewSharedDocumentFile, downloadSharedDocumentFile } from '../../api/sharing';
import Button from '../../components/ui/Button';

export default function ExpressIntakeViewerPage() {
  const [searchParams] = useSearchParams();
  const [payloadData, setPayloadData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const payload = searchParams.get('payload');
    if (!payload) {
      setError('No payload found in URL.');
      return;
    }

    try {
      const decoded = decodeURIComponent(escape(atob(payload)));
      const data = JSON.parse(decoded);
      setPayloadData(data);
      
      if (data.st) {
        setLoadingDocs(true);
        getSharedDocuments(data.st)
          .then(res => setDocuments(res.data.documents || []))
          .catch(err => {
            console.error(err);
          })
          .finally(() => setLoadingDocs(false));
      }
    } catch (err) {
      setError('Failed to parse payload data.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <PageWrapper title="Express Intake Viewer">
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </PageWrapper>
    );
  }

  if (!payloadData) {
    return <PageWrapper title="Express Intake Viewer"><div className="skeleton" style={{width: 300, height: 200, margin: '0 auto'}} /></PageWrapper>;
  }

  return (
    <PageWrapper title="Express Intake Record">
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
        
        {/* Header & Print Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }} className="no-print">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Express Intake Summary</h1>
          <Button onClick={() => window.print()} variant="primary">
            Export / Print to PDF
          </Button>
        </div>

        {/* Print-only title */}
        <div className="print-only" style={{ display: 'none', textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>EXPRESS INTAKE RECORD</h1>
          <p>Generated via MedBridge</p>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Patient Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong>Name:</strong> {payloadData.n || 'N/A'}</div>
              <div><strong>Email:</strong> {payloadData.e || 'N/A'}</div>
              <div><strong>Phone:</strong> {payloadData.ph || 'N/A'}</div>
              <div><strong>Blood Type:</strong> {payloadData.bt || 'N/A'}</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Vital Health Data</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong>Allergies:</strong> {payloadData.al || 'None reported'}</div>
              <div><strong>Medical Conditions:</strong> {payloadData.con || 'None reported'}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Current Medications</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{payloadData.med || 'None reported'}</p>
        </div>

        {payloadData.pc && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #f59e0b' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Pre-appointment Concerns</h2>
            <p style={{ whiteSpace: 'pre-wrap', fontWeight: '500' }}>{payloadData.pc}</p>
          </div>
        )}

        {/* Shared Documents Section */}
        {payloadData.st && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Included Documents</h2>
            
            {loadingDocs ? (
              <p>Loading attached documents...</p>
            ) : documents.length === 0 ? (
              <p>No documents found or share link expired.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.title}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{doc.tag}</div>
                    
                    <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Button variant="secondary" onClick={() => viewSharedDocumentFile(payloadData.st, doc.id)} style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                        View
                      </Button>
                      <Button variant="secondary" onClick={() => downloadSharedDocumentFile(payloadData.st, doc.id, doc.original_filename)} style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            break-inside: avoid;
          }
          nav {
            display: none !important;
          }
        }
      `}</style>
    </PageWrapper>
  );
}
