import client from './client';

export const getMedicalProfile = () =>
  client.get('/api/medical-profile/');

export const updateMedicalProfile = (data) =>
  client.put('/api/medical-profile/', data);
