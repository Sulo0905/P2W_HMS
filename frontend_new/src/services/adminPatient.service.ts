import api from './api'; //  use preconfigured Axios instance

const BASE_URL = '/patients'; // api already has baseURL: http://localhost:3004/api

//  Get all patients
export const getAllPatients = async () => {
    const res = await api.get(BASE_URL);
    return res.data;
};

//  Get a single patient by ID
export const getPatientById = async (id: string) => {
    const res = await api.get(`${BASE_URL}/${id}`);
    return res.data;
};

//  Create a new patient (Admin only)
export const createPatient = async (data: any) => {
    const res = await api.post(BASE_URL, data);
    return res.data;
};

//  Update an existing patient (Admin only)
export const updatePatient = async (id: string, data: any) => {
    const res = await api.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

//  Delete (soft delete) a patient (Admin only)
export const deletePatient = async (id: string) => {
    const res = await api.delete(`${BASE_URL}/${id}`);
    return res.data;
};

//  Add a health record to a patient
export const addHealthRecord = async (id: string, data: any) => {
    const res = await api.post(`${BASE_URL}/${id}/health-records`, data);
    return res.data;
};

// Get all health records of a patient
export const getPatientHealthRecords = async (id: string) => {
    const res = await api.get(`${BASE_URL}/${id}/health-records`);
    return res.data;
};
