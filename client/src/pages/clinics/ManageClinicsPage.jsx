import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { getClinics, createClinic, updateClinic } from '../../api/clinics';

export default function ManageClinicsPage() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', description: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      const res = await getClinics();
      setClinics(res.data);
    } catch {
      toast.error('Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', address: '', description: '', phone: '' });
    setErrors({});
    setDrawerOpen(true);
  };

  const openEdit = (clinic) => {
    setEditing(clinic);
    setForm({
      name: clinic.name,
      address: clinic.address || '',
      description: clinic.description || '',
      phone: clinic.phone || '',
    });
    setErrors({});
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateClinic(editing.id, form);
        toast.success('Clinic updated');
      } else {
        await createClinic(form);
        toast.success('Clinic added');
      }
      setDrawerOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save clinic');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="My Clinics">
        <SkeletonCard count={3} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="My Clinics">
      <div style={{ marginBottom: 16 }}>
        <Button variant="primary" onClick={openAdd}>+ Add Clinic</Button>
      </div>

      {clinics.length ? (
        clinics.map(clinic => (
          <div key={clinic.id} className="clinic-card">
            <div className="clinic-card-info">
              <h3>{clinic.name}</h3>
              {clinic.address && <p>📍 {clinic.address}</p>}
              {clinic.phone && <p>📞 {clinic.phone}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => openEdit(clinic)}>✏️ Edit</Button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState
          icon="🏥"
          title="No clinics yet"
          message="Add your first clinic to start accepting appointments."
          actionLabel="Add Clinic"
          onAction={openAdd}
        />
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? 'Edit Clinic' : 'Add Clinic'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>Save</Button>
          </>
        }
      >
        <Input
          label="Clinic Name *"
          placeholder="Sharma Clinic"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <Input
          label="Address"
          placeholder="Koramangala, Bengaluru"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        />
        <Input
          label="Description"
          type="textarea"
          placeholder="Brief description of your clinic"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
        <Input
          label="Phone"
          placeholder="9876543210"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
      </Drawer>
    </PageWrapper>
  );
}
