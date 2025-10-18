import React, { useState, useEffect } from 'react';
import {
    FaUserMd,
    FaEdit,
    FaTrash,
    FaPlus,
    FaSpinner,
    FaCalendarAlt,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaBell,
    FaExclamationTriangle,
    FaUsers,
    FaChartLine,
    FaAmbulance,
} from 'react-icons/fa';
import { getAllDoctors } from '../../../../services/adminDoctor.service';

// Type definitions
interface Doctor {
    _id: string;
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization: string;
    phoneNumber?: string;
    address?: string;
    isAvailable: boolean;
}

interface Appointment {
    _id: string;
    patientName: string;
    patientAge: string;
    doctor?: Doctor;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    queueNumber: string;
    ambulanceRequested?: boolean;
}

interface Patient {
    name: string;
    age: string;
    lastVisit: string;
    totalAppointments: number;
    status?: string;
    doctor?: string;
}

interface DoctorFormData {
    title: string;
    name: string;
    email: string;
    specialization: string;
    phoneNumber: string;
    address: string;
    isAvailable: boolean;
}

interface PatientFormData {
    name: string;
    age: string;
}

interface EmergencyResponse {
    appointments: Appointment[];
}

const AdminDashboard: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [emergencyAppointments, setEmergencyAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [patientsLoading, setPatientsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [showNotifications, setShowNotifications] = useState<boolean>(true);

    const [isDoctorModalOpen, setIsDoctorModalOpen] = useState<boolean>(false);
    const [doctorFormData, setDoctorFormData] = useState<DoctorFormData>({
        title: 'Dr.',
        name: '',
        email: '',
        specialization: '',
        phoneNumber: '',
        address: '',
        isAvailable: true,
    });
    const [isEditingDoctor, setIsEditingDoctor] = useState<boolean>(false);
    const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
    const [doctorFormError, setDoctorFormError] = useState<string>('');

    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [appointmentStatus, setAppointmentStatus] = useState<string>('');

    const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientFormData, setPatientFormData] = useState<PatientFormData>({
        name: '',
        age: '',
    });

    const specializations: string[] = ['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Ophthalmology', 'Psychiatry', 'General Medicine', 'ENT', 'Pregnancy'];

    const transformDoctors = (rawDoctors: any[]): Doctor[] => {
        return rawDoctors.map((doc) => ({
            _id: doc._id,
            title: doc.firstName && doc.firstName.startsWith('Dr') ? 'Dr' : 'Mr/Ms', // or however you want to extract title
            firstName: doc.firstName || '',
            lastName: doc.lastName || '',
            email: doc.email,
            specialization: doc.specialization,
            phoneNumber: doc.phone,
            address: doc.address?.country ?? '',
            isAvailable: doc.isActive, // assuming 'isActive' means available
        }));
    };

    useEffect(() => {
        fetchDoctors();
        fetchAllAppointments();
        fetchEmergencyAppointments();
        const interval = setInterval(() => {
            fetchAllAppointments();
            fetchEmergencyAppointments();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (appointments.length > 0) {
            fetchPatients();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appointments]);

    const fetchDoctors = async (): Promise<void> => {
        setLoading(true);
        try {
            const response = await getAllDoctors();
            console.log('Raw doctors data:', response);
            const transformedDoctors = transformDoctors(response);
            setDoctors(transformedDoctors);
        } catch (err) {
            setError('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllAppointments = async (): Promise<void> => {
        try {
            const response = await fetch('http://localhost:3004/api/appointments/all');
            console.log('Raw appointments data:', response);
            if (!response.ok) throw new Error('Failed to fetch appointments');
            const data: Appointment[] = await response.json();
            console.log('Fetched appointments:', data);
            setAppointments(data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        }
    };

    const fetchEmergencyAppointments = async (): Promise<void> => {
        try {
            const response = await fetch('http://localhost:3004/api/appointments/emergency');
            if (!response.ok) return;
            const data: EmergencyResponse = await response.json();
            const active = data.appointments.filter((app) => app.status !== 'completed' && app.status !== 'cancelled');
            setEmergencyAppointments(active);
        } catch (err) {
            console.error('Error fetching emergency appointments:', err);
        }
    };

    const fetchPatients = async (): Promise<void> => {
        setPatientsLoading(true);
        try {
            const patientMap = new Map<string, Patient>();

            appointments.forEach((apt) => {
                if (apt.patientName && !patientMap.has(apt.patientName)) {
                    patientMap.set(apt.patientName, {
                        name: apt.patientName,
                        age: apt.patientAge,
                        lastVisit: apt.appointmentDate,
                        totalAppointments: 1,
                        status: apt.status,
                        doctor: apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}`.trim() : undefined,
                    });
                } else if (apt.patientName && patientMap.has(apt.patientName)) {
                    const patient = patientMap.get(apt.patientName)!;
                    patient.totalAppointments += 1;
                    if (new Date(apt.appointmentDate) > new Date(patient.lastVisit)) {
                        patient.lastVisit = apt.appointmentDate;
                        patient.status = apt.status;
                        patient.doctor = apt.doctor ? `${apt.doctor.firstName} ${apt.doctor.lastName}`.trim() : undefined;
                    }
                }
            });

            setPatients(Array.from(patientMap.values()));
        } catch (err) {
            console.error('Error fetching patients:', err);
        } finally {
            setPatientsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
            <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white py-16 px-4 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5"></div>
                <div className="container mx-auto relative z-10">
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white/15 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/20 shadow-md hover:bg-white/20 transition-all">
                            <FaUserMd className="inline text-xl mr-2 opacity-90" />
                            <span className="text-xl font-semibold">{doctors.length}</span>
                            <span className="text-sm ml-2 text-teal-50 font-light">Doctors</span>
                        </div>
                        <div className="bg-white/15 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/20 shadow-md hover:bg-white/20 transition-all">
                            <FaCalendarAlt className="inline text-xl mr-2 opacity-90" />
                            <span className="text-xl font-semibold">{appointments.length}</span>
                            <span className="text-sm ml-2 text-teal-50 font-light">Appointments</span>
                        </div>
                        <div className="bg-white/15 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/20 shadow-md hover:bg-white/20 transition-all">
                            <FaExclamationTriangle className="inline text-xl mr-2 opacity-90" />
                            <span className="text-xl font-semibold">{emergencyAppointments.length}</span>
                            <span className="text-sm ml-2 text-teal-50 font-light">Emergencies</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {showNotifications && emergencyAppointments.length > 0 && (
                    <div className="mb-8 bg-gradient-to-br from-red-500 via-rose-600 to-red-600 text-white rounded-3xl shadow-2xl p-8 border-2 border-red-400 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-900/20 animate-pulse-soft"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/30 p-4 rounded-2xl backdrop-blur-sm animate-bounce shadow-xl">
                                        <FaExclamationTriangle className="text-5xl drop-shadow-lg" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <FaBell className="text-3xl animate-bounce" />
                                            <h3 className="text-4xl font-black tracking-tight">EMERGENCY ALERTS</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-4 py-2 bg-white/30 backdrop-blur-md rounded-xl font-bold text-lg border border-white/40">
                                                {emergencyAppointments.length} Active {emergencyAppointments.length === 1 ? 'Case' : 'Cases'}
                                            </span>
                                            <span className="text-red-100 font-semibold">Immediate Attention Required</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className="text-white hover:bg-white/20 p-3 rounded-xl text-3xl font-bold transition-all backdrop-blur-sm bg-white/10"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {emergencyAppointments.map((apt) => (
                                    <div key={apt._id} className="bg-white/15 backdrop-blur-lg rounded-2xl p-5 border-2 border-white/30 hover:bg-white/25 transition-all shadow-xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="px-4 py-2 bg-white text-red-600 rounded-xl font-black text-lg shadow-lg">{apt.queueNumber}</span>
                                            {apt.ambulanceRequested && (
                                                <span className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md">
                                                    <FaAmbulance className="animate-pulse" /> Ambulance
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="text-2xl font-black text-white mb-1">{apt.patientName}</h4>
                                        <p className="text-red-100 text-sm mb-3">Age: {apt.patientAge}</p>

                                        <div className="space-y-2 text-sm">
                                            <p className="text-white/90">
                                                <span className="font-semibold">Doctor:</span> Dr. {`${apt.doctor?.firstName ?? ''} ${apt.doctor?.lastName ?? ''}`.trim()}
                                            </p>
                                            <p className="text-white/90">
                                                <span className="font-semibold">Time:</span> {apt.appointmentTime}
                                            </p>
                                            <p className="text-white/90">
                                                <span className="font-semibold">Reason:</span> {apt.reason}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-4 mb-8">
                    {['overview', 'doctors', 'appointments', 'patients'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-4 rounded-2xl font-semibold text-base transition-all shadow-md hover:shadow-lg ${
                                activeTab === tab ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white' : 'bg-white text-gray-600 hover:bg-teal-50'
                            }`}
                        >
                            {tab === 'overview' && <FaChartLine className="inline mr-2" />}
                            {tab === 'doctors' && <FaUserMd className="inline mr-2" />}
                            {tab === 'appointments' && <FaCalendarAlt className="inline mr-2" />}
                            {tab === 'patients' && <FaUsers className="inline mr-2" />}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-xl mb-6 shadow-lg animate-slide-in">
                        <div className="flex items-center">
                            <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                            <p className="text-green-800 font-semibold text-lg">{successMessage}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl mb-6 shadow-lg animate-slide-in">
                        <div className="flex items-center">
                            <FaTimesCircle className="text-red-500 text-2xl mr-3" />
                            <p className="text-red-800 font-semibold text-lg">{error}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
                            <FaUsers className="text-4xl mb-4 opacity-90" />
                            <h3 className="text-4xl font-bold mb-2">{appointments.filter((a) => new Date(a.appointmentDate) >= new Date()).length}</h3>
                            <p className="text-teal-50 text-base font-light">Upcoming Appointments</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
                            <FaCheckCircle className="text-4xl mb-4 opacity-90" />
                            <h3 className="text-4xl font-bold mb-2">{appointments.filter((a) => a.status === 'completed').length}</h3>
                            <p className="text-emerald-50 text-base font-light">Completed</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all">
                            <FaHourglassHalf className="text-4xl mb-4 opacity-90" />
                            <h3 className="text-4xl font-bold mb-2">{appointments.filter((a) => a.status === 'pending').length}</h3>
                            <p className="text-amber-50 text-base font-light">Pending</p>
                        </div>
                    </div>
                )}

                {activeTab === 'doctors' && (
                    <div className="bg-white shadow-lg rounded-3xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Doctor Management</h2>
                            <button
                                onClick={() => {
                                    setDoctorFormData({ title: 'Dr.', name: '', email: '', specialization: '', phoneNumber: '', address: '', isAvailable: true });
                                    setIsEditingDoctor(false);
                                    setIsDoctorModalOpen(true);
                                    setDoctorFormError('');
                                }}
                                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-3"
                            >
                                <FaPlus className="text-xl" /> Add New Doctor
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <FaSpinner className="animate-spin text-blue-600 text-6xl mx-auto mb-4" />
                                <p className="text-xl text-gray-600">Loading doctors...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {doctors.map((doctor) => (
                                    <div
                                        key={doctor._id}
                                        className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-teal-100 hover:border-teal-300"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                                                    <FaUserMd className="text-white text-3xl" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-800">
                                                        {doctor.title} {doctor.firstName} {doctor.lastName}
                                                    </h3>
                                                    <p className="text-teal-600 font-semibold text-base">{doctor.specialization}</p>
                                                </div>
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-xs font-black shadow-lg ${doctor.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {doctor.isAvailable ? '● AVAILABLE' : '● BUSY'}
                                            </span>
                                        </div>

                                        <div className="mb-6 space-y-2 text-sm text-gray-700">
                                            <p className="flex items-center gap-2">
                                                <span className="font-bold">📧 Email:</span> {doctor.email}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-bold">📞 Phone:</span> {doctor.phoneNumber || 'N/A'}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-bold">📍 Address:</span> {doctor.address || 'N/A'}
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setDoctorFormData({
                                                        title: doctor.title || 'Dr.',
                                                        name: `${doctor.firstName} ${doctor.lastName}`.trim(),
                                                        email: doctor.email,
                                                        specialization: doctor.specialization,
                                                        phoneNumber: doctor.phoneNumber || '',
                                                        address: doctor.address || '',
                                                        isAvailable: doctor.isAvailable,
                                                    });
                                                    setCurrentDoctorId(doctor._id);
                                                    setIsEditingDoctor(true);
                                                    setIsDoctorModalOpen(true);
                                                }}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm(`Delete Dr. ${doctor.firstName} ${doctor.lastName}?`)) {
                                                        try {
                                                            const response = await fetch(`http://localhost:3004/api/doctors/${doctor._id}`, { method: 'DELETE' });
                                                            if (!response.ok) throw new Error('Failed to delete doctor');
                                                            setDoctors(doctors.filter((d) => d._id !== doctor._id));
                                                            setSuccessMessage(`Dr. ${doctor.firstName} ${doctor.lastName} deleted successfully`);
                                                            setTimeout(() => setSuccessMessage(''), 3000);
                                                        } catch (err) {
                                                            setError('Failed to delete doctor');
                                                        }
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="bg-white shadow-lg rounded-3xl p-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-8">Appointment Management</h2>

                        <div className="mb-6 flex gap-4">
                            <div className="bg-gradient-to-r from-teal-100 to-cyan-100 px-6 py-3 rounded-xl">
                                <span className="font-semibold text-gray-700">Total: </span>
                                <span className="text-2xl font-bold text-teal-600">{appointments.length}</span>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-100 to-green-100 px-6 py-3 rounded-xl">
                                <span className="font-semibold text-gray-700">Upcoming: </span>
                                <span className="text-2xl font-bold text-emerald-600">{appointments.filter((a) => new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled').length}</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Queue #</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Patient</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Doctor</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Date</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Time</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Status</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {appointments
                                        .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
                                        .map((apt) => (
                                            <tr key={apt._id} className="hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all">
                                                <td className="px-4 py-4 text-sm font-mono font-bold text-gray-800">{apt.queueNumber}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-gray-800">{apt.patientName}</div>
                                                    <div className="text-xs text-gray-500">Age: {apt.patientAge}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-semibold text-gray-800"> {`${apt.doctor?.firstName ?? ''} ${apt.doctor?.lastName ?? ''}`.trim() || 'Unknown Doctor'}</div>
                                                    <div className="text-xs text-teal-600">{apt.doctor?.specialization}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-700">{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{apt.appointmentTime || 'N/A'}</td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                            apt.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : apt.status === 'confirmed'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : apt.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : apt.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {apt.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAppointment(apt);
                                                                setAppointmentStatus(apt.status);
                                                                setIsAppointmentModalOpen(true);
                                                            }}
                                                            className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all text-xs font-semibold"
                                                        >
                                                            <FaEdit className="inline mr-1" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Delete appointment ${apt.queueNumber}?`)) {
                                                                    try {
                                                                        const response = await fetch(`http://localhost:3004/api/appointments/${apt._id}`, { method: 'DELETE' });
                                                                        if (!response.ok) throw new Error('Failed to delete appointment');
                                                                        setAppointments(appointments.filter((a) => a._id !== apt._id));
                                                                        setSuccessMessage('Appointment deleted successfully');
                                                                        setTimeout(() => setSuccessMessage(''), 3000);
                                                                    } catch (err) {
                                                                        setError('Failed to delete appointment');
                                                                    }
                                                                }
                                                            }}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-bold"
                                                        >
                                                            <FaTrash className="inline mr-1" /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'patients' && (
                    <div className="bg-white shadow-lg rounded-3xl p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Patient Management</h2>
                            <div className="bg-gradient-to-r from-teal-100 to-cyan-100 px-6 py-3 rounded-xl">
                                <span className="font-semibold text-gray-700">Total Patients: </span>
                                <span className="text-2xl font-bold text-teal-600">{patients.length}</span>
                            </div>
                        </div>

                        {patientsLoading ? (
                            <div className="text-center py-20">
                                <FaSpinner className="animate-spin text-teal-600 text-6xl mx-auto mb-4" />
                                <p className="text-xl text-gray-600">Loading patients...</p>
                            </div>
                        ) : patients.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {patients.map((patient, index) => (
                                    <div key={index} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all border border-teal-100">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                                                    <FaUsers className="text-white text-2xl" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800">{patient.name}</h3>
                                                    <p className="text-sm text-gray-600">Age: {patient.age || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    patient.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : patient.status === 'confirmed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : patient.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {patient.status?.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="bg-white/60 rounded-xl p-3">
                                                <p className="text-xs text-gray-600 mb-1">Last Visit</p>
                                                <p className="text-sm font-semibold text-gray-800">{new Date(patient.lastVisit).toLocaleDateString()}</p>
                                            </div>

                                            <div className="bg-white/60 rounded-xl p-3">
                                                <p className="text-xs text-gray-600 mb-1">Last Doctor</p>
                                                <p className="text-sm font-semibold text-teal-700">Dr. {patient.doctor || 'N/A'}</p>
                                            </div>

                                            <div className="bg-white/60 rounded-xl p-3">
                                                <p className="text-xs text-gray-600 mb-1">Total Appointments</p>
                                                <p className="text-2xl font-bold text-teal-600">{patient.totalAppointments}</p>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-teal-200 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    setPatientFormData({ name: patient.name, age: patient.age });
                                                    setIsPatientModalOpen(true);
                                                }}
                                                className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center justify-center gap-2"
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm(`Delete all appointments for ${patient.name}?`)) {
                                                        try {
                                                            const patientAppointments = appointments.filter((a) => a.patientName === patient.name);
                                                            for (const apt of patientAppointments) {
                                                                await fetch(`http://localhost:3004/api/appointments/${apt._id}`, { method: 'DELETE' });
                                                            }
                                                            setAppointments(appointments.filter((a) => a.patientName !== patient.name));
                                                            setSuccessMessage(`Patient ${patient.name} and all appointments deleted successfully`);
                                                            setTimeout(() => setSuccessMessage(''), 3000);
                                                        } catch (err) {
                                                            setError('Failed to delete patient');
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-teal-50 rounded-2xl">
                                <FaUsers className="text-teal-300 text-6xl mx-auto mb-4" />
                                <p className="text-xl text-gray-600 font-semibold">No patients found</p>
                                <p className="text-gray-500 mt-2">Patients will appear here after appointments are booked</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isDoctorModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform animate-slide-up">
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-8 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{isEditingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h2>
                                    <p className="text-teal-50 mt-1 font-light">Fill in the doctor's information</p>
                                </div>
                                <button onClick={() => setIsDoctorModalOpen(false)} className="text-white hover:bg-white/20 p-3 rounded-xl text-3xl font-bold transition-all">
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {doctorFormError && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 animate-shake">
                                    <p className="text-red-800 font-semibold">{doctorFormError}</p>
                                </div>
                            )}

                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!doctorFormData.name.trim() || doctorFormData.name.length < 3) {
                                        setDoctorFormError('Name must be at least 3 characters');
                                        return;
                                    }
                                    if (!doctorFormData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                                        setDoctorFormError('Invalid email address');
                                        return;
                                    }
                                    if (!doctorFormData.specialization) {
                                        setDoctorFormError('Please select a specialization');
                                        return;
                                    }

                                    try {
                                        if (isEditingDoctor) {
                                            const response = await fetch(`http://localhost:3004/api/doctors/${currentDoctorId}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify(doctorFormData),
                                            });
                                            if (!response.ok) throw new Error('Failed to update doctor');
                                            const data: Doctor = await response.json();
                                            setDoctors(doctors.map((d) => (d._id === currentDoctorId ? data : d)));
                                            setSuccessMessage('Doctor updated successfully');
                                        } else {
                                            const response = await fetch('http://localhost:3004/api/doctors/create-direct', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ ...doctorFormData, password: 'default123' }),
                                            });
                                            if (!response.ok) throw new Error('Failed to create doctor');
                                            const data: Doctor = await response.json();
                                            setDoctors([...doctors, data]);
                                            setSuccessMessage('Doctor added successfully');
                                        }
                                        setIsDoctorModalOpen(false);
                                        setTimeout(() => setSuccessMessage(''), 3000);
                                    } catch (err) {
                                        setDoctorFormError('Failed to save doctor');
                                    }
                                }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-4 gap-4">
                                    <select
                                        value={doctorFormData.title}
                                        onChange={(e) => setDoctorFormData({ ...doctorFormData, title: e.target.value })}
                                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none font-semibold"
                                    >
                                        <option value="Dr.">Dr.</option>
                                        <option value="Mr.">Mr.</option>
                                        <option value="Mrs.">Mrs.</option>
                                        <option value="Miss">Miss</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={doctorFormData.name}
                                        onChange={(e) => setDoctorFormData({ ...doctorFormData, name: e.target.value })}
                                        placeholder="Full Name *"
                                        className="col-span-3 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <input
                                    type="email"
                                    value={doctorFormData.email}
                                    onChange={(e) => setDoctorFormData({ ...doctorFormData, email: e.target.value })}
                                    placeholder="Email Address *"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none"
                                    required
                                />

                                <select
                                    value={doctorFormData.specialization}
                                    onChange={(e) => setDoctorFormData({ ...doctorFormData, specialization: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none font-semibold"
                                    required
                                >
                                    <option value="">Select Specialization *</option>
                                    {specializations.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="text"
                                    value={doctorFormData.phoneNumber}
                                    onChange={(e) => setDoctorFormData({ ...doctorFormData, phoneNumber: e.target.value })}
                                    placeholder="Phone Number"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none"
                                />

                                <textarea
                                    value={doctorFormData.address}
                                    onChange={(e) => setDoctorFormData({ ...doctorFormData, address: e.target.value })}
                                    placeholder="Address"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none resize-none"
                                    rows={3}
                                ></textarea>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={doctorFormData.isAvailable}
                                        onChange={(e) => setDoctorFormData({ ...doctorFormData, isAvailable: e.target.checked })}
                                        className="w-5 h-5 text-teal-600 rounded"
                                    />
                                    <label className="font-semibold text-gray-700">Available for appointments</label>
                                </div>

                                <div className="flex justify-end gap-4 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsDoctorModalOpen(false)}
                                        className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                                        {isEditingDoctor ? 'Update Doctor' : 'Add Doctor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isPatientModalOpen && selectedPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full transform animate-slide-up">
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-8 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">Edit Patient Information</h2>
                                    <p className="text-teal-50 mt-1 font-light">Update patient details</p>
                                </div>
                                <button onClick={() => setIsPatientModalOpen(false)} className="text-white hover:bg-white/20 p-3 rounded-xl text-3xl font-bold transition-all">
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const patientAppointments = appointments.filter((a) => a.patientName === selectedPatient.name);
                                        for (const apt of patientAppointments) {
                                            await fetch(`http://localhost:3004/api/appointments/${apt._id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    patientName: patientFormData.name,
                                                    patientAge: patientFormData.age,
                                                }),
                                            });
                                        }
                                        setAppointments(
                                            appointments.map((a) => (a.patientName === selectedPatient.name ? { ...a, patientName: patientFormData.name, patientAge: patientFormData.age } : a))
                                        );
                                        setSuccessMessage('Patient information updated successfully');
                                        setIsPatientModalOpen(false);
                                        setTimeout(() => setSuccessMessage(''), 3000);
                                    } catch (err) {
                                        setError('Failed to update patient information');
                                    }
                                }}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Patient Name</label>
                                    <input
                                        type="text"
                                        value={patientFormData.name}
                                        onChange={(e) => setPatientFormData({ ...patientFormData, name: e.target.value })}
                                        placeholder="Full Name"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                                    <input
                                        type="number"
                                        value={patientFormData.age}
                                        onChange={(e) => setPatientFormData({ ...patientFormData, age: e.target.value })}
                                        placeholder="Age"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-teal-100 focus:border-teal-400 transition-all outline-none"
                                        required
                                    />
                                </div>

                                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg">
                                    <p className="text-sm text-teal-800">
                                        <strong>Note:</strong> This will update patient information across all {selectedPatient.totalAppointments} appointment(s).
                                    </p>
                                </div>

                                <div className="flex justify-end gap-4 pt-6 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsPatientModalOpen(false)}
                                        className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                                        Update Patient
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isAppointmentModalOpen && selectedAppointment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform animate-slide-up">
                        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-8 rounded-t-3xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">Edit Appointment</h2>
                                    <p className="text-teal-50 mt-1 font-light">{selectedAppointment.queueNumber}</p>
                                </div>
                                <button onClick={() => setIsAppointmentModalOpen(false)} className="text-white hover:bg-white/20 p-3 rounded-xl text-3xl font-bold transition-all">
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-4 mb-6">
                                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-600">Patient</p>
                                    <p className="text-xl font-bold text-gray-800">{selectedAppointment.patientName}</p>
                                </div>
                                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-600">Doctor</p>
                                    <p className="text-xl font-bold text-gray-800">Dr. {`${selectedAppointment.doctor?.firstName ?? ''} ${selectedAppointment.doctor?.lastName ?? ''}`.trim()}</p>
                                </div>
                                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-600">Reason</p>
                                    <p className="text-gray-800">{selectedAppointment.reason}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-3">Update Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setAppointmentStatus(status)}
                                            className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                                                appointmentStatus === status ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-teal-50'
                                            }`}
                                        >
                                            {status.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <button onClick={() => setIsAppointmentModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(`http://localhost:3004/api/appointments/${selectedAppointment._id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: appointmentStatus }),
                                            });
                                            if (!response.ok) throw new Error('Failed to update appointment');
                                            setAppointments(appointments.map((a) => (a._id === selectedAppointment._id ? { ...a, status: appointmentStatus as Appointment['status'] } : a)));
                                            setSuccessMessage('Appointment updated successfully');
                                            setIsAppointmentModalOpen(false);
                                            setTimeout(() => setSuccessMessage(''), 3000);
                                        } catch (err) {
                                            setError('Failed to update appointment');
                                        }
                                    }}
                                    className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.95; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-in { animation: slide-in 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.4s ease-out; }
        .animate-shake { animation: shake 0.5s ease-out; }
      `}</style>
        </div>
    );
};

export default AdminDashboard;
