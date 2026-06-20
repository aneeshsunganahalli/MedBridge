import client from './client';

export const login = (email, password) =>
  client.post('/api/auth/login', { email, password }, {
    headers: { 'Content-Type': 'application/json' }
  });

export const register = (data) =>
  client.post('/api/auth/register', data);

export const getMe = () =>
  client.get('/api/auth/me');
