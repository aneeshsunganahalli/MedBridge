import client from './client';

export const listDocuments = (tag) => {
  const params = tag && tag !== 'all' ? { tag } : {};
  return client.get('/api/documents/', { params });
};

export const uploadDocument = (formData) =>
  client.post('/api/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getDocument = (id) =>
  client.get(`/api/documents/${id}`);

export const getDocumentFileUrl = (id) =>
  `/api/documents/${id}/file`;

export const deleteDocument = (id) =>
  client.delete(`/api/documents/${id}`);
