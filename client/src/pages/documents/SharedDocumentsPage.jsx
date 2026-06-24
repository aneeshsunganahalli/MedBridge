import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '../../components/Layout/PageWrapper';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { getSharedDocuments, viewSharedDocumentFile, downloadSharedDocumentFile } from '../../api/sharing';

const TAG_LABELS = {
  prescription: 'Prescription',
  report: 'Report',
  scan: 'Scan',
  bill: 'Bill',
  discharge_summary: 'Discharge Summary',
  other: 'Other',
};

export default function SharedDocumentsPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    getSharedDocuments(token)
      .then(res => setData(res.data))
      .catch(err => {
        const status = err.response?.status;
        if (status === 404) {
          setError('This share link was not found. It may have been removed.');
        } else if (status === 410) {
          setError('This share link has expired and is no longer accessible.');
        } else if (status === 403) {
          setError('Access denied. Your email address is not in the allowed list for this shared link.');
        } else {
          setError('Unable to load shared documents. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <PageWrapper title="Shared Documents">
        <SkeletonCard count={4} />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Shared Documents">
        <div className="shared-error-state">
          <div className="shared-error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h2 className="shared-error-title">Access Denied</h2>
          <p className="shared-error-text">{error}</p>
        </div>
      </PageWrapper>
    );
  }

  const filteredDocs = data?.documents?.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    doc.original_filename.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <PageWrapper title="Shared Documents">
      <div className="shared-header">
        <div className="shared-header-info">
          <div className="shared-owner-label">Shared by</div>
          <div className="shared-owner-name">{data?.owner_name || 'Unknown'}</div>
          <Badge variant={data?.is_folder_share ? 'blue' : 'grey'}>
            {data?.is_folder_share ? 'All Documents' : `${filteredDocs.length} document${filteredDocs.length !== 1 ? 's' : ''}`}
          </Badge>
        </div>
      </div>

      {filteredDocs.length > 3 && (
        <div className="shared-search">
          <svg className="shared-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {filteredDocs.length > 0 ? (
        <div className="doc-grid">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-type-icon">
                  {doc.mime_type === 'application/pdf' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </span>
                <Badge variant="grey">{TAG_LABELS[doc.tag] || doc.tag}</Badge>
              </div>
              <div className="doc-card-title">{doc.title}</div>
              <div className="doc-card-meta">
                {doc.original_filename} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
              </div>
              {doc.description && (
                <div className="doc-card-description">{doc.description}</div>
              )}
              <div className="doc-card-actions">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => viewSharedDocumentFile(token, doc.id)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadSharedDocumentFile(token, doc.id, doc.original_filename)}
                >
                  Download
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
          <div className="empty-state-title">No documents found</div>
          <div className="empty-state-text">
            {search ? 'Try a different search term.' : 'No documents have been shared via this link.'}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
