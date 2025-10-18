import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obstetricsAPI } from '../../../services/healthlogs.service';

const ObstetricsTimeline = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatientAndTimeline();
    }, [id]);

    const fetchPatientAndTimeline = async () => {
        try {
            setLoading(true);
            setError(null);

            // First get patient data
            const patientResponse = await obstetricsAPI.getPatientById(id);
            setPatient(patientResponse.data.data);

            // Then get timeline data
            const timelineResponse = await obstetricsAPI.getTimeline(id);
            console.log('Timeline response:', timelineResponse.data);

            // Handle timeline response structure
            const timelineData = timelineResponse.data.data;
            if (timelineData && timelineData.timeline) {
                // If timeline is grouped by week, flatten it
                const allLogs = [];
                Object.values(timelineData.timeline).forEach((weekLogs) => {
                    if (Array.isArray(weekLogs)) {
                        allLogs.push(...weekLogs);
                    }
                });
                setTimeline(allLogs);
            } else if (Array.isArray(timelineData)) {
                setTimeline(timelineData);
            } else {
                setTimeline([]);
            }
        } catch (err) {
            console.error('Error fetching timeline:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            console.error('Request URL:', err.config?.url);

            let errorMessage = 'Failed to fetch timeline data';
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getLogTypeIcon = (logType) => {
        const icons = {
            trimester_symptoms: '🤰',
            baby_movement: '👶',
            sleep_nutrition: '😴',
            postnatal_recovery: '🏥',
        };
        return icons[logType] || '📝';
    };

    const getLogTypeLabel = (logType) => {
        const labels = {
            trimester_symptoms: 'Trimester Symptoms',
            baby_movement: 'Baby Movement',
            sleep_nutrition: 'Sleep & Nutrition',
            postnatal_recovery: 'Postnatal Recovery',
        };
        return labels[logType] || logType;
    };

    const getTrimesterColor = (trimester) => {
        const colors = {
            1: 'bg-pink-100 border-pink-300',
            2: 'bg-blue-100 border-blue-300',
            3: 'bg-green-100 border-green-300',
        };
        return colors[trimester] || 'bg-gray-100 border-gray-300';
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
                <Link to="/obstetrics" className="text-primary-600 hover:text-primary-800 flex items-center">
                    ← Back to Obstetrics Patients
                </Link>
            </div>

            {patient && (
                <div className="bg-white shadow rounded-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{patient.name} - Pregnancy Timeline</h1>
                    <p className="text-gray-600">
                        Due Date: {formatDate(patient.dueDate)} | Pregnancy #{patient.pregnancyNumber}
                    </p>
                </div>
            )}

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Pregnancy Journey Timeline</h2>

                {timeline.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                        <div className="space-y-8">
                            {timeline.map((log, index) => (
                                <div key={log._id} className="relative flex items-start">
                                    {/* Timeline dot */}
                                    <div
                                        className={`flex-shrink-0 w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl ${
                                            log.trimester ? getTrimesterColor(log.trimester) : 'bg-gray-100 border-gray-300'
                                        }`}
                                    >
                                        {getLogTypeIcon(log.logType)}
                                    </div>

                                    {/* Content */}
                                    <div className="ml-6 flex-1">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {getLogTypeLabel(log.logType)}
                                                    {log.trimester && ` - Trimester ${log.trimester}`}
                                                </h3>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {log.logType === 'trimester_symptoms' && (
                                                    <div className="space-y-1">
                                                        {log.symptoms?.nausea?.hasSymptom && (
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">Nausea:</span>
                                                                <span
                                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                                        log.symptoms.nausea.severity === 'mild'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : log.symptoms.nausea.severity === 'moderate'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                >
                                                                    {log.symptoms.nausea.severity}
                                                                </span>
                                                                {log.symptoms.nausea.notes && <span className="text-sm text-gray-600">{log.symptoms.nausea.notes}</span>}
                                                            </div>
                                                        )}
                                                        {log.symptoms?.cramps?.hasSymptom && (
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">Cramps:</span>
                                                                <span
                                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                                        log.symptoms.cramps.severity === 'mild'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : log.symptoms.cramps.severity === 'moderate'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                >
                                                                    {log.symptoms.cramps.severity}
                                                                </span>
                                                                {log.symptoms.cramps.notes && <span className="text-sm text-gray-600">{log.symptoms.cramps.notes}</span>}
                                                            </div>
                                                        )}
                                                        {log.symptoms?.mood && (
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm font-medium">Mood:</span>
                                                                <span className="capitalize text-sm text-gray-600">{log.symptoms.mood.level}</span>
                                                                {log.symptoms.mood.notes && <span className="text-sm text-gray-600">- {log.symptoms.mood.notes}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {log.logType === 'baby_movement' && (
                                                    <div className="space-y-1">
                                                        {log.babyMovement?.movementCount && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Movement Count: </span>
                                                                <span className="text-primary-600 font-semibold">{log.babyMovement.movementCount}</span>
                                                            </div>
                                                        )}
                                                        {log.babyMovement?.duration && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Duration: </span>
                                                                <span>{log.babyMovement.duration} minutes</span>
                                                            </div>
                                                        )}
                                                        {log.babyMovement?.timeOfDay && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Time: </span>
                                                                <span className="capitalize">{log.babyMovement.timeOfDay}</span>
                                                            </div>
                                                        )}
                                                        {log.babyMovement?.notes && <div className="text-sm text-gray-600">{log.babyMovement.notes}</div>}
                                                    </div>
                                                )}

                                                {log.logType === 'sleep_nutrition' && (
                                                    <div className="space-y-1">
                                                        {log.sleepNutrition?.sleepHours && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Sleep: </span>
                                                                <span className="text-blue-600 font-semibold">{log.sleepNutrition.sleepHours} hours</span>
                                                                {log.sleepNutrition.sleepQuality && <span className="ml-2 text-gray-600">({log.sleepNutrition.sleepQuality})</span>}
                                                            </div>
                                                        )}
                                                        {log.sleepNutrition?.waterIntake && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Water: </span>
                                                                <span className="text-blue-600 font-semibold">{log.sleepNutrition.waterIntake}L</span>
                                                            </div>
                                                        )}
                                                        {log.sleepNutrition?.nutritionNotes && <div className="text-sm text-gray-600">{log.sleepNutrition.nutritionNotes}</div>}
                                                    </div>
                                                )}

                                                {log.logType === 'postnatal_recovery' && (
                                                    <div className="space-y-1">
                                                        {log.postnatalRecovery?.bleeding?.hasBleeding && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Bleeding: </span>
                                                                <span
                                                                    className={`px-2 py-1 text-xs rounded-full ${
                                                                        log.postnatalRecovery.bleeding.severity === 'light'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : log.postnatalRecovery.bleeding.severity === 'moderate'
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                >
                                                                    {log.postnatalRecovery.bleeding.severity} - {log.postnatalRecovery.bleeding.color}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {log.postnatalRecovery?.breastfeeding?.isBreastfeeding && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Breastfeeding: </span>
                                                                <span className="text-green-600 font-semibold">{log.postnatalRecovery.breastfeeding.frequency} times/day</span>
                                                                {log.postnatalRecovery.breastfeeding.duration && (
                                                                    <span className="ml-2 text-gray-600">({log.postnatalRecovery.breastfeeding.duration} min/session)</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {log.postnatalRecovery?.painLevel && (
                                                            <div className="text-sm">
                                                                <span className="font-medium">Pain Level: </span>
                                                                <span className="text-red-600 font-bold text-lg">{log.postnatalRecovery.painLevel}/10</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {log.notes && (
                                                    <div className="mt-2 p-2 bg-white rounded border-l-4 border-primary-300">
                                                        <p className="text-sm text-gray-700 italic">"{log.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Data</h3>
                        <p className="text-gray-500">Start adding logs to see your pregnancy journey timeline.</p>
                        <Link
                            to={`/obstetrics/${id}/logs`}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                            Add First Log
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ObstetricsTimeline;
