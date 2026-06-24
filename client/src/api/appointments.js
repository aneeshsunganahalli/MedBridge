import client from './client';

export const createAppointment = (data) =>
  client.post('/api/appointments/', data);

export const getPatientAppointments = () =>
  client.get('/api/appointments/patient');

export const getDoctorAppointments = () =>
  client.get('/api/appointments/doctor');

export const cancelAppointment = (id) =>
  client.patch(`/api/appointments/${id}/cancel`);

export const completeAppointment = (id) =>
  client.patch(`/api/appointments/${id}/complete`);

export const getBookedSlots = (doctorId, date) =>
  client.get(`/api/appointments/doctor/${doctorId}/slots`, { params: { date } });

export const savePostVisitSummary = (id, summary) =>
  client.patch(`/api/appointments/${id}/summary`, { summary });

export const getAppointment = (id) =>
  client.get(`/api/appointments/${id}`);
