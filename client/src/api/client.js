import axios from 'axios';

const client = axios.create({ baseURL: '' });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('mb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
      err.response.data.detail = err.response.data.detail.map(e => `${e.loc[e.loc.length - 1] || 'Field'}: ${e.msg}`).join(', ');
    }
    return Promise.reject(err);
  }
);

export default client;
