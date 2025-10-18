import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaBirthdayCake, FaUserMd, FaCalendarAlt, FaClock, FaStethoscope, FaCheckCircle, FaArrowRight, FaArrowLeft, FaSpinner, FaHospital, FaPhone, FaEnvelope } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { getAllDoctors } from '../../../services/adminDoctor.service';

// Type definitions
interface Doctor {
    _id: string;
    name: string;
    username: string;
    role: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    doctorType: string;
    specialization: string;
    isActive: boolean;
    isEmailVerified: boolean;
    title?: string;
    phoneNumber?: string;
}

interface Step {
    number: number;
    title: string;
    icon: IconType;
    description: string;
}

interface FormData {
    patientName: string;
    patientAge: string;
    patientGender: string;
    patientPhone: string;
    patientEmail: string;
    doctor: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    urgency: 'normal' | 'urgent' | 'emergency';
    patient: string;
}

const ModernAppointmentForm: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [fetchingDoctors, setFetchingDoctors] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [queueNumber, setQueueNumber] = useState<string>('');

    // Search and filter
    const [searchDoctor, setSearchDoctor] = useState<string>('');
    const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
    const [timelineView, setTimelineView] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormData>({
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientPhone: '',
        patientEmail: '',
        doctor: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        urgency: 'normal',
        patient: '659631b7bace152d00f8b6a0',
    });

    const steps: Step[] = [
        { number: 1, title: 'Personal Info', icon: FaUser, description: 'Tell us about yourself' },
        { number: 2, title: 'Select Doctor', icon: FaUserMd, description: 'Choose your specialist' },
        { number: 3, title: 'Date & Time', icon: FaCalendarAlt, description: 'Pick your slot' },
        { number: 4, title: 'Confirm', icon: FaCheckCircle, description: 'Review & book' },
    ];

    const specializations: string[] = ['All', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Ophthalmology', 'Psychiatry', 'General Medicine', 'ENT', 'Pregnancy'];

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async (): Promise<void> => {
        try {
            setFetchingDoctors(true);
            const doctorsData = await getAllDoctors();
            console.log('Fetched doctors:', doctorsData);

            // If doctorsData is already the array, use it directly
            if (!Array.isArray(doctorsData)) {
                throw new Error('Invalid response format from server');
            }

            // Filter by isActive instead of isAvailable
            const availableDocs = doctorsData.filter((doc) => doc.isActive);
            setDoctors(availableDocs);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setError('Failed to fetch available doctors.');
        } finally {
            setFetchingDoctors(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleDoctorSelect = (doctor: Doctor): void => {
        setSelectedDoctor(doctor);
        setFormData({
            ...formData,
            doctor: doctor._id,
        });
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.patientName.trim()) {
                    setError('Please enter patient name');
                    return false;
                }
                if (formData.patientName.trim().length < 3) {
                    setError('Name must be at least 3 characters long');
                    return false;
                }
                if (!/^[a-zA-Z ]+$/.test(formData.patientName)) {
                    setError('Name should only contain letters and spaces');
                    return false;
                }
                if (!formData.patientAge || parseInt(formData.patientAge) < 1 || parseInt(formData.patientAge) > 120) {
                    setError('Please enter a valid age (1-120)');
                    return false;
                }
                if (!formData.patientGender) {
                    setError('Please select gender');
                    return false;
                }
                // Email validation (optional but must be valid if provided)
                if (formData.patientEmail && formData.patientEmail.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.patientEmail)) {
                        setError('Please enter a valid email address');
                        return false;
                    }
                }
                // Phone validation (optional but must be valid if provided)
                if (formData.patientPhone && formData.patientPhone.trim()) {
                    if (!/^\d{10,15}$/.test(formData.patientPhone.replace(/[\s\-\(\)]/g, ''))) {
                        setError('Phone number must be 10-15 digits');
                        return false;
                    }
                }
                break;
            case 2:
                if (!formData.doctor) {
                    setError('Please select a doctor');
                    return false;
                }
                break;
            case 3:
                if (!formData.appointmentDate) {
                    setError('Please select appointment date');
                    return false;
                }
                if (!formData.appointmentTime) {
                    setError('Please select appointment time');
                    return false;
                }
                const selectedDate = new Date(formData.appointmentDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    setError('Appointment date must be today or in the future');
                    return false;
                }
                break;
            case 4:
                if (!formData.reason.trim() || formData.reason.length < 10) {
                    setError('Please provide reason (minimum 10 characters)');
                    return false;
                }
                break;
            default:
                break;
        }
        setError('');
        return true;
    };

    const nextStep = (): void => {
        if (validateStep(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = (): void => {
        setCurrentStep(currentStep - 1);
        setError('');
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!validateStep(4)) return;

        try {
            setSubmitting(true);
            setError('');

            const response = await fetch('http://localhost:3004/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to book appointment');
            }

            const data = await response.json();
            setQueueNumber(data.queueNumber);
            setSuccess(true);

            setTimeout(() => {
                navigate('/patient/view-appointment');
            }, 4000);
        } catch (error) {
            setError((error as Error).message || 'Failed to book appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const getTodayDateString = (): string => {
        return new Date().toISOString().split('T')[0];
    };

    const formatTimeToAMPM = (time24: string): string => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getTimeSlots = (): string[] => {
        const slots: string[] = [];
        for (let hour = 9; hour <= 17; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`);
            if (hour < 17) slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return slots;
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 animate-slideUp">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 animate-bounce">
                            <FaCheckCircle className="text-white text-5xl" />
                        </div>
                        <h2 className="text-4xl font-bold text-gray-800 mb-4">Appointment Confirmed!</h2>
                        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-6 mb-6">
                            <p className="text-gray-700 mb-2">Your Queue Number</p>
                            <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{queueNumber}</p>
                        </div>
                        <div className="space-y-3 text-left bg-gray-50 rounded-xl p-6 mb-6">
                            <div className="flex items-center">
                                <FaUserMd className="text-blue-600 mr-3" />
                                <span className="text-gray-700">
                                    {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <FaCalendarAlt className="text-purple-600 mr-3" />
                                <span className="text-gray-700">{new Date(formData.appointmentDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                                <FaClock className="text-green-600 mr-3" />
                                <span className="text-gray-700">{formatTimeToAMPM(formData.appointmentTime)}</span>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">Redirecting to your appointments...</p>
                        <div className="flex items-center justify-center">
                            <FaSpinner className="animate-spin text-blue-600 text-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFB] via-[#E8F4F8] to-[#E0F2F7] relative overflow-hidden py-12 px-4">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#5DADE2] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"></div>
                <div className="absolute top-40 right-10 w-96 h-96 bg-[#52C9A8] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-[#9B9EE8] rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Premium Header */}
                <div className="text-center mb-12 animate-fadeIn">
                    <Link
                        to="/"
                        className="inline-flex items-center px-6 py-3.5 glass-effect hover:bg-white rounded-2xl mb-8 font-bold text-[#4A90E2] hover:text-[#5DADE2] transition-all shadow-xl hover:shadow-2xl hover:scale-105 border-2 border-white/50 group"
                    >
                        <FaArrowLeft className="mr-3 text-xl group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Dashboard</span>
                    </Link>

                    {/* Animated Icon */}
                    <div className="relative inline-block mb-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#4A90E2] to-[#52C9A8] rounded-full blur-2xl opacity-50 animate-pulse"></div>
                        <div className="relative p-8 bg-gradient-to-br from-[#4A90E2] via-[#5DADE2] to-[#52C9A8] rounded-3xl shadow-2xl animate-float border-4 border-white">
                            <FaCalendarAlt className="text-7xl text-white" />
                        </div>
                    </div>

                    <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-[#4A90E2] via-[#5DADE2] to-[#52C9A8] bg-clip-text text-transparent leading-tight">Book Appointment</h1>
                    <p className="text-[#4A5568] text-2xl font-bold max-w-2xl mx-auto">Schedule your visit with our expert healthcare professionals</p>

                    {/* Trust Indicators */}
                    <div className="flex items-center justify-center gap-8 mt-8">
                        <div className="flex items-center gap-2 text-[#52C9A8]">
                            <FaCheckCircle className="text-2xl" />
                            <span className="font-bold text-sm">Instant Confirmation</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#4A90E2]">
                            <FaHospital className="text-2xl" />
                            <span className="font-bold text-sm">Expert Doctors</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#9B9EE8]">
                            <FaStethoscope className="text-2xl" />
                            <span className="font-bold text-sm">Quality Care</span>
                        </div>
                    </div>
                </div>

                {/* Advanced Progress Steps */}
                <div className="mb-12 animate-slideIn">
                    <div className="glass-effect rounded-3xl p-8 shadow-2xl border-2 border-white/50 max-w-5xl mx-auto relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#4A90E2]/5 to-transparent rounded-bl-full"></div>
                        {/* View Toggle */}
                        <div className="flex justify-end mb-6">
                            <button
                                onClick={() => setTimelineView(!timelineView)}
                                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all font-semibold text-sm flex items-center gap-2"
                            >
                                {timelineView ? '📊 Horizontal View' : '📅 Timeline View'}
                            </button>
                        </div>

                        {!timelineView ? (
                            /* Premium Horizontal Progress */
                            <div className="flex items-center justify-between relative">
                                {steps.map((step, index) => (
                                    <React.Fragment key={step.number}>
                                        <div className="flex flex-col items-center flex-1 group relative z-10">
                                            {/* Step Circle */}
                                            <div className="relative">
                                                {currentStep >= step.number && (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#4A90E2] to-[#52C9A8] rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                                                )}
                                                <div
                                                    className={`relative w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500 transform border-4 ${
                                                        currentStep >= step.number
                                                            ? 'bg-gradient-to-br from-[#4A90E2] to-[#52C9A8] text-white shadow-2xl scale-110 border-white'
                                                            : 'bg-white text-[#B8C5D0] scale-100 border-[#E8EEF2]'
                                                    } ${currentStep === step.number ? 'animate-pulse-soft ring-4 ring-[#4A90E2]/30' : ''}`}
                                                >
                                                    {currentStep > step.number ? <FaCheckCircle className="text-4xl animate-scaleIn" /> : <step.icon className="text-4xl" />}
                                                </div>
                                            </div>

                                            {/* Step Info */}
                                            <div className="mt-4 text-center">
                                                <p className={`text-base font-black mb-1 ${currentStep >= step.number ? 'text-[#4A90E2]' : 'text-[#B8C5D0]'}`}>{step.title}</p>
                                                <p className="text-xs font-semibold text-[#4A5568]">{step.description}</p>
                                            </div>

                                            {/* Active Indicator */}
                                            {currentStep === step.number && (
                                                <div className="mt-3 flex items-center gap-1">
                                                    <div className="w-2 h-2 bg-[#4A90E2] rounded-full animate-pulse"></div>
                                                    <div className="w-2 h-2 bg-[#52C9A8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                    <div className="w-2 h-2 bg-[#9B9EE8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div className="flex-1 h-1.5 mx-6 rounded-full transition-all duration-500 relative top-[-40px]">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        currentStep > step.number ? 'bg-gradient-to-r from-[#4A90E2] to-[#52C9A8]' : 'bg-[#E8EEF2]'
                                                    }`}
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            /* Vertical Timeline View */
                            <div className="space-y-6">
                                {steps.map((step, index) => (
                                    <div key={step.number} className="flex items-start gap-6 relative">
                                        {/* Vertical Line */}
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`absolute left-10 top-20 w-1 h-full transition-all duration-500 ${
                                                    currentStep > step.number ? 'bg-gradient-to-b from-indigo-500 to-purple-600' : 'bg-gray-200'
                                                }`}
                                                style={{ height: 'calc(100% + 24px)' }}
                                            />
                                        )}

                                        {/* Step Icon */}
                                        <div
                                            className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${
                                                currentStep >= step.number ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl' : 'bg-gray-200 text-gray-500'
                                            } ${currentStep === step.number ? 'animate-pulse ring-4 ring-indigo-300' : ''}`}
                                        >
                                            {currentStep > step.number ? <FaCheckCircle className="text-3xl" /> : <step.icon className="text-3xl" />}
                                        </div>

                                        {/* Step Content */}
                                        <div className="flex-1 pb-8">
                                            <div
                                                className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
                                                    currentStep === step.number
                                                        ? 'border-indigo-500 shadow-indigo-200'
                                                        : currentStep > step.number
                                                        ? 'border-green-300 shadow-green-100'
                                                        : 'border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className={`text-xl font-bold ${currentStep >= step.number ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                        Step {step.number}: {step.title}
                                                    </h3>
                                                    {currentStep > step.number && (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                            <FaCheckCircle /> Completed
                                                        </span>
                                                    )}
                                                    {currentStep === step.number && (
                                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold animate-pulse">⚡ In Progress</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 text-sm">{step.description}</p>

                                                {/* Progress indicator for current step */}
                                                {currentStep === step.number && (
                                                    <div className="mt-4">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full animate-pulse"
                                                                style={{ width: `${(step.number / steps.length) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">{Math.round((step.number / steps.length) * 100)}% Complete</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Premium Form Card */}
                <div className="relative glass-effect rounded-3xl shadow-2xl p-12 max-w-5xl mx-auto border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(74,144,226,0.2)] transition-all overflow-hidden">
                    {/* Premium Decorative Elements */}
                    <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#4A90E2]/10 to-transparent rounded-br-full"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-[#52C9A8]/10 to-transparent rounded-tl-full"></div>
                    <div className="absolute top-1/2 right-0 w-32 h-32 bg-gradient-to-l from-[#9B9EE8]/5 to-transparent rounded-l-full"></div>
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 animate-shake">
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Personal Info */}
                        {currentStep === 1 && (
                            <div className="space-y-8 animate-fadeIn relative">
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-8 flex items-center">
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
                                        <FaUser className="text-2xl text-white" />
                                    </div>
                                    Personal Information
                                </h2>

                                <div className="group">
                                    <label className="block text-base font-bold text-gray-800 mb-3 flex items-center">
                                        <FaUser className="mr-3 text-indigo-600 text-xl" />
                                        Patient Name <span className="text-red-500 ml-2 text-xl">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="patientName"
                                        value={formData.patientName}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        className="w-full px-6 py-5 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 transition-all outline-none text-lg font-semibold shadow-lg hover:shadow-xl bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                            <FaBirthdayCake className="mr-2 text-purple-600" />
                                            Age <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="patientAge"
                                            value={formData.patientAge}
                                            onChange={handleChange}
                                            placeholder="Age"
                                            min="1"
                                            max="120"
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Gender <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <select
                                            name="patientGender"
                                            value={formData.patientGender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaPhone className="mr-2 text-green-600" />
                                        Phone Number <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="patientPhone"
                                        value={formData.patientPhone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaEnvelope className="mr-2 text-blue-600" />
                                        Email <span className="text-gray-400 text-xs ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="patientEmail"
                                        value={formData.patientEmail}
                                        onChange={handleChange}
                                        placeholder="patient@example.com"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Select Doctor */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Choose Your Doctor</h2>
                                    <span className="text-sm text-gray-500">{doctors.length} doctors available</span>
                                </div>

                                {/* Search and Filter Bar */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Search */}
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Search by doctor name..."
                                                    value={searchDoctor}
                                                    onChange={(e) => setSearchDoctor(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                />
                                                <FaUserMd className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Specialization Filter */}
                                        <div className="md:w-64">
                                            <select
                                                value={filterSpecialization}
                                                onChange={(e) => setFilterSpecialization(e.target.value)}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                                            >
                                                {specializations.map((spec) => (
                                                    <option key={spec} value={spec.toLowerCase()}>
                                                        {spec}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {fetchingDoctors ? (
                                    <div className="flex items-center justify-center py-12">
                                        <FaSpinner className="animate-spin text-blue-600 text-4xl mr-3" />
                                        <span className="text-gray-600">Loading doctors...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {doctors
                                            .filter((doctor) => {
                                                const matchesSearch = searchDoctor === '' || doctor.name.toLowerCase().includes(searchDoctor.toLowerCase());
                                                const matchesSpec = filterSpecialization === 'all' || doctor.specialization.toLowerCase() === filterSpecialization;
                                                return matchesSearch && matchesSpec;
                                            })
                                            .map((doctor) => (
                                                <div
                                                    key={doctor._id}
                                                    onClick={() => handleDoctorSelect(doctor)}
                                                    className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl ${
                                                        selectedDoctor?._id === doctor._id
                                                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-105'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center">
                                                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                                                                <FaUserMd className="text-white text-xl" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-800">
                                                                    {doctor.firstName} {doctor.lastName}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                                            </div>
                                                        </div>
                                                        {selectedDoctor?._id === doctor._id && <FaCheckCircle className="text-blue-600 text-2xl" />}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600 mt-2">
                                                        <FaHospital className="mr-2 text-purple-600" />
                                                        <span>{doctor.phone || 'Contact via hospital'}</span>
                                                    </div>
                                                    <div className="flex items-center mt-2">
                                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Available</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Date & Time */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Date & Time</h2>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaCalendarAlt className="mr-2 text-blue-600" />
                                        Appointment Date <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="appointmentDate"
                                        value={formData.appointmentDate}
                                        onChange={handleChange}
                                        min={getTodayDateString()}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <FaClock className="mr-2 text-purple-600" />
                                        Appointment Time <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {getTimeSlots().map((slot) => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                                                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                                                    formData.appointmentTime === slot
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {formatTimeToAMPM(slot)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['normal', 'urgent', 'emergency'] as const).map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, urgency: level })}
                                                className={`py-3 px-4 rounded-xl font-medium capitalize transition-all ${
                                                    formData.urgency === level
                                                        ? level === 'emergency'
                                                            ? 'bg-red-600 text-white shadow-lg'
                                                            : level === 'urgent'
                                                            ? 'bg-orange-600 text-white shadow-lg'
                                                            : 'bg-green-600 text-white shadow-lg'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Details */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6">Appointment Details</h2>

                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Appointment Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Patient:</span>
                                            <span className="font-medium">{formData.patientName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Doctor:</span>
                                            <span className="font-medium">
                                                {selectedDoctor?.firstName} {selectedDoctor?.lastName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Specialization:</span>
                                            <span className="font-medium">{selectedDoctor?.specialization}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Date:</span>
                                            <span className="font-medium">{new Date(formData.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Time:</span>
                                            <span className="font-medium">{formatTimeToAMPM(formData.appointmentTime)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FaStethoscope className="mr-2 text-blue-600" />
                                        Reason for Visit <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        placeholder="Please describe your symptoms or reason for visit (minimum 10 characters)"
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{formData.reason.length}/10 characters minimum</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                            {currentStep > 1 && (
                                <button type="button" onClick={prevStep} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center">
                                    <FaArrowLeft className="mr-2" />
                                    Previous
                                </button>
                            )}

                            {currentStep < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:shadow-2xl transition-all flex items-center text-lg hover:scale-105 transform duration-300"
                                >
                                    Next
                                    <FaArrowRight className="ml-2" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`ml-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center ${
                                        submitting ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="animate-spin mr-2" />
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheckCircle className="mr-2" />
                                            Confirm Booking
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-10px);
                    }
                    75% {
                        transform: translateX(10px);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.6s ease-out;
                }
                .animate-shake {
                    animation: shake 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ModernAppointmentForm;
