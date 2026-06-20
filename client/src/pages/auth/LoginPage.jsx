import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const user = await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
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
        <h1>Welcome back</h1>
        <p>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="form-error" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              {errors.general}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            error={errors.email}
            id="login-email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            error={errors.password}
            id="login-password"
          />
          <div className="remember-me">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>
          <Button
            variant="primary"
            type="submit"
            loading={loading}
            style={{ width: '100%' }}
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
