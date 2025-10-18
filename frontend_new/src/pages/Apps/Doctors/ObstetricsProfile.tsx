import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obstetricsAPI, masterPatientsAPI } from '../../../services/healthlogs.service';

const ObstetricsProfile = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [master, setMaster] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
        name: '',
        age: '',
        gender: 'female',
        phone: '',
        email: '',
        gravida: '', // e.g., 2
        parity: '', // e.g., 1
        dueDate: '',
        pregnancyNumber: 1,
        doctor: '',
        hospital: '',
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                setLoading(true);
                const res = await obstetricsAPI.getPatientById(id);
                setPatient(res.data.data);
                if (res.data?.data?.patientId) {
                    try {
                        const m = await masterPatientsAPI.getByPatientId(res.data.data.patientId);
                        setMaster(m.data.data);
                    } catch (_) {}
                }
                setError(null);
            } catch (err) {
                setError('Failed to load patient');
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [id]);

    useEffect(() => {
        if (patient) {
            setFormData({
                patientId: patient.patientId || '',
                name: patient.name || '',
                age: patient.age || '',
                gender: patient.gender || 'female',
                phone: patient.phone || '',
                email: patient.email || '',
                gravida: patient.gravida || '',
                parity: patient.parity || '',
                dueDate: patient.dueDate ? new Date(patient.dueDate).toISOString().split('T')[0] : '',
                pregnancyNumber: patient.pregnancyNumber || 1,
                doctor: patient.doctor || '',
                hospital: patient.hospital || '',
            });
        }
    }, [patient]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.age) payload.age = parseInt(payload.age, 10);
            if (payload.pregnancyNumber) payload.pregnancyNumber = parseInt(payload.pregnancyNumber, 10);
            // Store G/P separately if backend supports; otherwise keep as-is
            const res = await obstetricsAPI.updatePatient(id, payload);
            setPatient(res.data.data);
            setShowEdit(false);
        } catch (err) {
            setError('Failed to update patient');
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString();

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );

    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>;

    if (!patient) return null;

    return (
        <div className="space-y-6">
            {master && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm text-purple-700">Master Profile</div>
                            <div className="text-purple-900 font-semibold">
                                {master.fullName} • ID: {master.patientId}
                            </div>
                            <div className="text-purple-800 text-sm">
                                Age {master.age} • {master.gender} • {master.contact?.phone || '-'} {master.contact?.email ? `• ${master.contact.email}` : ''}
                            </div>
                        </div>
                        <div className="text-xs text-purple-700">Category: {master.category}</div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Obstetrics Patient Profile</h1>
                    <p className="text-gray-600">Patient ID: {patient.patientId}</p>
                </div>
                <div className="space-x-2">
                    <Link to={`/obstetrics/${patient._id}/logs`} className="text-primary-600 hover:text-primary-800">
                        View Logs
                    </Link>
                    <button onClick={() => setShowEdit(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700">
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="text-sm text-gray-500">Full Name</div>
                    <div className="text-gray-900 font-medium">{patient.name}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Age / Gender</div>
                    <div className="text-gray-900 font-medium">
                        {patient.age} / {patient.gender || 'female'}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Contact</div>
                    <div className="text-gray-900 font-medium">
                        {patient.phone || '-'} {patient.email ? `• ${patient.email}` : ''}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Gravida / Parity</div>
                    <div className="text-gray-900 font-medium">
                        {patient.gravida ?? '-'}/{patient.parity ?? '-'}
                    </div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">EDD</div>
                    <div className="text-gray-900 font-medium">{patient.dueDate ? formatDate(patient.dueDate) : '-'}</div>
                </div>
                <div>
                    <div className="text-sm text-gray-500">Doctor / Hospital</div>
                    <div className="text-gray-900 font-medium">
                        {patient.doctor || '-'} {patient.hospital ? `• ${patient.hospital}` : ''}
                    </div>
                </div>
            </div>

            {showEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Obstetrics Patient Profile</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                                    <input type="text" name="patientId" value={formData.patientId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Age</label>
                                    <input type="number" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Gravida</label>
                                    <input type="number" name="gravida" value={formData.gravida} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Parity</label>
                                    <input type="number" name="parity" value={formData.parity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">EDD</label>
                                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Pregnancy #</label>
                                    <input
                                        type="number"
                                        name="pregnancyNumber"
                                        value={formData.pregnancyNumber}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Doctor</label>
                                    <input type="text" name="doctor" value={formData.doctor} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hospital</label>
                                    <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 bg-gray-100 rounded-md">
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObstetricsProfile;
