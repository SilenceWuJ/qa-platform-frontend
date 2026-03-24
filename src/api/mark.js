import api from './index';

export const getMarks = () => api.get('/marks');
export const createMark = (data) => api.post('/marks', data);
export const updateMark = (id, data) => api.put(`/marks/${id}`, data);
export const deleteMark = (id) => api.delete(`/marks/${id}`);