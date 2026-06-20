import { useState, useEffect, useRef } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { listDocuments, uploadDocument, deleteDocument, getDocumentFileUrl } from '../../api/documents';

const TAGS = ['all', 'prescription', 'report', 'scan', 'bill', 'discharge_summary', 'other'];
const TAG_LABELS = { all: 'All', prescription: 'Prescription', report: 'Report', scan: 'Scan', bill: 'Bill', discharge_summary: 'Discharge Summary', other: 'Other' };
const FILE_ICONS = { 'application/pdf': '📄', 'image/png': '🖼️', 'image/jpeg': '🖼️', 'image/jpg': '🖼️', 'image/webp': '🖼️' };

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', tag: 'other', file: null });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) setForm(f => ({ ...f, file }));
  };

  if (loading) {
    return <PageWrapper title="My Documents"><SkeletonCard count={4} /></PageWrapper>;
  }

  return (
    <PageWrapper title="My Documents">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {TAGS.map(tag => (
            <button key={tag} className={`tab ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(tag)}>
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
        <Button variant="primary" onClick={() => { setDrawerOpen(true); setErrors({}); }}>+ Upload Document</Button>
      </div>

      {documents.length ? (
        <div className="doc-grid">
          {documents.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-icon">{FILE_ICONS[doc.mime_type] || '📄'}</span>
                <Badge variant="grey">{TAG_LABELS[doc.tag] || doc.tag}</Badge>
              </div>
              <div className="doc-card-title">{doc.title}</div>
              <div className="doc-card-meta">
                {doc.original_filename} · {new Date(doc.uploaded_at).toLocaleDateString()}
              </div>
              <div className="doc-card-actions">
                <Button size="sm" variant="secondary" onClick={() => window.open(getDocumentFileUrl(doc.id), '_blank')}>
                  View
                </Button>
                {deleteConfirm === doc.id ? (
                  <div className="confirm-inline">
                    <span>Delete?</span>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(doc.id)}>Yes</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(doc.id)}>🗑️</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📄"
          title="No documents found"
          message={activeTag !== 'all' ? `No ${TAG_LABELS[activeTag].toLowerCase()} documents. Try a different filter.` : 'Upload your first document to get started.'}
          actionLabel="Upload Document"
          onAction={() => setDrawerOpen(true)}
        />
      )}

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
          <div className="file-drop-icon">📎</div>
          <div className="file-drop-text">Drag & drop a file here, or click to browse</div>
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
    </PageWrapper>
  );
}
