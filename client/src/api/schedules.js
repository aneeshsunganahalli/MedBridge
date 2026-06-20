import client from './client';

export const getSchedules = () =>
  client.get('/api/schedules/');

export const createSchedule = (data) =>
  client.post('/api/schedules/', data);

export const updateSchedule = (id, data) =>
  client.put(`/api/schedules/${id}`, data);

export const deleteSchedule = (id) =>
  client.delete(`/api/schedules/${id}`);
