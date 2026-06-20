import client from './client';

export const listDoctors = () =>
  client.get('/api/doctors/');
