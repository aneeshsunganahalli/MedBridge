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

export const getDocumentFileUrl = (id) => {
  const token = localStorage.getItem('mb_token');
  return `/api/documents/${id}/file${token ? `?token=${token}` : ''}`;
};

export const viewDocumentFile = async (id) => {
  const res = await client.get(`/api/documents/${id}/file`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: res.headers['content-type'] });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

export const deleteDocument = (id) =>
  client.delete(`/api/documents/${id}`);
