import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entAPI } from '../../../services/healthlogs.service';

const EntProgress = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching ENT progress for patient ID:', id);

                // First get patient data
                const patientResponse = await entAPI.getPatientById(id);
                console.log('Patient response:', patientResponse.data);
                setPatient(patientResponse.data.data);

                // Then get logs data
                const logsResponse = await entAPI.listLogs(id, { page: 1, limit: 500 });
                console.log('Logs response:', logsResponse.data);

                const logsData = logsResponse.data.data?.logs;
                console.log('Extracted logs data:', logsData);
                setLogs(Array.isArray(logsData) ? logsData : []);
            } catch (err) {
                console.error('Error fetching ENT progress:', err);
                console.error('Error response:', err.response?.data);
                console.error('Error status:', err.response?.status);

                let errorMessage = 'Failed to fetch progress';
                if (err.response?.status === 404) {
                    errorMessage = 'Patient not found';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(`Failed to fetch progress: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatDate = (d) => new Date(d).toLocaleDateString();
    const formatDateTime = (d) => new Date(d).toLocaleString();

    // Enhanced metrics calculations
    const painMetrics = (() => {
        const painLogs = logs.filter((x) => x.logType === 'pain_level' && typeof x.painLevel === 'number');
        if (!painLogs.length) return { avg: null, trend: null, latest: null, count: 0 };

        const values = painLogs.map((x) => x.painLevel);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);

        // Calculate trend (last 3 vs previous 3)
        const recent = values.slice(-3);
        const previous = values.slice(-6, -3);
        let trend = 'stable';
        if (recent.length >= 2 && previous.length >= 2) {
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
            if (recentAvg < prevAvg - 0.5) trend = 'improving';
            else if (recentAvg > prevAvg + 0.5) trend = 'worsening';
        }

        return {
            avg,
            trend,
            latest: values[values.length - 1],
            count: painLogs.length,
            latestDate: painLogs[painLogs.length - 1]?.loggedAt || painLogs[painLogs.length - 1]?.createdAt,
        };
    })();

    const recoveryMetrics = (() => {
        const totalLogs = logs.length;
        const recentLogs = logs.filter((log) => {
            const logDate = new Date(log.loggedAt || log.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return logDate >= weekAgo;
        });

        const medsCount = logs.filter((x) => x.logType === 'medication').length;
        const issuesCount = logs.filter((x) => x.logType === 'breathing_issues' && x.breathingIssues?.hasIssues).length;
        const healingCount = logs.filter((x) => x.logType === 'healing_progress').length;

        // Calculate days since surgery
        const surgeryDate = patient?.surgeryDate ? new Date(patient.surgeryDate) : null;
        const daysSinceSurgery = surgeryDate ? Math.floor((Date.now() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

        return {
            totalLogs,
            recentActivity: recentLogs.length,
            medsCount,
            issuesCount,
            healingCount,
            daysSinceSurgery,
            consistency: totalLogs > 0 ? Math.min(100, Math.round((recentLogs.length / 7) * 100)) : 0,
        };
    })();

    const getRecoveryStage = () => {
        if (!recoveryMetrics.daysSinceSurgery) return { stage: 'Unknown', color: 'gray', description: 'Surgery date not available' };

        const days = recoveryMetrics.daysSinceSurgery;
        if (days <= 3) return { stage: 'Immediate Recovery', color: 'red', description: 'Critical healing period' };
        if (days <= 7) return { stage: 'Early Recovery', color: 'orange', description: 'Initial healing phase' };
        if (days <= 14) return { stage: 'Active Recovery', color: 'yellow', description: 'Progressive healing' };
        if (days <= 30) return { stage: 'Late Recovery', color: 'blue', description: 'Stabilization phase' };
        return { stage: 'Maintenance', color: 'green', description: 'Long-term monitoring' };
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving':
                return '📈';
            case 'worsening':
                return '📉';
            default:
                return '➡️';
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'improving':
                return 'text-green-600';
            case 'worsening':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link to="/ent" className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300">
                    <span className="mr-1">←</span> Back
                </Link>
            </div>

            {patient && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{patient.name} - Recovery Progress</h1>
                    <p className="text-gray-600">
                        Surgery: {patient.surgeryType || '-'}
                        {patient.surgeryDate ? ` • ${formatDate(patient.surgeryDate)}` : ''}
                    </p>
                </div>
            )}

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recovery Stage */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recovery Stage</h2>
                    <div className="text-center">
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-${getRecoveryStage().color}-100 text-${getRecoveryStage().color}-800 mb-3`}>
                            {getRecoveryStage().stage}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{getRecoveryStage().description}</p>
                        {recoveryMetrics.daysSinceSurgery && (
                            <div className="text-2xl font-bold text-gray-900">
                                Day {recoveryMetrics.daysSinceSurgery}
                                <div className="text-sm font-normal text-gray-500">post-surgery</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pain Analysis */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Pain Analysis</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Current Level</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-red-600">{painMetrics.latest ?? '-'}/10</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Average</span>
                            <span className="text-lg font-semibold text-gray-900">{painMetrics.avg ?? '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Trend</span>
                            <div className="flex items-center space-x-1">
                                <span className={`text-sm font-medium ${getTrendColor(painMetrics.trend)}`}>{painMetrics.trend}</span>
                                <span>{getTrendIcon(painMetrics.trend)}</span>
                            </div>
                        </div>
                        {painMetrics.latestDate && <div className="text-xs text-gray-400 pt-2 border-t">Last recorded: {formatDateTime(painMetrics.latestDate)}</div>}
                    </div>
                </div>

                {/* Activity Summary */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Summary</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Total Logs</span>
                            <span className="text-lg font-semibold text-gray-900">{recoveryMetrics.totalLogs}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">This Week</span>
                            <span className="text-lg font-semibold text-blue-600">{recoveryMetrics.recentActivity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Consistency</span>
                            <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${recoveryMetrics.consistency}%` }}></div>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{recoveryMetrics.consistency}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detailed Metrics */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Metrics</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-blue-50">
                            <div className="text-sm text-blue-600 font-medium">Medications</div>
                            <div className="text-2xl font-bold text-blue-700">{recoveryMetrics.medsCount}</div>
                            <div className="text-xs text-blue-500">Total entries</div>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-50">
                            <div className="text-sm text-yellow-600 font-medium">Breathing Issues</div>
                            <div className="text-2xl font-bold text-yellow-700">{recoveryMetrics.issuesCount}</div>
                            <div className="text-xs text-yellow-500">Reported cases</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-50">
                            <div className="text-sm text-green-600 font-medium">Healing Progress</div>
                            <div className="text-2xl font-bold text-green-700">{recoveryMetrics.healingCount}</div>
                            <div className="text-xs text-green-500">Check-ups logged</div>
                        </div>
                        <div className="p-4 rounded-lg bg-purple-50">
                            <div className="text-sm text-purple-600 font-medium">Pain Entries</div>
                            <div className="text-2xl font-bold text-purple-700">{painMetrics.count}</div>
                            <div className="text-xs text-purple-500">Pain levels tracked</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to={`/ent/${id}/logs`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl">➕</div>
                            <div>
                                <p className="font-medium text-gray-900">Add New Log</p>
                                <p className="text-sm text-gray-500">Record recovery details</p>
                            </div>
                        </Link>
                        <Link to={`/ent/${id}/timeline`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl">📅</div>
                            <div>
                                <p className="font-medium text-gray-900">View Timeline</p>
                                <p className="text-sm text-gray-500">See event history</p>
                            </div>
                        </Link>
                        <Link to={`/ent/${id}`} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-2xl">👤</div>
                            <div>
                                <p className="font-medium text-gray-900">Patient Profile</p>
                                <p className="text-sm text-gray-500">View complete details</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Recovery Milestones */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recovery Milestones</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            day: 1,
                            milestone: 'Surgery Complete',
                            icon: '🏥',
                            completed: recoveryMetrics.daysSinceSurgery >= 1,
                            description: 'Initial recovery begins',
                        },
                        {
                            day: 3,
                            milestone: 'Critical Period',
                            icon: '⚕️',
                            completed: recoveryMetrics.daysSinceSurgery >= 3,
                            description: 'Immediate post-op monitoring',
                        },
                        {
                            day: 7,
                            milestone: 'First Week',
                            icon: '📅',
                            completed: recoveryMetrics.daysSinceSurgery >= 7,
                            description: 'Initial healing phase',
                        },
                        {
                            day: 14,
                            milestone: 'Two Weeks',
                            icon: '🎯',
                            completed: recoveryMetrics.daysSinceSurgery >= 14,
                            description: 'Active recovery phase',
                        },
                        {
                            day: 30,
                            milestone: 'One Month',
                            icon: '🏁',
                            completed: recoveryMetrics.daysSinceSurgery >= 30,
                            description: 'Major healing milestone',
                        },
                        {
                            day: 90,
                            milestone: 'Full Recovery',
                            icon: '✅',
                            completed: recoveryMetrics.daysSinceSurgery >= 90,
                            description: 'Complete healing expected',
                        },
                    ].map((milestone, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                milestone.completed
                                    ? 'border-green-300 bg-green-50'
                                    : recoveryMetrics.daysSinceSurgery >= milestone.day - 2
                                    ? 'border-yellow-300 bg-yellow-50'
                                    : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-2xl">{milestone.icon}</span>
                                <span className="text-sm font-medium text-gray-700">Day {milestone.day}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{milestone.milestone}</h3>
                            <p className="text-xs text-gray-600 mb-2">{milestone.description}</p>
                            {milestone.completed && (
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                                </div>
                            )}
                            {!milestone.completed && recoveryMetrics.daysSinceSurgery >= milestone.day - 2 && (
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs text-yellow-600 font-medium">⏳ Approaching</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EntProgress;
