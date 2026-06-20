import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'patient',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.role) e.role = 'Please select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="topbar-logo-icon">M</span>
          MedBridge
        </div>
        <h1>Create your account</h1>
        <p>Get started with MedBridge today</p>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">I am a</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-pill ${form.role === 'patient' ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, role: 'patient' }))}
                id="role-patient"
              >
                🧑 I'm a Patient
              </button>
              <button
                type="button"
                className={`role-pill ${form.role === 'doctor' ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, role: 'doctor' }))}
                id="role-doctor"
              >
                🩺 I'm a Doctor
              </button>
            </div>
            {errors.role && <div className="form-error">{errors.role}</div>}
          </div>

          <Input
            label="Full Name"
            placeholder="Dr. Priya Sharma"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            error={errors.full_name}
            id="register-name"
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            error={errors.email}
            id="register-email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            error={errors.password}
            id="register-password"
          />
          <Input
            label="Phone (optional)"
            placeholder="9876543210"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            id="register-phone"
          />
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            style={{ width: '100%' }}
          >
            Create Account
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
