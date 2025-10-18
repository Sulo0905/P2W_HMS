import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaAmbulance, FaSpinner, FaCheckCircle, FaClock, FaUserMd, FaExclamationTriangle, FaTruck, FaMapMarkerAlt, FaPhone, FaHeartbeat, FaStar, FaUsers, FaBolt } from 'react-icons/fa';
import { getAllDoctors } from '../../../services/adminDoctor.service';

// Type definitions
interface Doctor {
    _id: string;
    name: string;
    specialization: string;
    currentLoad: number;
    availability: 'available' | 'busy' | 'unavailable';
    phoneNumber?: string;
}

interface Ambulance {
    ambulanceNumber: string;
    status: string;
    pickupLocation: string;
    estimatedArrival: string;
    emergencyHotline: string;
}

interface AppointmentDetails {
    queueNumber: string;
    estimatedTime: string;
    doctor: Doctor;
    ambulance?: Ambulance;
}

interface FormData {
    patientName: string;
    patientAge: string;
    reason: string;
    specialization: string;
    ambulanceRequested: boolean;
    pickupLocation: string;
}

interface Specialization {
    value: string;
    label: string;
    icon: string;
}

const EmergencyAppointment: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>({
        patientName: '',
        patientAge: '',
        reason: '',
        specialization: 'any',
        ambulanceRequested: false,
        pickupLocation: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
    const [error, setError] = useState<string>('');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);

    const specializations: Specialization[] = [
        { value: 'any', label: '⚡ Any Available Doctor (Fastest)', icon: '🏥' },
        { value: 'General Physician', label: 'General Physician', icon: '👨‍⚕️' },
        { value: 'Cardiologist', label: 'Cardiologist', icon: '❤️' },
        { value: 'Neurologist', label: 'Neurologist', icon: '🧠' },
        { value: 'Orthopedic', label: 'Orthopedic', icon: '🦴' },
        { value: 'Pediatrician', label: 'Pediatrician', icon: '👶' },
    ];

    // Fetch available doctors
    useEffect(() => {
        const fetchAvailableDoctors = async (): Promise<void> => {
            try {
                setLoadingDoctors(true);
                const response = await getAllDoctors();
                if (response.ok) {
                    const data = await response.json();
                    setAvailableDoctors(data.doctors || []);
                }
            } catch (err) {
                console.error('Error fetching doctors:', err);
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchAvailableDoctors();
    }, [formData.specialization]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({
                ...formData,
                [name]: checked,
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        try {
            setLoading(true);
            setError('');

            const response = await fetch('http://localhost:3004/api/appointments/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    patient: '659631b7bace152d00f8b6a0',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create emergency appointment');
            }

            const data: AppointmentDetails = await response.json();
            setAppointmentDetails(data);
            setSuccess(true);

            const estimatedTime = new Date(data.estimatedTime);
            const now = new Date();
            const minutesUntil = Math.round((estimatedTime.getTime() - now.getTime()) / 60000);
            setCountdown(minutesUntil);

            setTimeout(() => {
                navigate('/patient/view-appointment');
            }, 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create emergency appointment');
        } finally {
            setLoading(false);
        }
    };

    if (success && appointmentDetails) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 py-12 px-4">
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="inline-block p-6 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-6 shadow-2xl animate-bounce">
                            <FaCheckCircle className="text-7xl text-red-600" />
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">Emergency Appointment Confirmed!</h1>
                        <p className="text-xl text-gray-600 font-medium">Your emergency request has been successfully processed</p>
                    </div>

                    {/* Main Details Card */}
                    <div className="glass-effect rounded-3xl shadow-2xl p-8 mb-6 border-2 border-red-200">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border-2 border-red-200">
                                <p className="text-sm text-red-600 font-semibold mb-2 uppercase tracking-wide">Queue Number</p>
                                <p className="text-4xl font-bold text-red-700">{appointmentDetails.queueNumber}</p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border-2 border-red-200">
                                <p className="text-sm text-red-600 font-semibold mb-2 uppercase tracking-wide">Estimated Time</p>
                                <p className="text-3xl font-bold text-gray-800 flex items-center">
                                    <FaClock className="mr-3 text-red-500" />
                                    {countdown} minutes
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border-2 border-red-200">
                                <p className="text-sm text-red-600 font-semibold mb-2 uppercase tracking-wide">Doctor Assigned</p>
                                <p className="text-2xl font-bold text-gray-800 flex items-center">
                                    <FaUserMd className="mr-3 text-red-500 text-3xl" />
                                    {appointmentDetails.doctor.name}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border-2 border-red-200">
                                <p className="text-sm text-red-600 font-semibold mb-2 uppercase tracking-wide">Specialization</p>
                                <p className="text-2xl font-bold text-gray-800 flex items-center">
                                    <FaHeartbeat className="mr-3 text-red-500" />
                                    {appointmentDetails.doctor.specialization}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ambulance Details */}
                    {appointmentDetails.ambulance && (
                        <div className="glass-effect rounded-3xl shadow-2xl p-8 mb-6 border-2 border-red-300 bg-gradient-to-br from-red-50 to-white">
                            <h3 className="font-bold text-red-700 mb-6 flex items-center justify-center text-3xl">
                                <FaTruck className="mr-3 text-4xl" />
                                🚑 Ambulance Dispatched
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-lg">
                                    <p className="text-sm text-red-600 font-semibold mb-2">Ambulance Number</p>
                                    <p className="text-2xl font-bold text-red-800">{appointmentDetails.ambulance.ambulanceNumber}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-lg">
                                    <p className="text-sm text-red-600 font-semibold mb-2">Status</p>
                                    <p className="text-2xl font-bold text-red-800 capitalize">{appointmentDetails.ambulance.status}</p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-lg">
                                    <p className="text-sm text-red-600 font-semibold mb-2">Pickup Location</p>
                                    <p className="text-lg font-bold text-red-800 flex items-center">
                                        <FaMapMarkerAlt className="mr-2 text-xl" />
                                        {appointmentDetails.ambulance.pickupLocation}
                                    </p>
                                </div>
                                <div className="bg-white p-5 rounded-xl border-2 border-red-200 shadow-lg">
                                    <p className="text-sm text-red-600 font-semibold mb-2">Estimated Arrival</p>
                                    <p className="text-lg font-bold text-red-800 flex items-center">
                                        <FaClock className="mr-2" />
                                        {appointmentDetails.ambulance.estimatedArrival}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-5 shadow-xl">
                                <p className="text-white font-bold text-xl flex items-center justify-center">
                                    <FaPhone className="mr-3 text-2xl animate-pulse" />
                                    Emergency Hotline: {appointmentDetails.ambulance.emergencyHotline}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="glass-effect rounded-3xl shadow-2xl p-8 border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white">
                        <h3 className="font-bold text-yellow-800 mb-6 flex items-center justify-center text-2xl">
                            <FaExclamationTriangle className="mr-3 text-3xl" />
                            Important Instructions
                        </h3>
                        <ul className="space-y-4 text-yellow-900">
                            {appointmentDetails.ambulance ? (
                                <>
                                    <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                        <span className="text-yellow-600 font-bold mr-3 text-xl">1.</span>
                                        <span className="font-medium text-lg">
                                            Stay at pickup location: <strong>{appointmentDetails.ambulance.pickupLocation}</strong>
                                        </span>
                                    </li>
                                    <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                        <span className="text-yellow-600 font-bold mr-3 text-xl">2.</span>
                                        <span className="font-medium text-lg">
                                            Ambulance will arrive in <strong>{appointmentDetails.ambulance.estimatedArrival}</strong>
                                        </span>
                                    </li>
                                    <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                        <span className="text-yellow-600 font-bold mr-3 text-xl">3.</span>
                                        <span className="font-medium text-lg">Keep emergency contact ready</span>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                        <span className="text-yellow-600 font-bold mr-3 text-xl">1.</span>
                                        <span className="font-medium text-lg">Please arrive at the hospital immediately</span>
                                    </li>
                                    <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                        <span className="text-yellow-600 font-bold mr-3 text-xl">2.</span>
                                        <span className="font-medium text-lg">Show your queue number at the reception</span>
                                    </li>
                                </>
                            )}
                            <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                <span className="text-yellow-600 font-bold mr-3 text-xl">•</span>
                                <span className="font-medium text-lg">
                                    Your appointment is prioritized as <strong className="text-red-600">EMERGENCY</strong>
                                </span>
                            </li>
                            <li className="flex items-start bg-white p-4 rounded-xl shadow-md">
                                <span className="text-yellow-600 font-bold mr-3 text-xl">•</span>
                                <span className="font-medium text-lg">
                                    Contact: <strong>{appointmentDetails.doctor.phoneNumber || 'Hospital Reception'}</strong>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-center text-gray-500 text-lg mt-8 font-medium">Redirecting to your appointments in 5 seconds...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 animate-fadeIn">
                    <div className="inline-block p-8 bg-gradient-to-br from-red-500 to-red-700 rounded-full mb-6 shadow-2xl animate-pulse-soft">
                        <FaAmbulance className="text-8xl text-white" />
                    </div>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-4">🚨 Emergency Appointment</h1>
                    <p className="text-2xl text-gray-600 font-medium">Quick doctor connect for urgent medical needs</p>
                </div>

                {/* Alert Banner */}
                <div className="glass-effect rounded-3xl p-8 mb-8 border-2 border-red-300 shadow-2xl animate-slideIn">
                    <div className="flex items-start">
                        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-2xl mr-6">
                            <FaBolt className="text-white text-5xl" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-800 text-2xl mb-4">Emergency Service Features</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center text-red-700 font-medium text-lg">
                                    <FaCheckCircle className="mr-3 text-red-500 text-xl" />
                                    Immediate doctor assignment
                                </div>
                                <div className="flex items-center text-red-700 font-medium text-lg">
                                    <FaCheckCircle className="mr-3 text-red-500 text-xl" />
                                    Priority queue placement
                                </div>
                                <div className="flex items-center text-red-700 font-medium text-lg">
                                    <FaCheckCircle className="mr-3 text-red-500 text-xl" />
                                    Wait time: 15-30 minutes
                                </div>
                                <div className="flex items-center text-red-700 font-medium text-lg">
                                    <FaCheckCircle className="mr-3 text-red-500 text-xl" />
                                    Auto-confirmed appointment
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="glass-effect border-2 border-red-300 text-red-800 p-6 rounded-3xl mb-8 shadow-xl bg-gradient-to-br from-red-50 to-white">
                        <div className="flex items-center">
                            <FaExclamationTriangle className="text-3xl mr-4" />
                            <span className="text-lg font-semibold">{error}</span>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2">
                        <div className="glass-effect rounded-3xl shadow-2xl p-8 border-2 border-red-200">
                            <h2 className="text-3xl font-bold text-red-800 mb-8 flex items-center">
                                <FaUserMd className="mr-3 text-4xl text-red-600" />
                                Patient Information
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-800 font-bold mb-3 text-lg">
                                        Patient Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 border-2 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none text-lg font-medium transition-all"
                                        required
                                        placeholder="Enter patient name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-800 font-bold mb-3 text-lg">
                                        Age <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="patientAge"
                                        value={formData.patientAge}
                                        onChange={handleChange}
                                        min="1"
                                        max="120"
                                        className="w-full px-6 py-4 border-2 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none text-lg font-medium transition-all"
                                        required
                                        placeholder="Enter age"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-800 font-bold mb-3 text-lg">
                                        Emergency Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-6 py-4 border-2 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none text-lg font-medium transition-all resize-none"
                                        required
                                        placeholder="Briefly describe the emergency (e.g., severe chest pain, high fever, injury)"
                                    ></textarea>
                                    <p className="text-sm text-red-600 mt-3 font-medium flex items-center">
                                        <FaExclamationTriangle className="mr-2" />
                                        Be specific about symptoms for faster doctor assignment
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-gray-800 font-bold mb-3 text-lg">Preferred Specialization (Optional)</label>
                                    <select
                                        name="specialization"
                                        value={formData.specialization}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 border-2 border-red-200 rounded-2xl focus:ring-4 focus:ring-red-200 focus:border-red-500 outline-none text-lg font-medium cursor-pointer transition-all bg-white"
                                    >
                                        {specializations.map((spec) => (
                                            <option key={spec.value} value={spec.value}>
                                                {spec.icon} {spec.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-red-600 mt-3 font-medium flex items-center">
                                        <FaBolt className="mr-2" />
                                        Select "Any Available Doctor" for fastest response
                                    </p>
                                </div>

                                {/* Ambulance Request */}
                                <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            name="ambulanceRequested"
                                            checked={formData.ambulanceRequested}
                                            onChange={handleChange}
                                            className="mt-1 w-6 h-6 text-red-600 cursor-pointer rounded"
                                            id="ambulanceCheckbox"
                                        />
                                        <label htmlFor="ambulanceCheckbox" className="ml-4 cursor-pointer flex-1">
                                            <div className="flex items-center mb-3">
                                                <FaTruck className="text-red-600 text-2xl mr-3" />
                                                <span className="font-bold text-gray-800 text-xl">Request Ambulance Service</span>
                                            </div>
                                            <p className="text-gray-600 font-medium">Check this if you need an ambulance to pick you up and transport you to the hospital</p>
                                        </label>
                                    </div>

                                    {formData.ambulanceRequested && (
                                        <div className="mt-6 animate-fadeIn">
                                            <label className="block text-gray-800 font-bold mb-3 text-lg">
                                                Pickup Location <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FaMapMarkerAlt className="absolute left-5 top-5 text-red-600 text-xl" />
                                                <input
                                                    type="text"
                                                    name="pickupLocation"
                                                    value={formData.pickupLocation}
                                                    onChange={handleChange}
                                                    className="w-full pl-14 pr-6 py-4 border-2 border-red-300 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none text-lg font-medium transition-all"
                                                    required={formData.ambulanceRequested}
                                                    placeholder="Enter your current address"
                                                />
                                            </div>
                                            <p className="text-sm text-red-600 mt-3 font-bold flex items-center">
                                                <FaClock className="mr-2" />
                                                Estimated ambulance arrival: 10-15 minutes
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="flex-1 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 py-5 rounded-2xl font-bold text-lg hover:from-gray-300 hover:to-gray-400 transition-all shadow-lg"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-red-600 hover:to-red-700 transition-all shadow-2xl flex items-center justify-center disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="animate-spin mr-3 text-2xl" />
                                                Finding Doctor...
                                            </>
                                        ) : (
                                            <>
                                                <FaAmbulance className="mr-3 text-2xl" />
                                                Book Emergency Appointment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar - Available Doctors */}
                    <div className="lg:col-span-1">
                        <div className="glass-effect rounded-3xl shadow-2xl p-6 border-2 border-red-200 sticky top-4">
                            <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center">
                                <FaUsers className="mr-3 text-3xl text-red-600" />
                                Available Doctors ({availableDoctors.length})
                            </h3>

                            {loadingDoctors ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FaSpinner className="animate-spin text-red-600 text-5xl mb-4" />
                                    <span className="text-gray-600 font-medium text-lg">Loading doctors...</span>
                                </div>
                            ) : availableDoctors.length > 0 ? (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {availableDoctors.slice(0, 6).map((doctor) => (
                                        <div key={doctor._id} className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-2xl p-5 card-hover shadow-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800 text-lg mb-1">{doctor.name}</p>
                                                    <p className="text-red-600 font-medium">{doctor.specialization}</p>
                                                </div>
                                                <FaUserMd className="text-red-500 text-3xl" />
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <span className="text-sm bg-red-200 text-red-800 px-3 py-2 rounded-lg font-bold flex items-center">
                                                    <FaUsers className="mr-2" />
                                                    {doctor.currentLoad} patients
                                                </span>
                                                <span
                                                    className={`text-sm px-3 py-2 rounded-lg font-bold flex items-center ${
                                                        doctor.availability === 'available' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                                    }`}
                                                >
                                                    <FaStar className="mr-2" />
                                                    {doctor.availability}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FaUserMd className="text-gray-300 text-6xl mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium text-lg">No doctors available for selected specialization</p>
                                </div>
                            )}

                            <p className="text-xs text-red-600 mt-6 font-medium text-center bg-red-50 p-3 rounded-xl">ℹ️ System will auto-assign the least busy available doctor</p>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="glass-effect rounded-2xl p-8 text-center card-hover border-2 border-red-200 shadow-xl">
                        <div className="text-6xl mb-4">⚡</div>
                        <h3 className="font-bold text-gray-800 mb-3 text-xl">Instant Booking</h3>
                        <p className="text-gray-600 font-medium">No waiting for approval</p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8 text-center card-hover border-2 border-red-200 shadow-xl">
                        <div className="text-6xl mb-4">🎯</div>
                        <h3 className="font-bold text-gray-800 mb-3 text-xl">Auto-Assigned</h3>
                        <p className="text-gray-600 font-medium">Best available doctor</p>
                    </div>
                    <div className="glass-effect rounded-2xl p-8 text-center card-hover border-2 border-red-200 shadow-xl">
                        <div className="text-6xl mb-4">🔴</div>
                        <h3 className="font-bold text-gray-800 mb-3 text-xl">High Priority</h3>
                        <p className="text-gray-600 font-medium">Skip regular queue</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyAppointment;
