
import api from './index';

export const getReports = (params) => api.get('/reports', { params });
export const getReport = (id) => api.get(`/reports/${id}`);
export const exportReport = (id) => api.get(`/reports/${id}/export`, { responseType: 'blob' });