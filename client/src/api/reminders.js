import client from './client';

export const getReminders = () =>
  client.get('/api/reminders/');

export const createReminder = (data) =>
  client.post('/api/reminders/', data);

export const updateReminder = (id, data) =>
  client.put(`/api/reminders/${id}`, data);

export const deleteReminder = (id) =>
  client.delete(`/api/reminders/${id}`);
