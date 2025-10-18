import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { masterPatientsAPI } from '../../../services/healthlogs.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const RegisterPatient = () => {
    const [form, setForm] = useState({
        patientId: '',
        fullName: '',
        age: '',
        gender: '',
        address: '',
        phone: '',
        email: '',
        category: '',
        entInfo: { surgeryType: '', surgeryDate: '' },
        obstetricsInfo: { bornType: '', estimatedDueDate: '' },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('entInfo.')) {
            const key = name.replace('entInfo.', '');
            setForm((prev) => ({ ...prev, entInfo: { ...prev.entInfo, [key]: value } }));
        } else if (name.startsWith('obstetricsInfo.')) {
            const key = name.replace('obstetricsInfo.', '');
            setForm((prev) => ({ ...prev, obstetricsInfo: { ...prev.obstetricsInfo, [key]: value } }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                // Only include patientId if it's provided and not empty
                ...(form.patientId.trim() && { patientId: form.patientId.trim() }),
                fullName: form.fullName.trim(),
                age: Number(form.age),
                // address moved to top-level (replacing gender)
                address: form.address,
                // add gender only for ENT
                ...(form.category === 'ENT' && form.gender ? { gender: form.gender } : {}),
                contact: {
                    phone: form.phone.trim(),
                    email: form.email.trim(),
                },
                category: form.category,
                entInfo:
                    form.category === 'ENT'
                        ? {
                              surgeryType: form.entInfo.surgeryType || undefined,
                              surgeryDate: form.entInfo.surgeryDate ? new Date(form.entInfo.surgeryDate).toISOString() : undefined,
                          }
                        : undefined,
                obstetricsInfo:
                    form.category === 'Obstetrics'
                        ? {
                              bornType: form.obstetricsInfo.bornType || undefined,
                              estimatedDueDate: form.obstetricsInfo.estimatedDueDate ? new Date(form.obstetricsInfo.estimatedDueDate).toISOString() : undefined,
                          }
                        : undefined,
            };
            const res = await masterPatientsAPI.register(payload);
            setSuccess(`Registered successfully. PatientID: ${res.data.data.patientId}. Thank you for registering! A doctor will review your information and contact you if needed.`);
            setForm({
                patientId: '',
                fullName: '',
                age: '',
                gender: '',
                address: '',
                phone: '',
                email: '',
                category: '',
                entInfo: { surgeryType: '', surgeryDate: '' },
                obstetricsInfo: { bornType: '', estimatedDueDate: '' },
            });
            // Don't navigate anywhere - patients stay on registration page
        } catch (err) {
            const serverMsg = err?.response?.data?.message;
            const status = err?.response?.status;
            const msg = serverMsg || (status ? `Registration failed (HTTP ${status})` : err?.message || 'Registration failed');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <div className="text-center">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white grid place-items-center font-bold shadow-sm mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Log & Progress</h1>
                        <p className="text-gray-600">Patient Health Management System</p>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Create Health Log</h1>
                        <p className="text-sm text-neutral-600">Register new patients for otolaryngology or maternal care and initiate comprehensive health monitoring.</p>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Patients Type */}
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Patients Type</label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="" disabled>
                                        Choose Patients Type
                                    </option>
                                    <option value="ENT">ENT</option>
                                    <option value="Obstetrics">Obstetrics</option>
                                </select>
                            </div>

                            {/* Identity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">
                                        Patient ID <span className="text-xs text-neutral-500">(Optional - Auto-generated if empty)</span>
                                    </label>
                                    <input
                                        name="patientId"
                                        value={form.patientId}
                                        onChange={handleChange}
                                        placeholder="Leave empty for auto-generation"
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    <div className="mt-1 text-xs text-neutral-500">If left empty, a unique ID will be automatically generated (e.g., ENT123456, OBS789012)</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name</label>
                                    <input
                                        name="fullName"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        value={form.age}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Address</label>
                                    <input
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Phone (private)</label>
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Email (private)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            {/* ENT Fields */}
                            {form.category === 'ENT' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-800">ENT Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-1">Gender</label>
                                            <select
                                                name="gender"
                                                value={form.gender}
                                                onChange={handleChange}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-1">ENT Surgery Type</label>
                                            <select
                                                name="entInfo.surgeryType"
                                                value={form.entInfo.surgeryType}
                                                onChange={handleChange}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Select a surgery type</option>
                                                <option value="Tonsillectomy">Tonsillectomy</option>
                                                <option value="Adenoidectomy">Adenoidectomy</option>
                                                <option value="Septoplasty">Septoplasty</option>
                                                <option value="FESS">FESS</option>
                                                <option value="Myringotomy">Myringotomy</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-1">ENT Surgery Date</label>
                                            <input
                                                type="date"
                                                name="entInfo.surgeryDate"
                                                value={form.entInfo.surgeryDate}
                                                onChange={handleChange}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Obstetrics Fields */}
                            {form.category === 'Obstetrics' && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-neutral-800">Obstetrics Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-1">Born Type</label>
                                            <select
                                                name="obstetricsInfo.bornType"
                                                value={form.obstetricsInfo.bornType}
                                                onChange={handleChange}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="">Choose Born Type</option>
                                                <option value="Normal Delivery">Normal Delivery</option>
                                                <option value="C-section">C-section</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-1">Estimated Due Date</label>
                                            <input
                                                type="date"
                                                name="obstetricsInfo.estimatedDueDate"
                                                value={form.obstetricsInfo.estimatedDueDate}
                                                onChange={handleChange}
                                                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button disabled={loading} type="submit" variant="primary">
                                    {loading ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RegisterPatient;
