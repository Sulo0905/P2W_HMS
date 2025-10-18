import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Patient {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    patientType: string;
    assignedDoctor?: Doctor | null;
}

interface Doctor {
    _id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string;
    assignedPatients?: Patient[];
}

const API_BASE = 'http://localhost:3004/api';

const AssignPatient: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<string>('');

    // Fetch patients and doctors
    const fetchData = async () => {
        try {
            const [patientsRes, doctorsRes] = await Promise.all([axios.get(`${API_BASE}/patients`), axios.get(`${API_BASE}/doctors`)]);

            // Map patients to include assignedDoctor object
            const patientsData: Patient[] = patientsRes.data.data.map((p: any) => ({
                ...p,
                assignedDoctor: p.assignedDoctor ? doctorsRes.data.find((d: any) => d._id === p.assignedDoctor) : null,
            }));

            setPatients(patientsData);
            setDoctors(doctorsRes.data);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch patients or doctors');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const unassignedPatients = patients.filter((p) => !p.assignedDoctor);
    const assignedPatients = patients.filter((p) => p.assignedDoctor);

    // Assign patient
    const handleAssignPatient = async () => {
        if (!selectedPatient || !selectedDoctor) {
            alert('Please select both a patient and a doctor');
            return;
        }

        try {
            // Get token from localStorage (assuming you store JWT after login)
            const token = localStorage.getItem('token') || '';

            await assignPatientToDoctor(selectedPatient._id, selectedDoctor, token);

            // Update state locally
            const doctor = doctors.find((d) => d._id === selectedDoctor);
            setPatients((prev) => prev.map((p) => (p._id === selectedPatient._id ? { ...p, assignedDoctor: doctor } : p)));

            setShowAssignModal(false);
            setSelectedPatient(null);
            setSelectedDoctor('');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to assign patient');
        }
    };
    const assignPatientToDoctor = async (patientId: string, doctorId: string, token: string) => {
        try {
            await axios.post(
                `${API_BASE}/admin/assign-patient`,
                {
                    patientId,
                    doctorId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (error) {
            console.error(error);
            alert('Failed to assign patient');
        }
    };

    const handleUnassignPatient = async (patientId: string) => {
        if (!window.confirm('Are you sure you want to unassign this patient?')) return;

        try {
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Assign Patients to Doctors</h2>
            <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                <div style={{ background: '#e8f5e8', padding: '0.5rem 1rem', borderRadius: '20px' }}>Assigned: {assignedPatients.length}</div>
                <div style={{ background: '#fff3cd', padding: '0.5rem 1rem', borderRadius: '20px' }}>Unassigned: {unassignedPatients.length}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Unassigned */}
                <div>
                    <h3>Unassigned Patients</h3>
                    {unassignedPatients.map((p) => (
                        <div
                            key={p._id}
                            style={{
                                padding: '1rem',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold' }}>
                                    {p.firstName} {p.lastName}
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    {p.email} • {p.phone}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedPatient(p);
                                    setShowAssignModal(true);
                                }}
                                style={{
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                }}
                            >
                                Assign
                            </button>
                        </div>
                    ))}
                    {unassignedPatients.length === 0 && <div>No unassigned patients</div>}
                </div>

                {/* Assigned */}
                <div>
                    <h3>Assigned Patients</h3>
                    {assignedPatients.map((p) => (
                        <div
                            key={p._id}
                            style={{
                                padding: '1rem',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 'bold' }}>
                                    {p.firstName} {p.lastName}
                                </div>
                                {p.assignedDoctor && (
                                    <div style={{ fontSize: '0.875rem', color: '#27ae60' }}>
                                        Assigned to: {p.assignedDoctor.name} ({p.assignedDoctor.specialization})
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleUnassignPatient(p._id)}
                                style={{
                                    backgroundColor: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                }}
                            >
                                Unassign
                            </button>
                        </div>
                    ))}
                    {assignedPatients.length === 0 && <div>No assigned patients</div>}
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && selectedPatient && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '400px',
                        }}
                    >
                        <h3>
                            Assign {selectedPatient.firstName} {selectedPatient.lastName} to Doctor
                        </h3>
                        <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: '1rem' }}>
                            <option value="">Select a doctor</option>
                            {doctors.map((d) => (
                                <option key={d._id} value={d._id}>
                                    {d.name} ({d.specialization})
                                </option>
                            ))}
                        </select>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedPatient(null);
                                    setSelectedDoctor('');
                                }}
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Cancel
                            </button>
                            <button onClick={handleAssignPatient} style={{ padding: '0.5rem 1rem', backgroundColor: '#27ae60', color: 'white' }}>
                                Assign
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignPatient;
