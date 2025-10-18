import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, BarChart, Bar, LineChart, Line } from 'recharts';
import {
    Users,
    UserCheck,
    UserPlus,
    Calendar,
    Clock,
    Activity,
    AlertCircle,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Stethoscope,
    Heart,
    Pill,
    Ambulance,
    BedDouble,
    ClipboardList,
    FileText,
    Download,
    Filter,
    Search,
    MoreHorizontal,
    Phone,
    Mail,
    MapPin,
    Bell,
    Settings,
} from 'lucide-react';
import { useDispatch } from 'react-redux/es/hooks/useDispatch';
import { setPageTitle } from '../store/themeConfigSlice';

const HMSDashboard = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Admin Dashboard'));
    }, [dispatch]);
    const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    // Patient admission trends
    const admissionData = [
        { month: 'Jan', inpatient: 145, outpatient: 890, emergency: 234 },
        { month: 'Feb', inpatient: 168, outpatient: 920, emergency: 198 },
        { month: 'Mar', inpatient: 152, outpatient: 1050, emergency: 267 },
        { month: 'Apr', inpatient: 189, outpatient: 1120, emergency: 289 },
        { month: 'May', inpatient: 176, outpatient: 980, emergency: 245 },
        { month: 'Jun', inpatient: 195, outpatient: 1180, emergency: 312 },
    ];

    // Department distribution
    const departmentData = [
        { name: 'Cardiology', value: 25, color: '#EF4444' },
        { name: 'Neurology', value: 20, color: '#3B82F6' },
        { name: 'Orthopedics', value: 18, color: '#10B981' },
        { name: 'Pediatrics', value: 15, color: '#F59E0B' },
        { name: 'General', value: 12, color: '#8B5CF6' },
        { name: 'Others', value: 10, color: '#6B7280' },
    ];

    // Pending doctor approvals
    const pendingDoctors = [
        { id: 'DR001', name: 'Dr. Rajesh Kumar', specialty: 'Cardiology', experience: '12 years', status: 'Pending', date: '2024-06-14', email: 'rajesh.k@hospital.com' },
        { id: 'DR002', name: 'Dr. Priya Sharma', specialty: 'Neurology', experience: '8 years', status: 'Pending', date: '2024-06-13', email: 'priya.s@hospital.com' },
        { id: 'DR003', name: 'Dr. Anil Mehta', specialty: 'Orthopedics', experience: '15 years', status: 'Under Review', date: '2024-06-12', email: 'anil.m@hospital.com' },
        { id: 'DR004', name: 'Dr. Kavita Reddy', specialty: 'Pediatrics', experience: '10 years', status: 'Pending', date: '2024-06-11', email: 'kavita.r@hospital.com' },
    ];

    // Today's appointments
    const todayAppointments = [
        { id: 'APT001', patient: 'Amit Patel', doctor: 'Dr. Shah', time: '09:00 AM', department: 'Cardiology', status: 'Confirmed', type: 'Consultation' },
        { id: 'APT002', patient: 'Sneha Gupta', doctor: 'Dr. Verma', time: '10:30 AM', department: 'Neurology', status: 'Waiting', type: 'Follow-up' },
        { id: 'APT003', patient: 'Ravi Singh', doctor: 'Dr. Kumar', time: '11:00 AM', department: 'Orthopedics', status: 'In Progress', type: 'Consultation' },
        { id: 'APT004', patient: 'Meera Das', doctor: 'Dr. Reddy', time: '02:00 PM', department: 'Pediatrics', status: 'Scheduled', type: 'Vaccination' },
        { id: 'APT005', patient: 'Vikram Joshi', doctor: 'Dr. Nair', time: '03:30 PM', department: 'General', status: 'Scheduled', type: 'Check-up' },
    ];

    // Doctors on duty
    const onDutyDoctors = [
        { id: 'D001', name: 'Dr. Sarah Shah', specialty: 'Cardiology', shift: 'Morning', room: '201', patients: 8, available: true },
        { id: 'D002', name: 'Dr. Amit Verma', specialty: 'Neurology', shift: 'Morning', room: '305', patients: 12, available: true },
        { id: 'D003', name: 'Dr. Rahul Kumar', specialty: 'Orthopedics', shift: 'Evening', room: '102', patients: 6, available: false },
        { id: 'D004', name: 'Dr. Kavita Nair', specialty: 'General', shift: 'Morning', room: '410', patients: 15, available: true },
    ];

    // Bed occupancy by department
    const bedOccupancyData = [
        { department: 'ICU', total: 20, occupied: 18, available: 2 },
        { department: 'General', total: 50, occupied: 38, available: 12 },
        { department: 'Pediatrics', total: 30, occupied: 22, available: 8 },
        { department: 'Maternity', total: 25, occupied: 19, available: 6 },
        { department: 'Emergency', total: 15, occupied: 12, available: 3 },
    ];

    type StatCardProps = {
        title: string;
        value: string | number;
        change: number;
        icon: React.ElementType;
        color: string;
        bgColor: string;
        subtitle?: string;
    };

    const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color, bgColor, subtitle }) => (
        <div className={`${bgColor} rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                    <div className="flex items-center mt-2">
                        {change > 0 ? <TrendingUp className="w-4 h-4 text-green-500 mr-1" /> : <TrendingDown className="w-4 h-4 text-red-500 mr-1" />}
                        <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(change)}%</span>
                        <span className="text-gray-500 text-xs ml-1">vs last week</span>
                    </div>
                </div>
                <div className={`p-4 rounded-xl ${color}`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Main Content */}
            <main className="p-6">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
                        <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
                            {['7d', '30d', '90d', '1y'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setSelectedTimeRange(range)}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        selectedTimeRange === range ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Total Patients" value="1,847" change={12.5} icon={Users} color="bg-blue-500" bgColor="bg-white" subtitle="Active: 1,234" />
                    <StatCard title="Today's Appointments" value="42" change={8.2} icon={Calendar} color="bg-green-500" bgColor="bg-white" subtitle="Completed: 28" />
                    <StatCard title="Doctors On Duty" value="28" change={5.1} icon={Stethoscope} color="bg-purple-500" bgColor="bg-white" subtitle="Available: 22" />
                    <StatCard title="Pending Approvals" value="7" change={-15.8} icon={AlertCircle} color="bg-orange-500" bgColor="bg-white" subtitle="Doctors: 4" />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Patient Admissions */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800">Patient Admissions Trend</h3>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Inpatient</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Outpatient</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-gray-600">Emergency</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={admissionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" stroke="#666" />
                                <YAxis stroke="#666" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Area type="monotone" dataKey="inpatient" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="outpatient" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="emergency" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Main Tables Section */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    {/* Pending Doctor Approvals */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <UserCheck className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-semibold text-gray-800">Pending Doctor Approvals</h3>
                            </div>
                            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">4 Pending</span>
                        </div>
                        <div className="space-y-3">
                            {pendingDoctors.map((doctor) => (
                                <div key={doctor.id} className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {doctor.name.split(' ')[1][0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{doctor.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {doctor.specialty} • {doctor.experience}
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {doctor.email}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${doctor.status === 'Pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {doctor.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                                        <span className="text-xs text-gray-500">Applied: {doctor.date}</span>
                                        <div className="flex items-center space-x-2">
                                            <button className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center space-x-1">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Approve</span>
                                            </button>
                                            <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center space-x-1">
                                                <XCircle className="w-3 h-3" />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Doctors On Duty */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Activity className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-gray-800">Doctors On Duty</h3>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Schedule</button>
                        </div>
                        <div className="space-y-3">
                            {onDutyDoctors.map((doctor) => (
                                <div key={doctor.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {doctor.name.split(' ')[1][0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{doctor.name}</p>
                                                <p className="text-sm text-gray-600">{doctor.specialty}</p>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <p className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {doctor.shift}
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        Room {doctor.room}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.available ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {doctor.available ? 'Available' : 'Busy'}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">
                                                <span className="font-semibold text-purple-600">{doctor.patients}</span> patients
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Today's Appointments */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Today's Appointments</h3>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Patient</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Doctor</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayAppointments.map((apt) => (
                                    <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-600">{apt.id}</td>
                                        <td className="py-4 px-4 text-sm font-medium text-gray-800">{apt.patient}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{apt.doctor}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600 flex items-center">
                                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                            {apt.time}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{apt.department}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{apt.type}</td>
                                        <td className="py-4 px-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    apt.status === 'Confirmed'
                                                        ? 'bg-green-100 text-green-600'
                                                        : apt.status === 'In Progress'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : apt.status === 'Waiting'
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HMSDashboard;
