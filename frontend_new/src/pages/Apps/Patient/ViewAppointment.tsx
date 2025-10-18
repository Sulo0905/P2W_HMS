import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaEdit,
    FaTrash,
    FaArrowLeft,
    FaDownload,
    FaSpinner,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaSearch,
    FaCalendarCheck,
    FaFilter,
    FaChartLine,
    FaFilePdf,
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import ModernReportGenerator from '../../../components/ModernReportGenerator';

// Type definitions
interface Doctor {
    _id: string;
    name: string;
    title?: string;
    specialization?: string;
}

interface Appointment {
    _id: string;
    patientName: string;
    patientAge: string;
    patientGender: string;
    patientPhone: string;
    patientEmail: string;
    doctor: Doctor;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    urgency: 'normal' | 'urgent' | 'emergency';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    queueNumber: string;
    patient: string;
    createdAt: string;
    updatedAt: string;
}

interface Statistics {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
}

const MyAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [generatingReport, setGeneratingReport] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>('');
    const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
    const [reportAppointment, setReportAppointment] = useState<Appointment | null>(null);

    // Filter and search features
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<'date' | 'doctor' | 'status'>('date');
    const showStats = true;

    // Mock patient ID - in a real app, get from context/auth
    const patientId = '659631b7bace152d00f8b6a0';

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async (): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            console.log('Fetching appointments for patient:', patientId);

            const response = await fetch(`http://localhost:3004/api/appointments/patient/${patientId}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }

            const data: Appointment[] = await response.json();
            console.log('Fetched appointments:', data);

            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setError('Failed to fetch appointments. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (appointment: Appointment): void => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string): void => {
        setDeleteConfirmation(id);
    };

    const confirmDelete = async (): Promise<void> => {
        if (!deleteConfirmation) return;

        try {
            setLoading(true);
            setError('');
            console.log('Attempting to delete appointment ID:', deleteConfirmation);

            const response = await fetch(`http://localhost:5000/api/direct-delete-appointment/${deleteConfirmation}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Delete response status:', response.status);
            console.log('Delete response headers:', Object.fromEntries([...response.headers.entries()]));

            const responseText = await response.text();
            console.log('Delete response text:', responseText);

            let responseData: { message?: string };
            try {
                responseData = JSON.parse(responseText);
                console.log('Delete response parsed as JSON:', responseData);
            } catch (e) {
                responseData = { message: responseText || 'Unknown response' };
                console.log('Delete response is not valid JSON, using text instead');
            }

            if (response.ok) {
                console.log('Appointment successfully deleted');
                setAppointments(appointments.filter((app) => app._id !== deleteConfirmation));
                setDeleteConfirmation(null);
                setError('');
            } else {
                if (response.status === 404) {
                    throw new Error('Appointment not found - it may have already been deleted');
                } else {
                    throw new Error(responseData.message || `Server error (${response.status})`);
                }
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            setError(`Failed to delete appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
            fetchAppointments();
        }
    };

    const handleUpdateAppointment = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!selectedAppointment) return;

        try {
            console.log('Updating appointment:', selectedAppointment._id);
            console.log('Update data:', { reason: selectedAppointment.reason });

            const updateData = {
                reason: selectedAppointment.reason,
            };

            const response = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || `Server returned status ${response.status}`);
            }

            const data: Appointment = await response.json();
            console.log('Appointment updated successfully:', data);

            setAppointments(appointments.map((app) => (app._id === selectedAppointment._id ? data : app)));

            setIsModalOpen(false);
        } catch (error) {
            console.error('Error updating appointment:', error);
            setError('Failed to update appointment. Please try again.');
        }
    };

    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString: string): string => {
        if (!timeString) return 'Not specified';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status: string): JSX.Element => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span>;
            case 'confirmed':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Confirmed</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Completed</span>;
            case 'cancelled':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Cancelled</span>;
            case 'no-show':
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">No-show</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
        }
    };

    const getFilteredAppointments = (): Appointment[] => {
        let filtered = [...appointments];

        if (filterStatus !== 'all') {
            filtered = filtered.filter((apt) => apt.status === filterStatus);
        }

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (apt) => apt.doctor?.name?.toLowerCase().includes(search) || apt.reason?.toLowerCase().includes(search) || apt.doctor?.specialization?.toLowerCase().includes(search)
            );
        }

        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
            } else if (sortBy === 'doctor') {
                return (a.doctor?.name || '').localeCompare(b.doctor?.name || '');
            } else if (sortBy === 'status') {
                return (a.status || '').localeCompare(b.status || '');
            }
            return 0;
        });

        return filtered;
    };

    const getStatistics = (): Statistics => {
        const total = appointments.length;
        const pending = appointments.filter((apt) => apt.status === 'pending').length;
        const confirmed = appointments.filter((apt) => apt.status === 'confirmed').length;
        const completed = appointments.filter((apt) => apt.status === 'completed').length;
        const cancelled = appointments.filter((apt) => apt.status === 'cancelled').length;

        return { total, pending, confirmed, completed, cancelled };
    };

    const generateReport = async (): Promise<void> => {
        try {
            setGeneratingReport(true);

            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setTextColor(0, 0, 255);
            doc.text('MY APPOINTMENTS REPORT', 20, 20);

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
            doc.text(`Patient ID: ${patientId}`, 20, 40);

            doc.setFontSize(16);
            doc.setTextColor(0, 0, 150);
            doc.text('APPOINTMENTS', 20, 50);

            if (appointments.length === 0) {
                doc.setFontSize(12);
                doc.setTextColor(100, 100, 100);
                doc.text('No appointments found.', 20, 60);
            } else {
                let yPos = 60;

                appointments.forEach((appointment, index) => {
                    doc.setFillColor(240, 240, 240);
                    doc.rect(20, yPos - 5, 170, 40, 'F');

                    doc.setFontSize(14);
                    doc.setTextColor(0, 0, 0);
                    doc.text(`Appointment ${index + 1}`, 25, yPos);

                    doc.setFontSize(10);
                    doc.text(`Queue Number: ${appointment.queueNumber}`, 30, yPos + 8);
                    doc.text(`Doctor: ${appointment.doctor?.name || 'Unknown'}`, 30, yPos + 16);
                    doc.text(`Date: ${formatDate(appointment.appointmentDate)}`, 30, yPos + 24);
                    doc.text(`Time: ${formatTime(appointment.appointmentTime)}`, 120, yPos + 16);
                    doc.text(`Status: ${appointment.status.toUpperCase()}`, 120, yPos + 8);

                    doc.text('Reason for visit:', 30, yPos + 32);

                    const splitReason = doc.splitTextToSize(appointment.reason, 150);
                    doc.text(splitReason, 35, yPos + 40);

                    yPos += 50 + (splitReason.length - 1) * 5;

                    if (yPos > 270 && index < appointments.length - 1) {
                        doc.addPage();
                        yPos = 20;
                    }
                });
            }

            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount} - Doctor Appointment System`, 20, 290);
            }

            doc.save(`appointments-report-${new Date().toISOString().split('T')[0]}.pdf`);

            setGeneratingReport(false);
        } catch (error) {
            console.error('Error generating PDF report:', error);
            setError('Failed to generate PDF report');
            setGeneratingReport(false);
        }
    };

    const stats = getStatistics();
    const filteredAppointments = getFilteredAppointments();

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFB] via-[#E8F4F8] to-[#E0F2F7] relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-[#5DADE2] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
                <div
                    className="absolute top-40 right-10 w-[500px] h-[500px] bg-[#52C9A8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
                    style={{ animationDelay: '2s' }}
                ></div>
                <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-[#9B9EE8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
            </div>

            {/* Premium Header Banner */}
            <div className="relative bg-gradient-to-r from-[#4A90E2] via-[#5DADE2] to-[#52C9A8] text-white py-20 px-4 mb-12 shadow-2xl overflow-hidden">
                {/* Advanced Decorative Elements */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse-soft"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>

                <div className="container mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                        <div className="flex-1">
                            {/* Premium Title */}
                            <div className="flex items-center gap-6 mb-6 animate-fadeIn">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-white/30 rounded-3xl blur-xl"></div>
                                    <div className="relative glass-effect p-6 rounded-3xl border-2 border-white/30 shadow-2xl">
                                        <FaCalendarCheck className="text-6xl" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-7xl font-black leading-tight">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-50 to-white">My Appointments</span>
                                    </h1>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                                            <span className="text-sm font-bold text-white">Live Tracking</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                            <FaCheckCircle className="text-green-300" />
                                            <span className="text-sm font-bold text-white">{stats.total} Total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-blue-50 text-xl font-semibold max-w-2xl leading-relaxed">Track, manage, and organize all your healthcare appointments in one place</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={generateReport}
                                disabled={loading || generatingReport || appointments.length === 0}
                                className={`group relative overflow-hidden flex items-center px-8 py-4 rounded-2xl font-black shadow-2xl transition-all ${
                                    loading || generatingReport || appointments.length === 0
                                        ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                        : 'bg-white text-[#4A90E2] hover:scale-105 hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)]'
                                }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#4A90E2]/10 to-[#52C9A8]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {generatingReport ? (
                                    <>
                                        <FaSpinner className="relative animate-spin mr-3 text-2xl" />
                                        <span className="relative">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaDownload className="relative mr-3 text-2xl" />
                                        <span className="relative">Export PDF</span>
                                    </>
                                )}
                            </button>
                            <Link
                                to="/"
                                className="group relative overflow-hidden flex items-center px-8 py-4 glass-effect hover:bg-white/30 rounded-2xl font-black backdrop-blur-lg border-2 border-white/30 transition-all hover:scale-105 shadow-2xl"
                            >
                                <FaArrowLeft className="mr-3 text-2xl group-hover:-translate-x-1 transition-transform" />
                                <span>Dashboard</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-8 relative z-10">
                {/* Premium Statistics Dashboard */}
                {showStats && appointments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12 animate-slideIn">
                        {/* Total Appointments */}
                        <div className="group relative glass-effect rounded-3xl p-7 shadow-2xl border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(74,144,226,0.3)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#4A90E2]/5 to-[#9B9EE8]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4A90E2]/10 to-transparent rounded-bl-full"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#4A5568] font-black uppercase tracking-wider mb-3">Total</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4A90E2] to-[#9B9EE8]">{stats.total}</p>
                                    <p className="text-xs text-[#4A5568] font-bold mt-2">Appointments</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#4A90E2] to-[#9B9EE8] rounded-2xl blur-lg opacity-50"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#4A90E2] to-[#9B9EE8] rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FaCalendarAlt className="text-white text-3xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div className="group relative glass-effect rounded-3xl p-7 shadow-2xl border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(255,139,148,0.3)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#FF8B94]/5 to-[#ECC94B]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF8B94]/10 to-transparent rounded-bl-full"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#4A5568] font-black uppercase tracking-wider mb-3">Pending</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF8B94] to-[#ECC94B]">{stats.pending}</p>
                                    <p className="text-xs text-[#4A5568] font-bold mt-2">Awaiting</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF8B94] to-[#ECC94B] rounded-2xl blur-lg opacity-50"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#FF8B94] to-[#ECC94B] rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FaClock className="text-white text-3xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirmed */}
                        <div className="group relative glass-effect rounded-3xl p-7 shadow-2xl border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(93,173,226,0.3)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#5DADE2]/5 to-[#4A90E2]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5DADE2]/10 to-transparent rounded-bl-full"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#4A5568] font-black uppercase tracking-wider mb-3">Confirmed</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#5DADE2] to-[#4A90E2]">{stats.confirmed}</p>
                                    <p className="text-xs text-[#4A5568] font-bold mt-2">Scheduled</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5DADE2] to-[#4A90E2] rounded-2xl blur-lg opacity-50"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#5DADE2] to-[#4A90E2] rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FaHourglassHalf className="text-white text-3xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="group relative glass-effect rounded-3xl p-7 shadow-2xl border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(82,201,168,0.3)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#52C9A8]/5 to-[#48BB78]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#52C9A8]/10 to-transparent rounded-bl-full"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#4A5568] font-black uppercase tracking-wider mb-3">Completed</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#52C9A8] to-[#48BB78]">{stats.completed}</p>
                                    <p className="text-xs text-[#4A5568] font-bold mt-2">Finished</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#52C9A8] to-[#48BB78] rounded-2xl blur-lg opacity-50"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#52C9A8] to-[#48BB78] rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FaCheckCircle className="text-white text-3xl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cancelled */}
                        <div className="group relative glass-effect rounded-3xl p-7 shadow-2xl border-2 border-white/50 hover:shadow-[0_20px_60px_rgba(245,101,101,0.3)] hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#F56565]/5 to-[#FF8B94]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F56565]/10 to-transparent rounded-bl-full"></div>
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-[#4A5568] font-black uppercase tracking-wider mb-3">Cancelled</p>
                                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F56565] to-[#FF8B94]">{stats.cancelled}</p>
                                    <p className="text-xs text-[#4A5568] font-bold mt-2">Removed</p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#F56565] to-[#FF8B94] rounded-2xl blur-lg opacity-50"></div>
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#F56565] to-[#FF8B94] rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                        <FaTimesCircle className="text-white text-3xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium Filters and Search Bar */}
                <div className="glass-effect rounded-3xl p-6 shadow-2xl border-2 border-white/50 mb-8 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by doctor, reason, or specialization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Filter by Status */}
                        <div className="flex items-center gap-2">
                            <FaFilter className="text-gray-500" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">Sort:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'date' | 'doctor' | 'status')}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                            >
                                <option value="date">Date</option>
                                <option value="doctor">Doctor</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                title="Grid View"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                title="List View"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`px-3 py-2 rounded-md transition ${viewMode === 'timeline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                title="Timeline View"
                            >
                                <FaChartLine className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">{error}</div>}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                        <p>Loading appointments...</p>
                    </div>
                ) : (
                    <>
                        {appointments.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                                <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No Appointments Yet</h3>
                                <p className="text-gray-600 mb-6">Start your healthcare journey by booking your first appointment.</p>
                                <Link to="/appointment" className="inline-flex items-center bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold shadow-md">
                                    <FaCalendarAlt className="mr-2" />
                                    Book an Appointment
                                </Link>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                                <FaSearch className="mx-auto text-6xl text-gray-300 mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
                                <p className="text-gray-600 mb-6">No appointments match your current filters or search.</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
                                    }}
                                    className="inline-flex items-center bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Grid View */}
                                {viewMode === 'grid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredAppointments.map((appointment) => (
                                            <div
                                                key={appointment._id}
                                                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                                            >
                                                {/* Card Header with Status */}
                                                <div
                                                    className={`p-4 ${
                                                        appointment.status === 'confirmed'
                                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                                            : appointment.status === 'completed'
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                            : appointment.status === 'cancelled'
                                                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                                            : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between text-white">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mr-3">
                                                                <span className="font-bold text-sm">#{appointment.queueNumber}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs opacity-90">Queue Number</p>
                                                                <p className="font-bold">{appointment.queueNumber}</p>
                                                            </div>
                                                        </div>
                                                        {getStatusBadge(appointment.status)}
                                                    </div>
                                                </div>

                                                {/* Card Body */}
                                                <div className="p-5">
                                                    {/* Doctor Info */}
                                                    <div className="flex items-start mb-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold text-gray-800 text-lg">
                                                                {appointment.doctor?.title || 'Dr.'} {appointment.doctor?.name || 'Unknown'}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">{appointment.doctor?.specialization || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Date & Time */}
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <FaCalendarAlt className="mr-2 text-blue-500" />
                                                            <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <FaClock className="mr-2 text-purple-500" />
                                                            <span className="font-medium">{formatTime(appointment.appointmentTime)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Reason */}
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500 mb-1">Reason for Visit</p>
                                                        <p className="text-sm text-gray-700 line-clamp-2">{appointment.reason}</p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                                                        <button
                                                            onClick={() => {
                                                                setReportAppointment(appointment);
                                                                setReportModalOpen(true);
                                                            }}
                                                            className="flex-1 flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
                                                            title="Generate Report"
                                                        >
                                                            <FaFilePdf className="mr-1" />
                                                            Report
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(appointment)}
                                                            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                                                            title="Edit Appointment"
                                                        >
                                                            <FaEdit className="mr-1" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(appointment._id)}
                                                            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={appointment.status === 'completed'}
                                                            title="Delete Appointment"
                                                        >
                                                            <FaTrash className="mr-1" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* List View */}
                                {viewMode === 'list' && (
                                    <div className="space-y-3">
                                        {/* Table Header */}
                                        <div className="bg-blue-500 rounded-xl shadow-sm overflow-hidden">
                                            <div className="grid grid-cols-7 gap-4 p-4 text-white font-semibold text-sm">
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Queue #
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    Doctor
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Date
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Time
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Reason
                                                </div>
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                    Status
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                    Actions
                                                </div>
                                            </div>
                                        </div>

                                        {/* Table Rows */}
                                        {filteredAppointments.map((appointment) => (
                                            <div key={appointment._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden">
                                                <div className="grid grid-cols-7 gap-4 p-4 items-center">
                                                    {/* Queue Number */}
                                                    <div className="flex items-center">
                                                        <div className="relative">
                                                            <div className="bg-blue-500 rounded-lg px-3 py-2 shadow-sm">
                                                                <p className="text-xs font-bold text-white tracking-wide">{appointment.queueNumber}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Doctor */}
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                {appointment.doctor?.title || 'Dr.'} {appointment.doctor?.name || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{appointment.doctor?.specialization || 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="flex items-center">
                                                        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                                            <p className="text-sm font-medium text-gray-700">{formatDate(appointment.appointmentDate)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Time */}
                                                    <div className="flex items-center">
                                                        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                                            <p className="text-sm font-medium text-gray-700">{formatTime(appointment.appointmentTime)}</p>
                                                        </div>
                                                    </div>

                                                    {/* Reason */}
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-gray-700 truncate" title={appointment.reason}>
                                                            {appointment.reason}
                                                        </p>
                                                    </div>

                                                    {/* Status */}
                                                    <div>{getStatusBadge(appointment.status)}</div>

                                                    {/* Actions */}
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setReportAppointment(appointment);
                                                                setReportModalOpen(true);
                                                            }}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                            title="Generate Report"
                                                        >
                                                            <FaFilePdf className="text-lg" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(appointment)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                                                            title="Edit Appointment"
                                                        >
                                                            <FaEdit className="text-lg" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(appointment._id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={appointment.status === 'completed'}
                                                            title="Delete Appointment"
                                                        >
                                                            <FaTrash className="text-lg" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Timeline View - Coming Soon */}
                                {viewMode === 'timeline' && (
                                    <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                                        <FaChartLine className="mx-auto text-6xl text-blue-500 mb-4" />
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">Timeline View</h3>
                                        <p className="text-gray-600">Interactive timeline view coming soon!</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Update Appointment</h2>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();

                                if (!selectedAppointment.reason.trim()) {
                                    setFormError('Reason for visit is required.');
                                    return;
                                }
                                if (selectedAppointment.reason.length < 5) {
                                    setFormError('Reason must be at least 5 characters long.');
                                    return;
                                }
                                if (selectedAppointment.reason.length > 200) {
                                    setFormError('Reason must not exceed 200 characters.');
                                    return;
                                }

                                setFormError('');
                                handleUpdateAppointment(e);
                            }}
                        >
                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Doctor</label>
                                <p className="p-2 bg-gray-50 rounded">{selectedAppointment.doctor?.name || 'Unknown'}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Appointment Date</label>
                                <p className="p-2 bg-gray-50 rounded">{formatDate(selectedAppointment.appointmentDate)}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Appointment Time</label>
                                <p className="p-2 bg-gray-50 rounded">{formatTime(selectedAppointment.appointmentTime)}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Reason for Visit</label>
                                <textarea
                                    value={selectedAppointment.reason}
                                    onChange={(e) =>
                                        setSelectedAppointment({
                                            ...selectedAppointment,
                                            reason: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                ></textarea>
                                {formError && <p className="text-red-600 text-sm mt-1">{formError}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block mb-1 font-medium">Status</label>
                                <p className="p-2 bg-gray-50 rounded">{getStatusBadge(selectedAppointment.status)}</p>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setFormError('');
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
                        <p className="mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>

                        <div className="flex justify-end space-x-4">
                            <button onClick={() => setDeleteConfirmation(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Report Generator Modal */}
            {reportModalOpen && reportAppointment && (
                <ModernReportGenerator
                    appointment={reportAppointment}
                    onClose={() => {
                        setReportModalOpen(false);
                        setReportAppointment(null);
                    }}
                />
            )}
        </div>
    );
};

export default MyAppointments;
