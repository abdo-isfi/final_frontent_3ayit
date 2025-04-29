import axios from 'axios';

// Create an axios instance with our API configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Groups API endpoints
export const getGroups = () => api.get('/groups');
export const getGroup = (id) => api.get(`/groups/${id}`);
export const getGroupTrainees = (groupId) => api.get(`/groups/${groupId}/trainees`);
export const createGroup = (data) => api.post('/groups', data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);

// Trainees API endpoints
export const getTrainees = () => api.get('/trainees');
export const getTrainee = (id) => api.get(`/trainees/${id}`);
export const getTraineeAbsences = (id) => api.get(`/trainees/${id}/absences`);
export const getTraineeStatistics = (id) => api.get(`/trainees/${id}/statistics`);
export const createTrainee = (data) => api.post('/trainees', data);
export const updateTrainee = (id, data) => api.put(`/trainees/${id}`, data);
export const deleteTrainee = (id) => api.delete(`/trainees/${id}`);
export const bulkImportTrainees = (data) => api.post('/trainees/bulk-import', data);

// Absence API endpoints
export const getAbsences = (params) => api.get('/absences', { params });
export const getAbsence = (id) => api.get(`/absences/${id}`);
export const getGroupAbsences = (groupId, params) => 
  api.get(`/groups/${groupId}/absences`, { params });
export const createAbsence = (data) => api.post('/absences', data);
export const updateAbsence = (id, data) => api.put(`/absences/${id}`, data);
export const deleteAbsence = (id) => api.delete(`/absences/${id}`);
export const validateAbsences = (data) => api.post('/absences/validate', data);
export const justifyAbsences = (data) => api.post('/absences/justify', data);
export const markBilletEntree = (id) => api.patch(`/absences/${id}/billet-entree`);
export const getWeeklyReport = (groupId, params) => 
  api.get(`/groups/${groupId}/weekly-report`, { params });

export default api; 