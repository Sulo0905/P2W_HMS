import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entAPI, obstetricsAPI } from '../../../services/healthlogs.service';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState<{
        totalPatients: number;
        entPatients: number;
        obstetricsPatients: number;
        totalLogs: number;
        recentActivity: any[];
    }>({
        totalPatients: 0,
        entPatients: 0,
        obstetricsPatients: 0,
        totalLogs: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);

    type ChartPoint = {
        date: string;
        ENT: number;
        Obstetrics: number;
        total: number;
    };

    type DistributionItem = {
        name: string;
        value: number;
        color: string;
    };

    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [patientDistribution, setPatientDistribution] = useState<DistributionItem[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch ENT and Obstetrics patients
            const [entResponse, obstetricsResponse] = await Promise.all([entAPI.getAllPatients(), obstetricsAPI.getAllPatients()]);

            const entPatients = entResponse.data.data || [];
            const obstetricsPatients = obstetricsResponse.data.data || [];

            // Calculate statistics
            const totalLogs = entPatients.reduce((sum: number, p: any) => sum + (p.logs?.length || 0), 0) + obstetricsPatients.reduce((sum: number, p: any) => sum + (p.logs?.length || 0), 0);

            // Recent activity (last 10 logs across all patients)
            const allLogs: any[] = [];
            entPatients.forEach((patient: { logs: any[]; name: any; patientId: any }) => {
                if (patient.logs) {
                    patient.logs.forEach((log) => {
                        allLogs.push({
                            ...log,
                            patientName: patient.name,
                            patientType: 'ENT',
                            patientId: patient.patientId,
                        });
                    });
                }
            });

            obstetricsPatients.forEach((patient: { logs: any[]; name: any; patientId: any }) => {
                if (patient.logs) {
                    patient.logs.forEach((log) => {
                        allLogs.push({
                            ...log,
                            patientName: patient.name,
                            patientType: 'Obstetrics',
                            patientId: patient.patientId,
                        });
                    });
                }
            });

            const recentActivity = allLogs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()).slice(0, 10);

            // Chart data for patient registrations over time
            const chartData = generateChartData(entPatients, obstetricsPatients);

            // Patient distribution
            const distribution = [
                { name: 'ENT Patients', value: entPatients.length, color: '#3B82F6' },
                { name: 'Obstetrics Patients', value: obstetricsPatients.length, color: '#EF4444' },
            ];

            setStats({
                totalPatients: entPatients.length + obstetricsPatients.length,
                entPatients: entPatients.length,
                obstetricsPatients: obstetricsPatients.length,
                totalLogs,
                recentActivity,
            });

            setChartData(chartData);
            setPatientDistribution(distribution);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    interface Patient {
        createdAt?: string | null;
        [key: string]: any;
    }

    const generateChartData = (entPatients: Patient[], obstetricsPatients: Patient[]): ChartPoint[] => {
        const last7Days: ChartPoint[] = [];
        for (let i = 6; i >= 0; i--) {
            const date: Date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr: string = date.toISOString().split('T')[0];

            const entCount: number = entPatients.filter((p) => p.createdAt && p.createdAt.split('T')[0] === dateStr).length;

            const obsCount: number = obstetricsPatients.filter((p) => p.createdAt && p.createdAt.split('T')[0] === dateStr).length;

            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                ENT: entCount,
                Obstetrics: obsCount,
                total: entCount + obsCount,
            });
        }
        return last7Days;
    };

    const StatCard = ({ title, value, icon, color, trend }: { title: string; value: number | string; icon: React.ReactNode; color: string; trend?: string }) => (
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-600">{title}</p>
                    <p className="text-3xl font-bold text-neutral-900 mt-2">{value}</p>
                    {trend && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {trend}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
            </div>
        </Card>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">Healthcare Dashboard</h1>
                    <p className="text-neutral-600">Comprehensive overview of patient health management and progress tracking</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Patients"
                        value={stats.totalPatients}
                        trend="+12% this month"
                        color="bg-blue-100"
                        icon={
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        title="ENT Patients"
                        value={stats.entPatients}
                        trend="+8% this week"
                        color="bg-green-100"
                        icon={
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Obstetrics Patients"
                        value={stats.obstetricsPatients}
                        trend="+15% this week"
                        color="bg-pink-100"
                        icon={
                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Total Health Logs"
                        value={stats.totalLogs}
                        trend="+25% this month"
                        color="bg-purple-100"
                        icon={
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                        }
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Patient Registration Trends */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Patient Registration Trends (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="ENT" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="Obstetrics" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Patient Distribution */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Patient Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={patientDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {patientDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Quick Actions and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/register" className="flex items-center p-3 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors group">
                                <div className="p-2 rounded-lg bg-primary-600 text-white mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Register New Patient</p>
                                    <p className="text-sm text-neutral-600">Add a new patient to the system</p>
                                </div>
                            </Link>

                            <Link to="/ent" className="flex items-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group">
                                <div className="p-2 rounded-lg bg-green-600 text-white mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">ENT Health Logs</p>
                                    <p className="text-sm text-neutral-600">Otolaryngology patient management</p>
                                </div>
                            </Link>

                            <Link to="/obstetrics" className="flex items-center p-3 rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors group">
                                <div className="p-2 rounded-lg bg-pink-600 text-white mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Obstetrics Care</p>
                                    <p className="text-sm text-neutral-600">Maternal and fetal health monitoring</p>
                                </div>
                            </Link>

                            <Link to="/reports" className="flex items-center p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group">
                                <div className="p-2 rounded-lg bg-purple-600 text-white mr-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-neutral-900">Analytics & Reports</p>
                                    <p className="text-sm text-neutral-600">View comprehensive reports</p>
                                </div>
                            </Link>
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="p-6 lg:col-span-2">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors">
                                        <div className={`p-2 rounded-lg mr-3 ${activity.patientType === 'ENT' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-600'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-neutral-900">
                                                {activity.patientName} - {activity.logType.replace('_', ' ').toUpperCase()}
                                            </p>
                                            <p className="text-sm text-neutral-600">
                                                {activity.patientType} • {new Date(activity.loggedAt).toLocaleDateString()} •{activity.loggedBy && ` by ${activity.loggedBy}`}
                                            </p>
                                        </div>
                                        <Badge variant={activity.patientType === 'ENT' ? 'success' : 'warning'} size="sm">
                                            {activity.patientType}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-neutral-500">
                                    <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p>No recent activity found</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
