import api from './api';

const BASE_URL = '/appointments';

// Get all appointments (Admin, Doctor)
export const getAllAppointments = async () => {
    const res = await api.get(BASE_URL);
    return res.data;
};

// Get a single appointment by ID
export const getAppointmentById = async (id: string) => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
};

// Create a new appointment (Admin or Patient)
export const createAppointment = async (data: any) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
};

// Update an appointment (Admin only)
export const updateAppointment = async (id: string, data: any) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

// Delete an appointment (Admin only)
export const deleteAppointment = async (id: string) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
};

// Get upcoming appointments (Admin, Doctor)
export const getUpcomingAppointments = async () => {
    const res = await api.get(`${BASE_URL}/upcoming`);
    return res.data;
};

// Get appointments by date range (Admin, Doctor)
export const getAppointmentsByDateRange = async (startDate: string, endDate: string) => {
    const res = await api.get(`${BASE_URL}/date-range`, {
        params: { startDate, endDate },
    });
    return res.data;
};
