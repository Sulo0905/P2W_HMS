import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entAPI, masterPatientsAPI } from '../../../services/healthlogs.service';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const EntProfile = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [master, setMaster] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [analytics, setAnalytics] = useState({
        painTrend: [],
        recoveryProgress: [],
        medicationHistory: [],
        healingMilestones: {},
    });
    const [formData, setFormData] = useState({
        patientId: '',
        name: '',
        age: '',
        gender: 'male',
        phone: '',
        email: '',
        surgeryDate: '',
        surgeryType: '',
        doctor: '',
        hospital: '',
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                setLoading(true);
                const res = await entAPI.getPatientById(id as string);
                setPatient(res.data.data);

                // Generate analytics from patient logs
                if (res.data.data && res.data.data.logs) {
                    const analyticsData = generateAnalytics(res.data.data.logs);
                    setAnalytics(analyticsData);
                }

                // Fetch master by patientId
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
                gender: patient.gender || 'male',
                phone: patient.phone || '',
                email: patient.email || '',
                surgeryDate: patient.surgeryDate ? new Date(patient.surgeryDate).toISOString().split('T')[0] : '',
                surgeryType: patient.surgeryType || '',
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
            const res = await entAPI.updatePatient(id, payload);
            setPatient(res.data.data);
            setShowEdit(false);
        } catch (err) {
            setError('Failed to update patient');
        }
    };

    const formatDate = (d) => new Date(d).toLocaleDateString();

    const generateAnalytics = (logs) => {
        const painTrend = [];
        const recoveryProgress = [];
        const medicationHistory = [];
        const healingMilestones = {
            swallowing: false,
            breathing: false,
            feverFree: false,
        };

        logs.forEach((log) => {
            const logDate = new Date(log.loggedAt).toLocaleDateString();

            // Pain level trend
            if (log.logType === 'pain_level' && log.painLevel !== undefined) {
                painTrend.push({
                    date: logDate,
                    painLevel: parseInt(log.painLevel),
                    time: new Date(log.loggedAt).toLocaleTimeString(),
                });
            }

            // Recovery progress
            if (log.logType === 'healing_progress') {
                recoveryProgress.push({
                    date: logDate,
                    condition: log.healingProgress?.woundCondition || 'unknown',
                    notes: log.healingProgress?.notes || '',
                });

                // Update milestones
                if (log.milestones) {
                    if (log.milestones.swallowing) healingMilestones.swallowing = true;
                    if (log.milestones.breathing) healingMilestones.breathing = true;
                    if (log.milestones.feverFree) healingMilestones.feverFree = true;
                }
            }

            // Medication history
            if (log.logType === 'medication' && log.medication) {
                medicationHistory.push({
                    date: logDate,
                    name: log.medication.name || 'Unknown',
                    dosage: log.medication.dosage || '',
                    frequency: log.medication.frequency || '',
                    sideEffects: log.medication.sideEffects || [],
                });
            }
        });

        return {
            painTrend: painTrend.sort((a, b) => new Date(a.date) - new Date(b.date)),
            recoveryProgress,
            medicationHistory,
            healingMilestones,
        };
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );

    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>;

    if (!patient) return null;

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Master Profile Banner */}
                    {master && (
                        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">{master.fullName?.charAt(0) || 'P'}</div>
                                    <div>
                                        <div className="text-sm text-blue-700 font-medium">Master Patient Profile</div>
                                        <div className="text-blue-900 font-bold text-lg">{master.fullName}</div>
                                        <div className="text-blue-800 text-sm">
                                            ID: {master.patientId} • Age {master.age} • {master.gender} • {master.contact?.phone || 'No phone'}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="info">{master.category}</Badge>
                            </div>
                        </Card>
                    )}

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900">ENT Patient Profile</h1>
                            <p className="mt-2 text-neutral-600">Patient ID: {patient.patientId}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge variant="success" size="sm">
                                    Active
                                </Badge>
                                <Badge variant="info" size="sm">
                                    ENT Department
                                </Badge>
                                {patient.logs && patient.logs.length > 0 && (
                                    <Badge variant="warning" size="sm">
                                        {patient.logs.length} Health Logs
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <Link to={`/ent/${patient._id}/logs`}>
                                <Button variant="secondary" size="sm">
                                    View All Logs
                                </Button>
                            </Link>
                            <Link to={`/ent/${patient._id}/timeline`}>
                                <Button variant="secondary" size="sm">
                                    Timeline
                                </Button>
                            </Link>
                            <Button onClick={() => setShowEdit(true)} size="sm">
                                Edit Profile
                            </Button>
                        </div>
                    </div>

                    {/* Patient Information Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Basic Information */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Full Name</div>
                                    <div className="text-neutral-900 font-medium">{patient.name || 'Not specified'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-neutral-500">Age</div>
                                        <div className="text-neutral-900 font-medium">{patient.age || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-neutral-500">Gender</div>
                                        <div className="text-neutral-900 font-medium capitalize">{patient.gender || 'N/A'}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Phone</div>
                                    <div className="text-neutral-900 font-medium">{patient.phone || 'Not provided'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Email</div>
                                    <div className="text-neutral-900 font-medium">{patient.email || 'Not provided'}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Medical Information */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Medical Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Surgery Type</div>
                                    <div className="text-neutral-900 font-medium">{patient.surgeryType || 'Not specified'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Surgery Date</div>
                                    <div className="text-neutral-900 font-medium">{patient.surgeryDate ? formatDate(patient.surgeryDate) : 'Not scheduled'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Attending Doctor</div>
                                    <div className="text-neutral-900 font-medium">{patient.doctor || 'Not assigned'}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-neutral-500">Hospital</div>
                                    <div className="text-neutral-900 font-medium">{patient.hospital || 'Not specified'}</div>
                                </div>
                            </div>
                        </Card>

                        {/* Recovery Milestones */}
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recovery Milestones</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-700">Swallowing Recovery</span>
                                    <div className={`w-3 h-3 rounded-full ${analytics.healingMilestones.swallowing ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-700">Breathing Improvement</span>
                                    <div className={`w-3 h-3 rounded-full ${analytics.healingMilestones.breathing ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-700">Fever-Free Status</span>
                                    <div className={`w-3 h-3 rounded-full ${analytics.healingMilestones.feverFree ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-neutral-200">
                                    <div className="text-sm text-neutral-500">Overall Progress</div>
                                    <div className="mt-2 bg-neutral-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(Object.values(analytics.healingMilestones).filter(Boolean).length / 3) * 100}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-neutral-500 mt-1">{Object.values(analytics.healingMilestones).filter(Boolean).length} of 3 milestones achieved</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Analytics Charts */}
                    {analytics.painTrend.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pain Level Trend</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.painTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="painLevel" stroke="#EF4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    {patient.logs && patient.logs.length > 0 && (
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Health Logs</h3>
                            <div className="space-y-3">
                                {patient.logs
                                    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
                                    .slice(0, 5)
                                    .map((log, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`p-2 rounded-lg ${
                                                        log.logType === 'pain_level'
                                                            ? 'bg-red-100 text-red-600'
                                                            : log.logType === 'medication'
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : log.logType === 'healing_progress'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-purple-100 text-purple-600'
                                                    }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-neutral-900 capitalize">{log.logType.replace('_', ' ')}</div>
                                                    <div className="text-sm text-neutral-500">
                                                        {formatDate(log.loggedAt)}
                                                        {log.loggedBy && ` • ${log.loggedBy}`}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" size="sm">
                                                {log.logType === 'pain_level' && log.painLevel
                                                    ? `Level ${log.painLevel}`
                                                    : log.logType === 'medication' && log.medication?.name
                                                    ? log.medication.name
                                                    : 'Logged'}
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {showEdit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit ENT Patient Profile</h3>
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
                                        <option value="male">Male</option>
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
                                    <label className="block text-sm font-medium text-gray-700">Surgery Date</label>
                                    <input
                                        type="date"
                                        name="surgeryDate"
                                        value={formData.surgeryDate}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Surgery Type</label>
                                    <select name="surgeryType" value={formData.surgeryType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                                        <option value="">Select surgery type</option>
                                        <option value="Tonsillectomy">Tonsillectomy</option>
                                        <option value="Adenoidectomy">Adenoidectomy</option>
                                        <option value="Septoplasty">Septoplasty</option>
                                        <option value="Functional Endoscopic Sinus Surgery">Functional Endoscopic Sinus Surgery</option>
                                        <option value="Myringotomy with Tube Insertion">Myringotomy with Tube Insertion</option>
                                    </select>
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

export default EntProfile;
