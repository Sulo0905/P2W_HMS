import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obstetricsAPI } from '../../../services/healthlogs.service';

const ObstetricsProgress = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [progress, setProgress] = useState(null);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatientAndProgress();
    }, [id]);

    const fetchPatientAndProgress = async () => {
        try {
            setLoading(true);
            // Pull patient, progress summary, and recent logs for better consistency calculation
            const [patientResponse, progressResponse, logsResponse] = await Promise.all([
                obstetricsAPI.getPatientById(id),
                obstetricsAPI.getProgress(id),
                obstetricsAPI.listLogs(id, { limit: 500, page: 1 }),
            ]);
            setPatient(patientResponse.data.data);
            // Handle progress response structure
            const progressData = progressResponse.data.data;
            setProgress(progressData?.progress || progressData);
            // Handle logs response structure
            const logsData = logsResponse?.data?.data?.logs;
            setRecentLogs(Array.isArray(logsData) ? logsData : []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch progress data');
            console.error('Error fetching progress:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getTrimesterInfo = (trimester) => {
        const trimesterInfo = {
            1: { name: 'First Trimester', weeks: '1-12', color: 'bg-pink-100 text-pink-800' },
            2: { name: 'Second Trimester', weeks: '13-26', color: 'bg-blue-100 text-blue-800' },
            3: { name: 'Third Trimester', weeks: '27-40', color: 'bg-green-100 text-green-800' },
        };
        return trimesterInfo[trimester] || { name: 'Unknown', weeks: '', color: 'bg-gray-100 text-gray-800' };
    };

    const getProgressPercentage = () => {
        if (!patient || !progress) return 0;
        const totalWeeks = 40;
        const currentWeek = Math.min(progress.currentWeek, totalWeeks);
        return Math.round((currentWeek / totalWeeks) * 100);
    };

    const getDaysUntilDue = () => {
        if (!progress) return 0;
        return Math.max(0, progress.daysUntilDue);
    };

    const getStatusColor = (status) => {
        const colors = {
            on_track: 'text-green-600',
            behind: 'text-yellow-600',
            overdue: 'text-red-600',
        };
        return colors[status] || 'text-gray-600';
    };

    // Derive tracking consistency from recent activity
    // Rules:
    // - Compute average logs/week in the last 4 weeks.
    // - Compute active-day streak (consecutive days with at least 1 log) up to today.
    // Rating:
    //   Excellent: avg >= 3 logs/week OR streak >= 7 days
    //   Good: avg >= 1.5 logs/week OR streak >= 3 days
    //   Needs Improvement: otherwise
    const getTrackingConsistency = () => {
        if (!recentLogs || recentLogs.length === 0) {
            return { label: 'Needs Improvement', color: 'text-red-600', hint: 'No recent activity. Try logging at least twice per week.' };
        }

        // Normalize timestamps and filter to last 28 days
        const now = new Date();
        const from = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        const logsLast28 = recentLogs
            .map((l) => new Date(l.loggedAt || l.createdAt))
            .filter((d) => !isNaN(d.getTime()) && d >= from && d <= now)
            .sort((a, b) => a - b);

        const weeks = 4;
        const avgPerWeek = logsLast28.length / weeks;

        // Build a set of activity days (YYYY-MM-DD)
        const dayKey = (d) => d.toISOString().slice(0, 10);
        const daySet = new Set(logsLast28.map(dayKey));

        // Compute streak ending today
        let streak = 0;
        for (let i = 0; i < 14; i++) {
            // check up to 2 weeks back for streak
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            if (daySet.has(dayKey(d))) streak++;
            else break;
        }

        if (avgPerWeek >= 3 || streak >= 7) return { label: 'Excellent', color: 'text-green-600', hint: 'Great job! Keep up the regular updates.' };
        if (avgPerWeek >= 1.5 || streak >= 3) return { label: 'Good', color: 'text-yellow-600', hint: 'Good consistency. Aim for 3+ logs per week.' };
        return { label: 'Needs Improvement', color: 'text-red-600', hint: 'Try logging at least 2 times per week to improve consistency.' };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link to="/obstetrics" className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300">
                    <span className="mr-1">←</span> Back
                </Link>
            </div>

            {patient && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{patient.name} - Pregnancy Progress</h1>
                    <p className="text-gray-600">
                        Due Date: {formatDate(patient.dueDate)} | Pregnancy #{patient.pregnancyNumber}
                    </p>
                </div>
            )}

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            {progress && (
                <div className="space-y-6">
                    {/* Top Row - Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pregnancy Progress */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pregnancy Progress</h3>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-pink-600 mb-2">Week {progress.currentWeek}</div>
                                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                                    <div className="bg-gradient-to-r from-pink-500 to-blue-500 h-4 rounded-full transition-all duration-300" style={{ width: `${getProgressPercentage()}%` }}></div>
                                </div>
                                <p className="text-sm text-gray-600">{getProgressPercentage()}% complete</p>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3 ${getTrimesterInfo(progress.trimester).color}`}>
                                    {getTrimesterInfo(progress.trimester).name}
                                </div>
                            </div>
                        </div>

                        {/* Due Date Countdown */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Due Date</h3>
                            <div className="text-center">
                                <div className="text-4xl mb-2">📅</div>
                                <div className="text-3xl font-bold text-blue-600 mb-2">{getDaysUntilDue()}</div>
                                <p className="text-sm text-gray-600 mb-3">days remaining</p>
                                {progress.isOverdue ? (
                                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">⚠️ Overdue by {Math.abs(progress.daysUntilDue)} days</div>
                                ) : (
                                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">✅ On Track</div>
                                )}
                            </div>
                        </div>

                        {/* Activity Summary */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Total Logs</span>
                                    <span className="text-lg font-semibold text-gray-900">{progress.totalLogs}</span>
                                </div>
                                {progress.lastLogDate && (
                                    <div>
                                        <span className="text-sm text-gray-500">Last Entry</span>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(progress.lastLogDate)}</p>
                                    </div>
                                )}
                                <div className="pt-2 border-t">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-500">Consistency</span>
                                        <span className={`text-sm font-medium ${getTrackingConsistency().color}`}>{getTrackingConsistency().label}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{getTrackingConsistency().hint}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pregnancy Milestones */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Pregnancy Milestones</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { week: 12, milestone: 'First Trimester Complete', icon: '🎉', completed: progress.currentWeek >= 12 },
                                { week: 20, milestone: 'Halfway Point', icon: '🎯', completed: progress.currentWeek >= 20 },
                                { week: 28, milestone: 'Third Trimester', icon: '🏁', completed: progress.currentWeek >= 28 },
                                { week: 37, milestone: 'Full Term', icon: '👶', completed: progress.currentWeek >= 37 },
                            ].map((milestone, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                        milestone.completed
                                            ? 'border-green-300 bg-green-50'
                                            : progress.currentWeek >= milestone.week - 2
                                            ? 'border-yellow-300 bg-yellow-50'
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-2xl">{milestone.icon}</span>
                                        <span className="text-sm font-medium text-gray-700">Week {milestone.week}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 mb-1">{milestone.milestone}</p>
                                    {milestone.completed && <p className="text-xs text-green-600 font-medium">✓ Completed</p>}
                                    {!milestone.completed && progress.currentWeek >= milestone.week - 2 && <p className="text-xs text-yellow-600 font-medium">⏳ Approaching</p>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link to={`/obstetrics/${id}/logs`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="text-2xl">➕</div>
                                <div>
                                    <p className="font-medium text-gray-900">Add New Log</p>
                                    <p className="text-sm text-gray-500">Record symptoms</p>
                                </div>
                            </Link>

                            <Link to={`/obstetrics/${id}/timeline`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="text-2xl">📅</div>
                                <div>
                                    <p className="font-medium text-gray-900">View Timeline</p>
                                    <p className="text-sm text-gray-500">Journey history</p>
                                </div>
                            </Link>

                            <Link to={`/obstetrics/${id}`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="text-2xl">👤</div>
                                <div>
                                    <p className="font-medium text-gray-900">Patient Profile</p>
                                    <p className="text-sm text-gray-500">Complete details</p>
                                </div>
                            </Link>

                            <Link to="/obstetrics" className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="text-2xl">📋</div>
                                <div>
                                    <p className="font-medium text-gray-900">All Patients</p>
                                    <p className="text-sm text-gray-500">Patient list</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ObstetricsProgress;
