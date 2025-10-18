import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:3004/api';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export interface PaginationParams {
    page?: number;
    limit?: number;
}

// ENT Patients API
export const entAPI = {
    getAllPatients: (includeDeleted = false) => api.get(`/ent`, { params: { includeDeleted } }),
    getPatientById: (id: string, includeDeleted = false) => api.get(`/ent/${id}`, { params: { includeDeleted } }),
    getPatientByPatientId: (patientId: string, includeDeleted = false) => api.get(`/ent/patient/${patientId}`, { params: { includeDeleted } }),
    createPatient: (patientData: unknown) => api.post('/ent', patientData),
    updatePatient: (id: string, patientData: unknown) => api.put(`/ent/${id}`, patientData),
    deletePatient: (id: string) => api.delete(`/ent/${id}`),
    addLog: (id: string, logData: unknown) => api.post(`/ent/${id}/logs`, logData),
    updateLog: (id: string, logId: string, logData: unknown) => api.put(`/ent/${id}/logs/${logId}`, logData),
    deleteLog: (id: string, logId: string) => api.delete(`/ent/${id}/logs/${logId}`),
    getLogsByType: (id: string, logType: string) => api.get(`/ent/${id}/logs/type/${logType}`),
    listLogs: (id: string, { logType, from, to, loggedBy, page, limit }: { logType?: string; from?: string; to?: string; loggedBy?: string } & PaginationParams = {}) =>
        api.get(`/ent/${id}/logs`, { params: { logType, from, to, loggedBy, page, limit } }),
};

// Obstetrics Patients API
export const obstetricsAPI = {
    getAllPatients: (includeDeleted = false) => api.get('/obstetrics', { params: { includeDeleted } }),
    getPatientById: (id: string, includeDeleted = false) => api.get(`/obstetrics/${id}`, { params: { includeDeleted } }),
    getPatientByPatientId: (patientId: string, includeDeleted = false) => api.get(`/obstetrics/patient/${patientId}`, { params: { includeDeleted } }),
    createPatient: (patientData: unknown) => api.post('/obstetrics', patientData),
    updatePatient: (id: string, patientData: unknown) => api.put(`/obstetrics/${id}`, patientData),
    deletePatient: (id: string) => api.delete(`/obstetrics/${id}`),
    addLog: (id: string, logData: unknown) => api.post(`/obstetrics/${id}/logs`, logData),
    updateLog: (id: string, logId: string, logData: unknown) => api.put(`/obstetrics/${id}/logs/${logId}`, logData),
    deleteLog: (id: string, logId: string) => api.delete(`/obstetrics/${id}/logs/${logId}`),
    getLogsByType: (id: string, logType: string) => api.get(`/obstetrics/${id}/logs/type/${logType}`),
    listLogs: (id: string, { logType, from, to, loggedBy, trimester, page, limit }: { logType?: string; from?: string; to?: string; loggedBy?: string; trimester?: string } & PaginationParams = {}) =>
        api.get(`/obstetrics/${id}/logs`, { params: { logType, from, to, loggedBy, trimester, page, limit } }),
    getTimeline: (id: string) => api.get(`/obstetrics/${id}/timeline`),
    getProgress: (id: string) => api.get(`/obstetrics/${id}/progress`),
};

// Health check API
export const healthAPI = {
    checkHealth: () => api.get('/health'),
    getApiDocs: () => api.get('/'),
};

// Master Patients API
export const masterPatientsAPI = {
    register: (payload: unknown) => api.post('/patients/register', payload),
    getByPatientId: (patientId: string) => api.get(`/patients/${encodeURIComponent(patientId)}`),
    checkPatientId: (patientId: string) => api.post('/patients/check', { patientId }),
};

// Reports API
export const reportsAPI = {
    getAnalytics: (params: Record<string, unknown> = {}) => api.get('/reports/analytics', { params }),
    getOutcomes: (params: Record<string, unknown> = {}) => api.get('/reports/outcomes', { params }),
    getPerformanceMetrics: (params: Record<string, unknown> = {}) => api.get('/reports/performance', { params }),
    getTreatmentEffectiveness: () => api.get('/reports/treatment-effectiveness'),
};

export default api;
