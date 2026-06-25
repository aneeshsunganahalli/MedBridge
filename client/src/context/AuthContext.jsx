import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';
import { getMedicalProfile } from '../api/medical';
import { saveSnapshot, clearSnapshot } from '../utils/offlineStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mb_token');
    if (token) {
      authApi.getMe()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('mb_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token } = res.data;
    localStorage.setItem('mb_token', access_token);
    const meRes = await authApi.getMe();
    setUser(meRes.data);
    if (meRes.data.role === 'patient') {
      try {
        const medRes = await getMedicalProfile();
        await saveSnapshot(medRes.data);
      } catch (e) {
        console.error('Failed to cache medical profile', e);
      }
    }
    return meRes.data;
  }, []);

  const register = useCallback(async (data) => {
    await authApi.register(data);
    // Auto-login after register
    return login(data.email, data.password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('mb_token');
    clearSnapshot();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
