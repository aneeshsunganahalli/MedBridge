import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { getReminders, createReminder, updateReminder, deleteReminder } from '../../api/reminders';
import { formatRelativeTime } from '../../utils/format';

const REMINDER_ICONS = { medication: '💊', appointment: '📅', custom: '🔔' };
const TYPES = ['medication', 'appointment', 'custom'];

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', reminder_time: '', type: 'custom' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getReminders();
      setReminders(res.data);
    } catch {
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    if (!form.reminder_time) { setErrors({ reminder_time: 'Time is required' }); return; }

    setSaving(true);
    try {
      await createReminder({
        title: form.title,
        description: form.description || null,
        reminder_time: new Date(form.reminder_time).toISOString(),
        type: form.type,
      });
      toast.success('Reminder created');
      setDrawerOpen(false);
      setForm({ title: '', description: '', reminder_time: '', type: 'custom' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rem) => {
    try {
      await updateReminder(rem.id, { is_completed: !rem.is_completed });
      toast.success(rem.is_completed ? 'Reminder reopened' : 'Reminder completed');
      load();
    } catch {
      toast.error('Failed to update reminder');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReminder(id);
      toast.success('Reminder deleted');
      setDeleteConfirm(null);
      load();
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  // Sort: upcoming first, completed last
  const sorted = [...reminders].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return new Date(a.reminder_time) - new Date(b.reminder_time);
  });

  if (loading) {
    return <PageWrapper title="Reminders"><SkeletonCard count={4} /></PageWrapper>;
  }

  return (
    <PageWrapper title="Reminders">
      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" onClick={() => { setDrawerOpen(true); setErrors({}); }}>+ Add Reminder</Button>
      </div>

      {sorted.length ? (
        sorted.map(rem => (
          <div key={rem.id} className={`reminder-row ${rem.is_completed ? 'completed' : ''}`}>
            <button
              className={`reminder-check ${rem.is_completed ? 'checked' : ''}`}
              onClick={() => handleToggle(rem)}
              title={rem.is_completed ? 'Mark incomplete' : 'Mark done'}
            >
              ✓
            </button>
            <span className="reminder-icon">{REMINDER_ICONS[rem.type] || '🔔'}</span>
            <div className="reminder-content">
              <div className="reminder-title">{rem.title}</div>
              <div className="reminder-time">{formatRelativeTime(rem.reminder_time)}</div>
            </div>
            <div className="reminder-actions">
              {deleteConfirm === rem.id ? (
                <div className="confirm-inline">
                  <span>Delete?</span>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(rem.id)}>Yes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(rem.id)}>🗑️</Button>
              )}
            </div>
          </div>
        ))
      ) : (
        <EmptyState
          icon="🔔"
          title="No reminders yet"
          message="Create a reminder to stay on top of your health."
          actionLabel="Add Reminder"
          onAction={() => setDrawerOpen(true)}
        />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Reminder"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Input
          label="Title *"
          placeholder="Take morning medication"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          error={errors.title}
        />
        <Input
          label="Date & Time *"
          type="datetime-local"
          value={form.reminder_time}
          onChange={e => setForm(f => ({ ...f, reminder_time: e.target.value }))}
          error={errors.reminder_time}
        />
        <div className="form-group">
          <label className="form-label">Type</label>
          <div className="role-selector">
            {TYPES.map(t => (
              <button
                key={t}
                type="button"
                className={`role-pill ${form.type === t ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{ padding: '8px', fontSize: '0.8rem' }}
              >
                {REMINDER_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Input
          label="Description"
          type="textarea"
          placeholder="Optional notes..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </Drawer>
    </PageWrapper>
  );
}
