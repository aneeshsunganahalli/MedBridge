import client from './client';

export const createShareLink = (payload) =>
  client.post('/api/sharing/', payload);

export const getSharedDocuments = (token) =>
  client.get(`/api/sharing/access/${token}`);

export const viewSharedDocumentFile = (token, documentId) =>
  client.get(`/api/sharing/access/${token}/documents/${documentId}/file`, {
    responseType: 'blob'
  }).then(res => {
    const url = URL.createObjectURL(res.data);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

export const downloadSharedDocumentFile = (token, documentId, filename) =>
  client.get(`/api/sharing/access/${token}/documents/${documentId}/file`, {
    responseType: 'blob'
  }).then(res => {
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

export const getQrCodeUrl = (token) =>
  `/api/sharing/qr/${token}`;

export const getQrCodeBlobUrl = (token) =>
  client.get(`/api/sharing/qr/${token}`, {
    responseType: 'blob'
  }).then(res => {
    return URL.createObjectURL(res.data);
  });

export const getSharedWithMe = () =>
  client.get('/api/sharing/shared-with-me');

export const listMyShareLinks = () =>
  client.get('/api/sharing/');
