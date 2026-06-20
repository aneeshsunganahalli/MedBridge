import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../api/schedules';
import { formatTime, getDayName } from '../../utils/format';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function ManageSchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ day_of_week: 0, start_time: '09:00', end_time: '13:00', is_available: true });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getSchedules();
      setSchedules(res.data);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = (day) => {
    setEditing(null);
    setForm({ day_of_week: day ?? 0, start_time: '09:00', end_time: '13:00', is_available: true });
    setDrawerOpen(true);
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
      is_available: schedule.is_available,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
        is_available: form.is_available,
      };
      if (editing) {
        await updateSchedule(editing.id, payload);
        toast.success('Schedule updated');
      } else {
        await createSchedule(payload);
        toast.success('Schedule added');
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      toast.success('Schedule deleted');
      setDeleteConfirm(null);
      load();
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  if (loading) {
    return (
      <PageWrapper title="My Schedule">
        <SkeletonCard count={4} />
      </PageWrapper>
    );
  }

  const schedulesByDay = DAYS.map(day => ({
    day,
    slots: schedules.filter(s => s.day_of_week === day),
  }));

  return (
    <PageWrapper title="My Schedule">
      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" onClick={() => openAdd()}>+ Add Availability</Button>
      </div>

      <div className="schedule-grid">
        {schedulesByDay.map(({ day, slots }) => (
          <div key={day} className="schedule-day">
            <div className="schedule-day-header">{getDayName(day)}</div>
            <div className="schedule-day-body">
              {slots.map(slot => (
                <div key={slot.id} className="schedule-slot">
                  <span className="schedule-slot-time">
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </span>
                  <div className="schedule-slot-actions">
                    <button title="Edit" onClick={() => openEdit(slot)}>✏️</button>
                    {deleteConfirm === slot.id ? (
                      <>
                        <button title="Confirm delete" onClick={() => handleDelete(slot.id)} style={{ color: 'var(--color-danger)' }}>✓</button>
                        <button title="Cancel" onClick={() => setDeleteConfirm(null)}>✕</button>
                      </>
                    ) : (
                      <button title="Delete" onClick={() => setDeleteConfirm(slot.id)}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
              {!slots.length && (
                <div className="schedule-add-link" onClick={() => openAdd(day)}>
                  + Add availability
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit Schedule' : 'Add Schedule'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Input
          label="Day of Week"
          type="select"
          value={form.day_of_week}
          onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
        >
          {DAYS.map(d => (
            <option key={d} value={d}>{getDayName(d, true)}</option>
          ))}
        </Input>
        <Input
          label="Start Time"
          type="time"
          value={form.start_time}
          onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
        />
        <Input
          label="End Time"
          type="time"
          value={form.end_time}
          onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
        />
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
              style={{ accentColor: 'var(--color-accent)' }}
            />
            Available
          </label>
        </div>
      </Drawer>
    </PageWrapper>
  );
}
