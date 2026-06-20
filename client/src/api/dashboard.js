import client from './client';

export const getDoctorDashboard = () =>
  client.get('/api/dashboard/doctor');

export const getPatientDashboard = () =>
  client.get('/api/dashboard/patient');
