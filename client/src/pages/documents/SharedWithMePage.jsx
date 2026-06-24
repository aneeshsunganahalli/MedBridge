import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { getSharedWithMe } from '../../api/sharing';

export default function SharedWithMePage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSharedWithMe()
      .then(res => setLinks(res.data))
      .catch(err => {
        setError('Failed to load shared documents. Please try again.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Shared With Me">
        <SkeletonCard count={4} />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Shared With Me">
        <div className="shared-error-state">
          <div className="shared-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="shared-error-title">Error</h2>
          <p className="shared-error-text">{error}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Shared With Me">
      <div className="mb-4">
        <p className="text-muted" style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>Documents that have been shared with you by other users.</p>
      </div>
      
      {links.length > 0 ? (
        <div className="doc-grid">
          {links.map(link => (
            <div key={link.id} className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-type-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </span>
                <Badge variant={link.is_folder_share ? 'blue' : 'grey'}>
                  {link.is_folder_share ? 'All Documents' : 'Selected Documents'}
                </Badge>
              </div>
              <div className="doc-card-title">Shared by {link.owner_name}</div>
              <div className="doc-card-meta">
                Expires: {new Date(link.expires_at).toLocaleDateString()}
              </div>
              <div className="doc-card-actions" style={{ marginTop: '1rem' }}>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate(`/shared/${link.token}`)}
                  style={{ width: '100%' }}
                >
                  View Documents
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon-svg">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="empty-state-title">No documents shared with you</div>
          <div className="empty-state-text">
            When someone shares documents with you, they will appear here.
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
