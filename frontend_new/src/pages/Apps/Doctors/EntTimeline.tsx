import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { entAPI } from '../../../services/healthlogs.service';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EntTimeline = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('timeline'); // timeline or chart
    const [painTrendData, setPainTrendData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching ENT timeline for patient ID:', id);

                // First get patient data
                const patientResponse = await entAPI.getPatientById(id);
                console.log('Patient response:', patientResponse.data);
                setPatient(patientResponse.data.data);

                // Then get logs data
                const logsResponse = await entAPI.listLogs(id, { page: 1, limit: 500 });
                console.log('Logs response:', logsResponse.data);

                const logsData = logsResponse.data.data?.logs;
                console.log('Extracted logs data:', logsData);

                const items = (Array.isArray(logsData) ? logsData : []).slice().sort((a, b) => new Date(a.loggedAt || a.createdAt) - new Date(b.loggedAt || b.createdAt));
                setLogs(items);

                // Generate pain trend data for charts
                const painData = items
                    .filter((log) => log.logType === 'pain_level' && log.painLevel !== undefined)
                    .map((log) => ({
                        date: new Date(log.loggedAt).toLocaleDateString(),
                        painLevel: parseInt(log.painLevel),
                        time: new Date(log.loggedAt).toLocaleTimeString(),
                    }));
                setPainTrendData(painData);
            } catch (err) {
                console.error('Error fetching ENT timeline:', err);
                console.error('Error response:', err.response?.data);
                console.error('Error status:', err.response?.status);
                console.error('Request URL:', err.config?.url);

                let errorMessage = 'Failed to fetch timeline';
                if (err.response?.status === 404) {
                    errorMessage = 'Patient not found';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.message) {
                    errorMessage = err.message;
                }

                setError(`Failed to fetch timeline: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatDate = (d) => new Date(d).toLocaleDateString();
    const formatDateTime = (d) => new Date(d).toLocaleString();

    const getLogTypeLabel = (t) =>
        ({
            pain_level: 'Pain Level',
            breathing_issues: 'Breathing Issues',
            medication: 'Medication',
            healing_progress: 'Healing Progress',
        }[t] || t);

    const getLogTypeColor = (type) =>
        ({
            pain_level: 'bg-red-100 text-red-800 border-red-200',
            breathing_issues: 'bg-blue-100 text-blue-800 border-blue-200',
            medication: 'bg-green-100 text-green-800 border-green-200',
            healing_progress: 'bg-purple-100 text-purple-800 border-purple-200',
        }[type] || 'bg-neutral-100 text-neutral-800 border-neutral-200');

    const getLogTypeIcon = (type) => {
        const iconClass = 'w-5 h-5';
        switch (type) {
            case 'pain_level':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'breathing_issues':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                );
            case 'medication':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                    </svg>
                );
            case 'healing_progress':
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                );
        }
    };

    const filteredLogs = filterType === 'all' ? logs : logs.filter((log) => log.logType === filterType);

    const logTypes = [...new Set(logs.map((log) => log.logType))];
    const logTypeCounts = logTypes.reduce((acc, type) => {
        acc[type] = logs.filter((log) => log.logType === type).length;
        return acc;
    }, {});

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center space-x-4">
                            <Link to="/ent">
                                <Button variant="secondary" size="sm">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to ENT Patients
                                </Button>
                            </Link>
                            {patient && (
                                <div>
                                    <h1 className="text-3xl font-bold text-neutral-900">{patient.name} - Recovery Timeline</h1>
                                    <p className="text-neutral-600 mt-1">
                                        {patient.surgeryType || 'Surgery'} {patient.surgeryDate && `• ${formatDate(patient.surgeryDate)}`}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-3 mt-4 md:mt-0">
                            <Link to={`/ent/${id}/profile`}>
                                <Button variant="secondary" size="sm">
                                    Profile
                                </Button>
                            </Link>
                            <Link to={`/ent/${id}/logs`}>
                                <Button variant="secondary" size="sm">
                                    All Logs
                                </Button>
                            </Link>
                            <Link to={`/ent/${id}/progress`}>
                                <Button size="sm">Progress Report</Button>
                            </Link>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

                    {/* Statistics Cards */}
                    {logs.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="p-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-neutral-900">{logs.length}</div>
                                    <div className="text-sm text-neutral-600">Total Logs</div>
                                </div>
                            </Card>
                            {Object.entries(logTypeCounts).map(([type, count]) => (
                                <Card key={type} className="p-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-neutral-900">{count}</div>
                                        <div className="text-sm text-neutral-600">{getLogTypeLabel(type)}</div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* View Controls */}
                    {logs.length > 0 && (
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-neutral-700">View:</span>
                                        <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                                            <button
                                                onClick={() => setViewMode('timeline')}
                                                className={`px-3 py-1 text-sm font-medium transition-colors ${
                                                    viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                                }`}
                                            >
                                                Timeline
                                            </button>
                                            <button
                                                onClick={() => setViewMode('chart')}
                                                className={`px-3 py-1 text-sm font-medium transition-colors ${
                                                    viewMode === 'chart' ? 'bg-primary-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'
                                                }`}
                                            >
                                                Charts
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-neutral-700">Filter:</span>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="border border-neutral-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="all">All Types ({logs.length})</option>
                                        {logTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {getLogTypeLabel(type)} ({logTypeCounts[type]})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Content */}
                    {logs.length > 0 ? (
                        <>
                            {/* Chart View */}
                            {viewMode === 'chart' && painTrendData.length > 0 && (
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pain Level Trend</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={painTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis domain={[0, 10]} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="painLevel" stroke="#EF4444" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Card>
                            )}

                            {/* Timeline View */}
                            {viewMode === 'timeline' && (
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                                        Recovery Timeline
                                        {filterType !== 'all' && <span className="ml-2 text-sm font-normal text-neutral-600">- {getLogTypeLabel(filterType)} only</span>}
                                    </h3>

                                    <div className="relative">
                                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-300"></div>
                                        <div className="space-y-6">
                                            {filteredLogs.map((log, index) => (
                                                <div key={log._id} className="relative flex items-start">
                                                    <div
                                                        className={`flex-shrink-0 w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center ${getLogTypeColor(
                                                            log.logType
                                                        )}`}
                                                    >
                                                        {getLogTypeIcon(log.logType)}
                                                    </div>
                                                    <div className="ml-6 flex-1">
                                                        <Card className="p-4 hover:shadow-md transition-shadow">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex items-center space-x-3">
                                                                    <h4 className="text-lg font-semibold text-neutral-900">{getLogTypeLabel(log.logType)}</h4>
                                                                    <Badge variant="outline" size="sm">
                                                                        #{filteredLogs.length - index}
                                                                    </Badge>
                                                                </div>
                                                                <div className="text-sm text-neutral-500">{formatDateTime(log.loggedAt || log.createdAt)}</div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                {log.logType === 'pain_level' && typeof log.painLevel === 'number' && (
                                                                    <div className="flex items-center space-x-3">
                                                                        <span className="text-sm font-medium text-neutral-700">Pain Level:</span>
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className="flex space-x-1">
                                                                                {[...Array(10)].map((_, i) => (
                                                                                    <div key={i} className={`w-3 h-3 rounded-full ${i < log.painLevel ? 'bg-red-500' : 'bg-neutral-200'}`} />
                                                                                ))}
                                                                            </div>
                                                                            <span className="text-lg font-bold text-red-600">{log.painLevel}/10</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {log.logType === 'breathing_issues' && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-sm font-medium text-neutral-700">Status:</span>
                                                                            <Badge variant={log.breathingIssues?.hasIssues ? 'warning' : 'success'} size="sm">
                                                                                {log.breathingIssues?.hasIssues ? `${log.breathingIssues.severity} issues` : 'No issues'}
                                                                            </Badge>
                                                                        </div>
                                                                        {log.breathingIssues?.description && <p className="text-sm text-neutral-600">{log.breathingIssues.description}</p>}
                                                                    </div>
                                                                )}

                                                                {log.logType === 'medication' && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                        <div>
                                                                            <span className="text-sm font-medium text-neutral-700">Medication:</span>
                                                                            <p className="text-sm text-neutral-900">{log.medication?.name || 'Not specified'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-medium text-neutral-700">Dosage:</span>
                                                                            <p className="text-sm text-neutral-900">{log.medication?.dosage || 'Not specified'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-medium text-neutral-700">Frequency:</span>
                                                                            <p className="text-sm text-neutral-900">{log.medication?.frequency || 'Not specified'}</p>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {log.logType === 'healing_progress' && (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-sm font-medium text-neutral-700">Wound Condition:</span>
                                                                            <Badge
                                                                                variant={
                                                                                    log.healingProgress?.woundCondition === 'healing_well'
                                                                                        ? 'success'
                                                                                        : log.healingProgress?.woundCondition === 'minor_issues'
                                                                                        ? 'warning'
                                                                                        : 'danger'
                                                                                }
                                                                                size="sm"
                                                                            >
                                                                                {log.healingProgress?.woundCondition?.replace('_', ' ') || 'Unknown'}
                                                                            </Badge>
                                                                        </div>
                                                                        {log.healingProgress?.nextCheckup && (
                                                                            <div>
                                                                                <span className="text-sm font-medium text-neutral-700">Next Checkup:</span>
                                                                                <p className="text-sm text-neutral-900">{formatDate(log.healingProgress.nextCheckup)}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {log.notes && (
                                                                    <div className="mt-3 p-3 bg-neutral-50 rounded-lg border-l-4 border-primary-300">
                                                                        <p className="text-sm text-neutral-700 italic">"{log.notes}"</p>
                                                                    </div>
                                                                )}

                                                                {log.loggedBy && (
                                                                    <div className="mt-3 pt-3 border-t border-neutral-200">
                                                                        <p className="text-xs text-neutral-500">Logged by: {log.loggedBy}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="p-12 text-center">
                            <div className="text-6xl mb-4">📅</div>
                            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Timeline Data</h3>
                            <p className="text-neutral-600 mb-6">Start adding health logs to see the recovery timeline.</p>
                            <Link to={`/ent/${id}/logs`}>
                                <Button>
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add First Log
                                </Button>
                            </Link>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntTimeline;
