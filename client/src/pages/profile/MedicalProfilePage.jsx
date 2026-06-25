import { useState, useEffect } from 'react';
import PageWrapper from '../../components/Layout/PageWrapper';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { getMedicalProfile, updateMedicalProfile } from '../../api/medical';
import { saveSnapshot } from '../../utils/offlineStore';

export default function MedicalProfilePage() {
  const [data, setData] = useState({
    blood_type: '',
    allergies: '',
    active_medications: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getMedicalProfile()
      .then(res => {
        setData({
          blood_type: res.data.blood_type || '',
          allergies: res.data.allergies || '',
          active_medications: res.data.active_medications || '',
          medical_conditions: res.data.medical_conditions || '',
          emergency_contact_name: res.data.emergency_contact_name || '',
          emergency_contact_phone: res.data.emergency_contact_phone || '',
        });
        // Cache initially on load as well
        saveSnapshot(res.data);
      })
      .catch(() => toast.error('Failed to load medical profile'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleChange = (e) => {
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMedicalProfile(data);
      toast.success('Medical profile updated');
      // Update offline snapshot
      await saveSnapshot(res.data);
      toast.success('Offline emergency snapshot updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Medical Profile">
        <div className="card">
          <div className="skeleton" style={{ height: '300px' }}></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Medical Profile">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Keep this information up to date. This data is securely cached on your device for emergency offline access.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="two-col" style={{ gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select name="blood_type" value={data.blood_type} onChange={handleChange} className="form-input">
                <option value="">Select...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input type="text" name="emergency_contact_name" value={data.emergency_contact_name} onChange={handleChange} className="form-input" placeholder="e.g. Jane Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input type="tel" name="emergency_contact_phone" value={data.emergency_contact_phone} onChange={handleChange} className="form-input" placeholder="e.g. +1 234 567 890" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Allergies</label>
            <textarea name="allergies" value={data.allergies} onChange={handleChange} className="form-input" rows={2} placeholder="List any allergies..." />
          </div>

          <div className="form-group">
            <label className="form-label">Active Medications</label>
            <textarea name="active_medications" value={data.active_medications} onChange={handleChange} className="form-input" rows={2} placeholder="Current medications and dosages..." />
          </div>

          <div className="form-group">
            <label className="form-label">Medical Conditions</label>
            <textarea name="medical_conditions" value={data.medical_conditions} onChange={handleChange} className="form-input" rows={2} placeholder="Chronic conditions, past surgeries..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile & Sync Offline'}
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
