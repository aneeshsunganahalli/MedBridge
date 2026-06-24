import { useState, useEffect, useRef, useMemo } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { listDocuments, uploadDocument, deleteDocument, viewDocumentFile } from '../../api/documents';
import { createShareLink, getQrCodeUrl } from '../../api/sharing';

const TAGS = ['all', 'prescription', 'report', 'scan', 'bill', 'discharge_summary', 'other'];
const TAG_LABELS = { all: 'All', prescription: 'Prescription', report: 'Report', scan: 'Scan', bill: 'Bill', discharge_summary: 'Discharge Summary', other: 'Other' };

const DATE_RANGES = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'A to Z', value: 'az' },
  { label: 'Z to A', value: 'za' },
];

function FileTypeIcon({ mimeType }) {
  if (mimeType === 'application/pdf') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', tag: 'other', file: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  // Filtering state
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Sharing state
  const [shareMode, setShareMode] = useState('all'); // 'all' or 'selected'
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [shareExpiry, setShareExpiry] = useState(24);
  const [shareEmails, setShareEmails] = useState('');
  const [shareResult, setShareResult] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInput = useRef(null);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await listDocuments(activeTag === 'all' ? null : activeTag);
      setDocuments(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeTag]);

  // Client-side filtering and sorting
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(doc =>
        doc.title.toLowerCase().includes(q) ||
        doc.original_filename.toLowerCase().includes(q) ||
        (doc.description && doc.description.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(doc => new Date(doc.uploaded_at) >= cutoff);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.uploaded_at) - new Date(b.uploaded_at));
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return result;
  }, [documents, search, dateRange, sortBy]);

  const activeFilterCount = [
    search.trim() ? 1 : 0,
    dateRange !== 'all' ? 1 : 0,
    sortBy !== 'newest' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleUpload = async () => {
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    if (!form.file) { setErrors({ file: 'Please select a file' }); return; }

    const fd = new FormData();
    fd.append('file', form.file);
    fd.append('title', form.title);
    if (form.description) fd.append('description', form.description);
    fd.append('tag', form.tag);

    setSaving(true);
    try {
      await uploadDocument(fd);
      toast.success('Document uploaded');
      setDrawerOpen(false);
      setForm({ title: '', description: '', tag: 'other', file: null });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      setDeleteConfirm(null);
      load();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleView = async (id) => {
    setViewingId(id);
    try {
      await viewDocumentFile(id);
    } catch {
      toast.error('Failed to open document');
    } finally {
      setViewingId(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) setForm(f => ({ ...f, file }));
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const payload = {
        is_folder_share: shareMode === 'all',
        document_ids: shareMode === 'selected' ? selectedDocs : undefined,
        expires_in_hours: shareExpiry,
        allowed_emails: shareEmails.trim() ? shareEmails.split(',').map(e => e.trim()) : undefined,
      };
      const res = await createShareLink(payload);
      setShareResult(res.data);
      toast.success('Share link created');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create share link');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (shareResult?.share_url) {
      navigator.clipboard.writeText(shareResult.share_url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const openShareDrawer = (mode = 'all', docId = null) => {
    setShareMode(mode);
    setSelectedDocs(docId ? [docId] : []);
    setShareResult(null);
    setCopied(false);
    setShareExpiry(24);
    setShareEmails('');
    setShareDrawerOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setDateRange('all');
    setSortBy('newest');
  };

  if (loading) {
    return <PageWrapper title="My Documents"><SkeletonCard count={4} /></PageWrapper>;
  }

  return (
    <PageWrapper title="My Documents">
      {/* Toolbar */}
      <div className="doc-toolbar">
        <div className="doc-toolbar-left">
          <div className="doc-search-inline">
            <svg className="doc-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="doc-search-input"
              id="doc-search"
            />
            {search && (
              <button className="doc-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <button
            className={`doc-filter-toggle ${showFilters || activeFilterCount > 0 ? 'active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
            title="Toggle filters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
        </div>
        <div className="doc-toolbar-right">
          <Button variant="secondary" onClick={() => openShareDrawer('all')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share All
          </Button>
          <Button variant="primary" onClick={() => { setDrawerOpen(true); setErrors({}); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Upload
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="doc-filters-panel">
          <div className="doc-filters-row">
            <div className="doc-filter-group">
              <label className="doc-filter-label">Category</label>
              <div className="doc-tag-pills">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    className={`doc-tag-pill ${activeTag === tag ? 'active' : ''}`}
                    onClick={() => setActiveTag(tag)}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                ))}
              </div>
            </div>
            <div className="doc-filter-group">
              <label className="doc-filter-label">Date Range</label>
              <select
                className="form-input doc-filter-select"
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
              >
                {DATE_RANGES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="doc-filter-group">
              <label className="doc-filter-label">Sort By</label>
              <select
                className="form-input doc-filter-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button className="doc-clear-filters" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {(search || dateRange !== 'all' || activeTag !== 'all') && (
        <div className="doc-results-count">
          {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
          {activeTag !== 'all' && ` in ${TAG_LABELS[activeTag]}`}
        </div>
      )}

      {/* Document Grid */}
      {filteredDocuments.length ? (
        <div className="doc-grid">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-type-icon">
                  <FileTypeIcon mimeType={doc.mime_type} />
                </span>
                <Badge variant="grey">{TAG_LABELS[doc.tag] || doc.tag}</Badge>
              </div>
              <div className="doc-card-title">{doc.title}</div>
              <div className="doc-card-meta">
                {doc.original_filename} &middot; {new Date(doc.uploaded_at).toLocaleDateString()}
              </div>
              <div className="doc-card-actions">
                <Button
                  size="sm"
                  variant="secondary"
                  loading={viewingId === doc.id}
                  onClick={() => handleView(doc.id)}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openShareDrawer('selected', doc.id)}
                  title="Share this document"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share
                </Button>
                {deleteConfirm === doc.id ? (
                  <div className="confirm-inline">
                    <span>Delete?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>Yes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(doc.id)} title="Delete document">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No documents found"
          message={activeTag !== 'all' ? `No ${TAG_LABELS[activeTag].toLowerCase()} documents. Try a different filter.` : search ? 'No documents match your search.' : 'Upload your first document to get started.'}
          actionLabel="Upload Document"
          onAction={() => setDrawerOpen(true)}
        />
      )}

      {/* Upload Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Upload Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleUpload}>Upload</Button>
          </>
        }
      >
        <div
          className={`file-drop ${dragActive ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <div className="file-drop-icon-svg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="file-drop-text">Drag and drop a file here, or click to browse</div>
          <div className="file-drop-hint">Supported: PDF, PNG, JPG, WEBP</div>
          {form.file && <div className="file-drop-selected">Selected: {form.file.name}</div>}
          <input
            ref={fileInput}
            type="file"
            style={{ display: 'none' }}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))}
          />
        </div>
        {errors.file && <div className="form-error" style={{ marginTop: -12, marginBottom: 12 }}>{errors.file}</div>}

        <Input
          label="Title *"
          placeholder="Blood Report - June 2025"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          error={errors.title}
        />
        <Input
          label="Description"
          type="textarea"
          placeholder="Optional description..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <Input
          label="Tag"
          type="select"
          value={form.tag}
          onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
        >
          {TAGS.filter(t => t !== 'all').map(t => (
            <option key={t} value={t}>{TAG_LABELS[t]}</option>
          ))}
        </Input>
      </Drawer>

      {/* Share Drawer */}
      <Drawer
        open={shareDrawerOpen}
        onClose={() => setShareDrawerOpen(false)}
        title="Share Documents"
        footer={
          !shareResult ? (
            <>
              <Button variant="secondary" onClick={() => setShareDrawerOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={sharing}
                onClick={handleShare}
                disabled={shareMode === 'selected' && selectedDocs.length === 0}
              >
                Create Share Link
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setShareDrawerOpen(false)}>Done</Button>
          )
        }
      >
        {!shareResult ? (
          <>
            <div className="share-mode-selector">
              <label className="doc-filter-label">Share Mode</label>
              <div className="share-mode-pills">
                <button
                  className={`share-mode-pill ${shareMode === 'all' ? 'active' : ''}`}
                  onClick={() => { setShareMode('all'); setSelectedDocs([]); }}
                >
                  All Documents
                </button>
                <button
                  className={`share-mode-pill ${shareMode === 'selected' ? 'active' : ''}`}
                  onClick={() => setShareMode('selected')}
                >
                  Select Specific
                </button>
              </div>
            </div>

            {shareMode === 'selected' && (
              <div className="share-doc-list">
                <label className="doc-filter-label">Select Documents</label>
                {documents.map(doc => (
                  <label key={doc.id} className={`share-doc-item ${selectedDocs.includes(doc.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleDocSelection(doc.id)}
                    />
                    <div className="share-doc-item-info">
                      <div className="share-doc-item-title">{doc.title}</div>
                      <div className="share-doc-item-meta">{TAG_LABELS[doc.tag] || doc.tag} &middot; {doc.original_filename}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="share-expiry" style={{ marginTop: 16 }}>
              <Input
                label="Link Expires In"
                type="select"
                value={shareExpiry}
                onChange={e => setShareExpiry(Number(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </Input>
            </div>

            <div className="share-emails" style={{ marginTop: 16 }}>
              <Input
                label="Allowed Emails (Optional)"
                placeholder="email1@example.com, email2@example.com"
                value={shareEmails}
                onChange={e => setShareEmails(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Leave blank to allow any logged-in user with the link to view.
              </p>
            </div>
          </>
        ) : (
          <div className="share-result">
            <div className="share-result-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Share link created successfully</span>
            </div>

            <div className="share-result-url-group">
              <label className="doc-filter-label">Share URL</label>
              <div className="share-result-url">
                <input type="text" readOnly value={shareResult.share_url} className="form-input" />
                <Button variant="primary" size="sm" onClick={handleCopyLink}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="share-result-qr">
              <label className="doc-filter-label">QR Code</label>
              <div className="share-result-qr-actions" style={{ marginTop: '0.5rem' }}>
                <Button variant="secondary" onClick={() => window.open(`/share-qr/${shareResult.token}`, '_blank')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View & Export QR Code
                </Button>
              </div>
              <p className="share-result-qr-hint">Scan this code to access the shared documents</p>
            </div>

            <div className="share-result-meta">
              <span>Expires: {new Date(shareResult.expires_at).toLocaleString()}</span>
              <span>{shareResult.is_folder_share ? 'All documents' : 'Selected documents'}</span>
            </div>
          </div>
        )}
      </Drawer>
    </PageWrapper>
  );
}
