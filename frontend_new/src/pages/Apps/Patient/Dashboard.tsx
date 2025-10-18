import React, { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area } from 'recharts';
import {
    Calendar,
    Clock,
    Activity,
    Heart,
    Pill,
    FileText,
    Bell,
    Video,
    MessageSquare,
    Thermometer,
    Droplet,
    User,
    Phone,
    Mail,
    MapPin,
    Download,
    Upload,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Plus,
    ChevronRight,
    Stethoscope,
    ClipboardList,
    Award,
    Target,
    Zap,
    Moon,
    Sun,
    Utensils,
    Dumbbell,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';

const PatientDashboard = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Patient Dashboard'));
    }, [dispatch]);

    // Patient Information
    const patientInfo = {
        name: 'Priya Sharma',
        age: 32,
        gender: 'Female',
        bloodGroup: 'O+',
        height: '165 cm',
        weight: '62 kg',
        bmi: '22.8',
        email: 'priya.sharma@email.com',
        phone: '+91 98765 43210',
        address: 'Mumbai, Maharashtra',
        emergencyContact: '+91 98765 43211',
        patientId: 'PT2024-00542',
    };

    // Current Health Status
    const currentVitals = {
        heartRate: { value: 72, unit: 'bpm', status: 'normal', trend: 'stable' },
        bloodPressure: { value: '120/80', unit: 'mmHg', status: 'normal', trend: 'stable' },
        temperature: { value: 98.4, unit: '°F', status: 'normal', trend: 'stable' },
        oxygenLevel: { value: 98, unit: '%', status: 'normal', trend: 'stable' },
        glucose: { value: 95, unit: 'mg/dL', status: 'normal', trend: 'improving' },
        weight: { value: 62, unit: 'kg', status: 'normal', trend: 'stable' },
    };

    const upcomingAppointments = [
        {
            id: 'APT001',
            doctor: 'Dr. Sarah Mitchell',
            specialty: 'Cardiologist',
            date: '2024-10-18',
            time: '10:00 AM',
            type: 'Follow-up',
            location: 'Cardiology Dept - Room 301',
            status: 'confirmed',
            mode: 'in-person',
        },
        {
            id: 'APT002',
            doctor: 'Dr. Rajesh Kumar',
            specialty: 'General Physician',
            date: '2024-10-22',
            time: '02:30 PM',
            type: 'Consultation',
            location: 'Virtual',
            status: 'confirmed',
            mode: 'video',
        },
        {
            id: 'APT003',
            doctor: 'Dr. Meera Patel',
            specialty: 'Nutritionist',
            date: '2024-10-25',
            time: '11:00 AM',
            type: 'Diet Review',
            location: 'Nutrition Clinic',
            status: 'pending',
            mode: 'in-person',
        },
    ];

    // Active Medications
    const medications = [
        {
            id: 'MED001',
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'Once daily',
            timing: 'Morning',
            startDate: '2024-09-01',
            endDate: '2024-12-01',
            prescribedBy: 'Dr. Sarah Mitchell',
            purpose: 'Blood Pressure',
            compliance: 95,
            nextDose: 'Tomorrow 8:00 AM',
        },
        {
            id: 'MED002',
            name: 'Vitamin D3',
            dosage: '2000 IU',
            frequency: 'Once daily',
            timing: 'Morning',
            startDate: '2024-08-15',
            endDate: 'Ongoing',
            prescribedBy: 'Dr. Rajesh Kumar',
            purpose: 'Vitamin Supplement',
            compliance: 88,
            nextDose: 'Tomorrow 8:00 AM',
        },
        {
            id: 'MED003',
            name: 'Omega-3',
            dosage: '1000mg',
            frequency: 'Twice daily',
            timing: 'Morning & Evening',
            startDate: '2024-09-10',
            endDate: '2024-11-10',
            prescribedBy: 'Dr. Meera Patel',
            purpose: 'Heart Health',
            compliance: 92,
            nextDose: 'Today 8:00 PM',
        },
    ];

    // Medical Records
    const medicalRecords = [
        {
            id: 'REC001',
            type: 'Lab Report',
            title: 'Complete Blood Count',
            date: '2024-10-10',
            doctor: 'Dr. Sarah Mitchell',
            status: 'Normal',
            category: 'Blood Test',
        },
        {
            id: 'REC002',
            type: 'Imaging',
            title: 'Chest X-Ray',
            date: '2024-10-05',
            doctor: 'Dr. Rajesh Kumar',
            status: 'Normal',
            category: 'Radiology',
        },
        {
            id: 'REC003',
            type: 'Prescription',
            title: 'Cardiovascular Medications',
            date: '2024-09-01',
            doctor: 'Dr. Sarah Mitchell',
            status: 'Active',
            category: 'Prescription',
        },
        {
            id: 'REC004',
            type: 'Report',
            title: 'Annual Health Checkup',
            date: '2024-08-20',
            doctor: 'Dr. Rajesh Kumar',
            status: 'Reviewed',
            category: 'General',
        },
    ];

    // Health Tracking Data (Last 7 days)
    const healthTrackingData = [
        { day: 'Mon', heartRate: 68, steps: 8500, calories: 2100, sleep: 7.5, water: 8 },
        { day: 'Tue', heartRate: 72, steps: 9200, calories: 2050, sleep: 7.0, water: 7 },
        { day: 'Wed', heartRate: 70, steps: 10500, calories: 2200, sleep: 8.0, water: 9 },
        { day: 'Thu', heartRate: 71, steps: 7800, calories: 1950, sleep: 6.5, water: 6 },
        { day: 'Fri', heartRate: 69, steps: 11200, calories: 2300, sleep: 7.5, water: 8 },
        { day: 'Sat', heartRate: 73, steps: 12500, calories: 2400, sleep: 8.5, water: 10 },
        { day: 'Sun', heartRate: 72, steps: 9800, calories: 2150, sleep: 8.0, water: 8 },
    ];

    // Weight Tracking (Last 30 days)
    const weightData = [
        { week: 'Week 1', weight: 64.5 },
        { week: 'Week 2', weight: 64.0 },
        { week: 'Week 3', weight: 63.2 },
        { week: 'Week 4', weight: 62.5 },
        { week: 'Week 5', weight: 62.0 },
    ];

    // Health Goals
    const healthGoals = [
        { id: 1, goal: 'Walk 10,000 steps daily', progress: 85, target: 100, unit: '%' },
        { id: 2, goal: 'Maintain BP below 130/85', progress: 100, target: 100, unit: '%' },
        { id: 3, goal: 'Drink 8 glasses of water', progress: 75, target: 100, unit: '%' },
        { id: 4, goal: 'Sleep 7-8 hours', progress: 90, target: 100, unit: '%' },
    ];

    type VitalCardProps = {
        title: string;
        value: string | number;
        unit: string;
        icon: React.ElementType;
        color: string;
        status: string;
        trend: string;
    };

    const VitalCard: React.FC<VitalCardProps> = ({ title, value, unit, icon: Icon, color, status, trend }) => (
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                    {trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${status === 'normal' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{status}</span>
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">
                {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
            </p>
            <p className="text-sm text-gray-600 font-medium mt-1">{title}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Health Tips */}
            <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2 flex items-center">
                            <Award className="w-6 h-6 mr-2" />
                            Health Tip of the Day
                        </h3>
                        <p className="text-blue-100 mb-4">
                            Regular physical activity helps maintain healthy blood pressure and heart function. Aim for at least 30 minutes of moderate exercise daily.
                        </p>
                        <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium">Learn More</button>
                    </div>
                    <Sun className="w-16 h-16 text-yellow-300 opacity-50" />
                </div>
            </div>
            <main className="p-6">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                    {/* Upcoming Appointments */}
                    <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-gray-800">Upcoming Appointments</h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">{upcomingAppointments.length}</span>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View All</button>
                        </div>
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                <Stethoscope className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{apt.doctor}</p>
                                                <p className="text-sm text-gray-600">{apt.specialty}</p>
                                                <div className="flex items-center space-x-3 mt-2">
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {apt.date}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {apt.time}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {apt.location}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-2">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${apt.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}
                                            >
                                                {apt.status}
                                            </span>
                                            {apt.mode === 'video' && <Video className="w-5 h-5 text-blue-600" />}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-3 border-t border-blue-200">
                                        <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">View Details</button>
                                        <button className="px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                                            Reschedule
                                        </button>
                                        {apt.mode === 'video' && (
                                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1">
                                                <Video className="w-4 h-4" />
                                                <span>Join</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Health Goals */}
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center space-x-2">
                                <Target className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-gray-800">Health Goals</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {healthGoals.map((goal) => (
                                <div key={goal.id} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-gray-800">{goal.goal}</p>
                                        <span className="text-sm font-bold text-purple-600">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${goal.progress >= 80 ? 'bg-green-500' : goal.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${goal.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Add New Goal</span>
                        </button>
                    </div>
                </div>

                {/* Health Tracking Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    {/* Activity Tracking */}
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <Dumbbell className="w-5 h-5 mr-2 text-green-600" />
                            Activity Tracking (7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={healthTrackingData}>
                                <defs>
                                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="day" stroke="#666" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Area type="monotone" dataKey="steps" stroke="#10B981" fillOpacity={1} fill="url(#colorSteps)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Weight Trend */}
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <TrendingDown className="w-5 h-5 mr-2 text-blue-600" />
                            Weight Trend (5 Weeks)
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={weightData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="week" stroke="#666" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#666" style={{ fontSize: '12px' }} domain={[60, 66]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Active Medications and Medical Records */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Active Medications */}
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center space-x-2">
                                <Pill className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-bold text-gray-800">Active Medications</h3>
                                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">{medications.length}</span>
                            </div>
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">View All</button>
                        </div>
                        <div className="space-y-4">
                            {medications.map((med) => (
                                <div key={med.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-lg">{med.name}</p>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {med.dosage} • {med.frequency}
                                            </p>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {med.timing}
                                                </span>
                                                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">{med.purpose}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">Prescribed by: {med.prescribedBy}</p>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-green-200">
                                        <div>
                                            <p className="text-xs text-gray-500">Compliance</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${med.compliance}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-800">{med.compliance}%</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Next Dose</p>
                                            <p className="text-xs font-medium text-gray-800">{med.nextDose}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medical Records */}
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center space-x-2">
                                <FileText className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-bold text-gray-800">Medical Records</h3>
                            </div>
                            <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">View All</button>
                        </div>
                        <div className="space-y-3">
                            {medicalRecords.map((record) => (
                                <div key={record.id} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:shadow-md transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{record.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">{record.date}</p>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">{record.category}</span>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${record.status === 'Normal' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {record.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors">
                                            <Download className="w-4 h-4 text-orange-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2">
                            <Upload className="w-5 h-5" />
                            <span>Upload New Record</span>
                        </button>
                    </div>
                </div>

                {/* Daily Health Summary */}
                <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-yellow-600" />
                            <h3 className="text-lg font-bold text-gray-800">Daily Health Summary</h3>
                        </div>
                        <span className="text-sm text-gray-600">Last updated: Today, 2:30 PM</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-4 border-2 border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <Dumbbell className="w-8 h-8 text-blue-600" />
                                <span className="text-2xl font-bold text-blue-600">9,800</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Steps Today</p>
                            <p className="text-xs text-gray-500 mt-1">Goal: 10,000 steps</p>
                            <div className="w-full h-1.5 bg-blue-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: '98%' }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-4 border-2 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                                <Droplet className="w-8 h-8 text-green-600" />
                                <span className="text-2xl font-bold text-green-600">8</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Water Intake</p>
                            <p className="text-xs text-gray-500 mt-1">Goal: 8 glasses</p>
                            <div className="w-full h-1.5 bg-green-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-green-600" style={{ width: '100%' }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl p-4 border-2 border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                                <Moon className="w-8 h-8 text-purple-600" />
                                <span className="text-2xl font-bold text-purple-600">7.5h</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Sleep Duration</p>
                            <p className="text-xs text-gray-500 mt-1">Goal: 7-8 hours</p>
                            <div className="w-full h-1.5 bg-purple-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-purple-600" style={{ width: '94%' }}></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl p-4 border-2 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                                <Utensils className="w-8 h-8 text-orange-600" />
                                <span className="text-2xl font-bold text-orange-600">2,150</span>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Calories</p>
                            <p className="text-xs text-gray-500 mt-1">Goal: 2,000-2,200 cal</p>
                            <div className="w-full h-1.5 bg-orange-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-orange-600" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="bg-white hover:bg-blue-50 rounded-xl p-6 shadow-md border-2 border-blue-200 transition-all group">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800">Book Appointment</p>
                                <p className="text-xs text-gray-500">Schedule with doctor</p>
                            </div>
                        </div>
                    </button>

                    <button className="bg-white hover:bg-green-50 rounded-xl p-6 shadow-md border-2 border-green-200 transition-all group">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <Video className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800">Video Consultation</p>
                                <p className="text-xs text-gray-500">Connect with doctor</p>
                            </div>
                        </div>
                    </button>

                    <button className="bg-white hover:bg-purple-50 rounded-xl p-6 shadow-md border-2 border-purple-200 transition-all group">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                                <MessageSquare className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800">Message Doctor</p>
                                <p className="text-xs text-gray-500">Send a message</p>
                            </div>
                        </div>
                    </button>

                    <button className="bg-white hover:bg-orange-50 rounded-xl p-6 shadow-md border-2 border-orange-200 transition-all group">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <ClipboardList className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-800">View Reports</p>
                                <p className="text-xs text-gray-500">Access medical records</p>
                            </div>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;
