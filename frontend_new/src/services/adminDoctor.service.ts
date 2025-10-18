import api from './api';
const BASE_URL = '/doctors';

// Get all doctors (optional filters)
export const getAllDoctors = async (params?: { specialization?: string; search?: string }) => {
    const res = await api.get(BASE_URL, { params });
    return res.data;
};

// Get a single doctor by ID
export const getDoctorById = async (id: string) => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
};

// Create a new doctor (Admin only)
export const createDoctor = async (data: { name: string; email: string; phone: string; specialization: string; username: string; password: string }) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
};

// Update an existing doctor (Admin only)
export const updateDoctor = async (
    id: string,
    data: {
        name?: string;
        email?: string;
        phone?: string;
        specialization?: string;
        username?: string;
        password?: string;
    }
) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

// Delete (soft delete) a doctor (Admin only)
export const deleteDoctor = async (id: string) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
};
