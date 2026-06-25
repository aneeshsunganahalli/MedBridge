import client from './client';

export const initiateTriage = (payload) =>
  client.post('/api/triage/initiate', payload);

export const getActiveTriageSessions = () =>
  client.get('/api/triage/active');

export const closeTriageSession = (sessionId) =>
  client.patch(`/api/triage/${sessionId}/close`);
