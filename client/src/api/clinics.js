import client from './client';

export const getClinics = () =>
  client.get('/api/clinics/');

export const createClinic = (data) =>
  client.post('/api/clinics/', data);

export const updateClinic = (id, data) =>
  client.put(`/api/clinics/${id}`, data);

export const getClinic = (id) =>
  client.get(`/api/clinics/${id}`);
