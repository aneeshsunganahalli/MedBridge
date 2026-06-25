import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { getReminders, createReminder, updateReminder, deleteReminder, createSmartReminder } from '../../api/reminders';
import { formatRelativeTime } from '../../utils/format';

const REMINDER_ICONS = {
  medication: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18h9"/>
    </svg>
  ),
  appointment: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  custom: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
};

const TYPES = ['medication', 'appointment', 'custom'];
const TYPE_LABELS = { medication: 'Medication', appointment: 'Appointment', custom: 'Custom' };

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [entryMode, setEntryMode] = useState('smart'); // 'smart' or 'manual'
  const [smartPrompt, setSmartPrompt] = useState('');
  const [form, setForm] = useState({ title: '', description: '', reminder_time: '', type: 'custom', is_recurring: false, recurrence_pattern: 'daily' });
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
    if (entryMode === 'smart') {
      if (!smartPrompt.trim()) { setErrors({ smart: 'Please enter a schedule' }); return; }
      setSaving(true);
      try {
        const res = await createSmartReminder(smartPrompt);
        toast.success(res.data.message || 'Smart reminders created');
        setDrawerOpen(false);
        setSmartPrompt('');
        load();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to generate reminders');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); return; }
    if (!form.reminder_time) { setErrors({ reminder_time: 'Time is required' }); return; }

    setSaving(true);
    try {
      await createReminder({
        title: form.title,
        description: form.description || null,
        reminder_time: new Date(form.reminder_time).toISOString(),
        type: form.type,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : null,
      });
      toast.success('Reminder created');
      setDrawerOpen(false);
      setForm({ title: '', description: '', reminder_time: '', type: 'custom', is_recurring: false, recurrence_pattern: 'daily' });
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
        <Button variant="primary" onClick={() => { setDrawerOpen(true); setErrors({}); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Reminder
        </Button>
      </div>

      {sorted.length ? (
        sorted.map(rem => (
          <div key={rem.id} className={`reminder-row ${rem.is_completed ? 'completed' : ''}`}>
            <button
              className={`reminder-check ${rem.is_completed ? 'checked' : ''}`}
              onClick={() => handleToggle(rem)}
              title={rem.is_completed ? 'Mark incomplete' : 'Mark done'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <span className="reminder-icon">{REMINDER_ICONS[rem.type] || REMINDER_ICONS.custom}</span>
            <div className="reminder-content">
              <div className="reminder-title">{rem.title}</div>
              <div className="reminder-time">
                {formatRelativeTime(rem.reminder_time)}
                {rem.is_recurring && (
                  <span style={{ marginLeft: 8, fontSize: '0.75rem', padding: '2px 6px', background: 'var(--color-background)', borderRadius: '999px', color: 'var(--color-accent)' }}>
                    Repeats {rem.recurrence_pattern}
                  </span>
                )}
              </div>
            </div>
            <div className="reminder-actions">
              {deleteConfirm === rem.id ? (
                <div className="confirm-inline">
                  <span>Delete?</span>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(rem.id)}>Yes</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>No</Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(rem.id)} title="Delete reminder">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </Button>
              )}
            </div>
          </div>
        ))
      ) : (
        <EmptyState
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
        <div className="share-mode-selector" style={{ marginBottom: 16 }}>
          <div className="share-mode-pills" style={{ display: 'flex', gap: 8, background: 'var(--color-surface)', padding: 4, borderRadius: 8 }}>
            <button
              type="button"
              className={`share-mode-pill ${entryMode === 'smart' ? 'active' : ''}`}
              onClick={() => { setEntryMode('smart'); setErrors({}); }}
              style={{ flex: 1, padding: '8px', border: 'none', background: entryMode === 'smart' ? 'var(--color-background)' : 'transparent', borderRadius: 4, cursor: 'pointer', fontWeight: entryMode === 'smart' ? 600 : 400, color: entryMode === 'smart' ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
            >
              ✨ Smart AI Entry
            </button>
            <button
              type="button"
              className={`share-mode-pill ${entryMode === 'manual' ? 'active' : ''}`}
              onClick={() => { setEntryMode('manual'); setErrors({}); }}
              style={{ flex: 1, padding: '8px', border: 'none', background: entryMode === 'manual' ? 'var(--color-background)' : 'transparent', borderRadius: 4, cursor: 'pointer', fontWeight: entryMode === 'manual' ? 600 : 400, color: entryMode === 'manual' ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
            >
              Manual Entry
            </button>
          </div>
        </div>

        {entryMode === 'smart' ? (
          <>
            <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Describe your schedule naturally. Our AI will automatically create all the necessary reminders for you.
            </div>
            <Input
              label="Your Schedule *"
              type="textarea"
              placeholder="e.g., Take one amoxicillin pill at 8am and 8pm for 7 days"
              value={smartPrompt}
              onChange={e => setSmartPrompt(e.target.value)}
              error={errors.smart}
              style={{ minHeight: 120 }}
            />
          </>
        ) : (
          <>
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
              <div className="role-selector" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`role-pill ${form.type === t ? 'selected' : ''}`}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{ padding: '8px', fontSize: '0.8rem' }}
                  >
                    {TYPE_LABELS[t]}
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
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                Make this a repeating reminder
              </label>
            </div>
            {form.is_recurring && (
              <Input
                label="Repeats"
                type="select"
                value={form.recurrence_pattern}
                onChange={e => setForm(f => ({ ...f, recurrence_pattern: e.target.value }))}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Input>
            )}
          </>
        )}
      </Drawer>
    </PageWrapper>
  );
}
