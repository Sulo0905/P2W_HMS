import React, { useState, useEffect } from 'react';
import { obstetricsAPI } from '../services/healthlogs.service';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface VitalsTests {
    bloodPressure: string;
    bloodSugar: string;
    weight: string;
    fetalHeartRate: string;
    symptoms: string;
    medication: string;
    testResults: string;
    logDate: string;
}

interface SubmitData {
    logType: string;
    loggedBy: string;
    loggedAt: string;
    trimester?: number;
    vitalsTests?: VitalsTests;
    symptoms?: any;
    babyMovement?: any;
    sleepNutrition?: any;
    postnatalRecovery?: any;
    notes?: string;
    // API-specific properties that get added during transformation
    vitals?: {
        bloodPressure?: { systolic?: number; diastolic?: number };
        sugarLevel?: number;
        weightKg?: number;
        fetalHeartRate?: number;
    };
    medications?: Array<{ name: string }>;
    tests?: {
        ultrasound?: { notes: string };
        labs?: any[];
    };
}

const AddObstetricsLogModal = ({ isOpen, onClose, onSuccess, preselectedPatientId = null, preselectedPatientInfo = null, patients = [] }) => {
    const [formData, setFormData] = useState({
        targetPatientId: preselectedPatientId || '',
        logType: 'trimester_symptoms',
        loggedBy: '',
        loggedAt: '',
        trimester: 1,
        vitalsTests: {
            bloodPressure: '',
            bloodSugar: '',
            weight: '',
            fetalHeartRate: '',
            symptoms: '',
            medication: '',
            testResults: '',
            logDate: '',
        },
        symptoms: {
            nausea: { hasSymptom: false, severity: 'mild', notes: '' },
            cramps: { hasSymptom: false, severity: 'mild', notes: '' },
            mood: { level: 'good', notes: '' },
            otherSymptoms: [],
        },
        babyMovement: {
            week: 1,
            movementLevel: 'medium',
            notes: '',
            timeOfDay: 'morning',
        },
        sleepNutrition: {
            sleepHours: '',
            sleepQuality: 'good',
            nutritionNotes: '',
            waterIntake: '',
            supplements: [],
            cravings: [],
        },
        postnatalRecovery: {
            bleeding: { hasBleeding: false, severity: 'light', color: 'red' },
            stitches: { hasStitches: false, condition: 'healing_well', notes: '' },
            breastfeeding: { isBreastfeeding: false, frequency: '', duration: '', issues: [], notes: '' },
            painLevel: '',
            energyLevel: 'medium',
        },
        notes: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [error, setError] = useState(null);

    // Update targetPatientId when preselectedPatientId changes
    useEffect(() => {
        if (preselectedPatientId) {
            setFormData((prev) => ({ ...prev, targetPatientId: preselectedPatientId }));
        }
    }, [preselectedPatientId]);

    // Validate form whenever formData changes
    useEffect(() => {
        validateForm();
    }, [formData]);

    const validateForm = () => {
        const errs = {};

        // Required field: Patient selection (only if not preselected)
        if (!preselectedPatientId && !formData.targetPatientId) {
            errs['targetPatientId'] = 'Please select a patient.';
        }

        // Required field: Log Type
        if (!formData.logType) {
            errs['logType'] = 'Log Type is required.';
        }

        // Validate Logged By (required)
        if (!formData.loggedBy?.trim()) {
            errs['loggedBy'] = 'Logged By is required.';
        }

        // Validate loggedAt format if provided
        if (formData.loggedAt) {
            const d = new Date(formData.loggedAt);
            if (isNaN(d.getTime())) {
                errs['loggedAt'] = 'Please provide a valid date and time.';
            } else {
                const now = new Date();
                if (d.getTime() - now.getTime() > 5 * 60 * 1000) {
                    errs['loggedAt'] = 'Logged time cannot be in the future.';
                }
            }
        }

        const t = formData.logType;

        // Vitals & Tests validation
        if (t === 'vitals_tests') {
            const v = formData.vitalsTests || {
                bloodPressure: '',
                bloodSugar: '',
                weight: '',
                fetalHeartRate: '',
                symptoms: '',
                medication: '',
                testResults: '',
                logDate: '',
            };

            if (v.bloodPressure && !v.bloodPressure.includes('/')) {
                errs['vitalsTests.bloodPressure'] = 'Blood Pressure should be like 120/80.';
            }
            if (v.bloodSugar && (isNaN(Number(v.bloodSugar)) || Number(v.bloodSugar) < 20 || Number(v.bloodSugar) > 600)) {
                errs['vitalsTests.bloodSugar'] = 'Blood Sugar value looks invalid.';
            }
            if (v.weight && (isNaN(Number(v.weight)) || Number(v.weight) < 20 || Number(v.weight) > 250)) {
                errs['vitalsTests.weight'] = 'Weight value looks invalid.';
            }
            if (v.fetalHeartRate && (isNaN(Number(v.fetalHeartRate)) || Number(v.fetalHeartRate) < 60 || Number(v.fetalHeartRate) > 220)) {
                errs['vitalsTests.fetalHeartRate'] = 'Fetal Heart Rate value looks invalid.';
            }
        }

        // Baby Movement validation
        if (t === 'baby_movement') {
            const wk = Number(formData.babyMovement.week);
            if (!Number.isInteger(wk) || wk < 1 || wk > 40) {
                errs['babyMovement.week'] = 'Week must be 1–40.';
            }
            const v = String(formData.babyMovement.movementLevel || '').toLowerCase();
            if (!['low', 'medium', 'high'].includes(v)) {
                errs['babyMovement.movementLevel'] = 'Select Low / Medium / High.';
            }
        }

        // Sleep & Nutrition validation
        if (t === 'sleep_nutrition') {
            if (
                formData.sleepNutrition.sleepHours &&
                (isNaN(Number(formData.sleepNutrition.sleepHours)) || Number(formData.sleepNutrition.sleepHours) < 0 || Number(formData.sleepNutrition.sleepHours) > 24)
            ) {
                errs['sleepNutrition.sleepHours'] = 'Sleep hours must be 0–24.';
            }
            if (
                formData.sleepNutrition.waterIntake &&
                (isNaN(Number(formData.sleepNutrition.waterIntake)) || Number(formData.sleepNutrition.waterIntake) < 0 || Number(formData.sleepNutrition.waterIntake) > 20)
            ) {
                errs['sleepNutrition.waterIntake'] = 'Water intake looks invalid.';
            }
        }

        setFieldErrors(errs);
        const isValid = Object.keys(errs).length === 0;
        setIsFormValid(isValid);

        return isValid ? '' : 'Please fix the errors below.';
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child, subChild] = name.split('.');
            if (subChild) {
                setFormData((prev) => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: {
                            ...prev[parent][child],
                            [subChild]: type === 'checkbox' ? checked : value,
                        },
                    },
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: type === 'checkbox' ? checked : value,
                    },
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            targetPatientId: preselectedPatientId || '',
            logType: 'trimester_symptoms',
            loggedBy: '',
            loggedAt: '',
            trimester: 1,
            vitalsTests: {
                bloodPressure: '',
                bloodSugar: '',
                weight: '',
                fetalHeartRate: '',
                symptoms: '',
                medication: '',
                testResults: '',
                logDate: '',
            },
            symptoms: {
                nausea: { hasSymptom: false, severity: 'mild', notes: '' },
                cramps: { hasSymptom: false, severity: 'mild', notes: '' },
                mood: { level: 'good', notes: '' },
                otherSymptoms: [],
            },
            babyMovement: {
                week: 1,
                movementLevel: 'medium',
                notes: '',
                timeOfDay: 'morning',
            },
            sleepNutrition: {
                sleepHours: '',
                sleepQuality: 'good',
                nutritionNotes: '',
                waterIntake: '',
                supplements: [],
                cravings: [],
            },
            postnatalRecovery: {
                bleeding: { hasBleeding: false, severity: 'light', color: 'red' },
                stitches: { hasStitches: false, condition: 'healing_well', notes: '' },
                breastfeeding: { isBreastfeeding: false, frequency: '', duration: '', issues: [], notes: '' },
                painLevel: '',
                energyLevel: 'medium',
            },
            notes: '',
        });
        setFieldErrors({});
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const validationMsg = validateForm();
            if (validationMsg) {
                setError(validationMsg);
                return;
            }

            const targetId = preselectedPatientId || formData.targetPatientId;
            if (!targetId) {
                setError('Please select a patient');
                return;
            }

            const submitData: SubmitData = { ...formData };
            delete (submitData as any).targetPatientId; // Remove this field before sending to API

            // Handle vitals_tests special processing
            if (submitData.logType === 'vitals_tests') {
                const { bloodPressure, bloodSugar, weight, fetalHeartRate, symptoms, medication, testResults, logDate } = submitData.vitalsTests || {};
                let systolic, diastolic;

                if (bloodPressure && bloodPressure.includes('/')) {
                    const parts = bloodPressure.split('/').map((p) => parseInt(p.trim(), 10));
                    if (!Number.isNaN(parts[0])) systolic = parts[0];
                    if (!Number.isNaN(parts[1])) diastolic = parts[1];
                }

                submitData.vitals = {
                    bloodPressure: { ...(systolic !== undefined ? { systolic } : {}), ...(diastolic !== undefined ? { diastolic } : {}) },
                    ...(bloodSugar ? { sugarLevel: Number(bloodSugar) } : {}),
                    ...(weight ? { weightKg: Number(weight) } : {}),
                    ...(fetalHeartRate ? { fetalHeartRate: Number(fetalHeartRate) } : {}),
                };
                if (medication && medication.trim()) submitData.medications = [{ name: medication.trim() }];
                if (testResults && testResults.trim()) submitData.tests = { ultrasound: { notes: testResults.trim() }, labs: [] };
                if (symptoms && symptoms.trim()) submitData.notes = symptoms.trim();
                if (logDate) submitData.loggedAt = new Date(logDate).toISOString();
            }

            // Ensure loggedAt is set; if empty, default to now. If from datetime-local, convert to ISO.
            if (!submitData.loggedAt) {
                submitData.loggedAt = new Date().toISOString();
            } else if (typeof submitData.loggedAt === 'string' && submitData.loggedAt.length === 16) {
                submitData.loggedAt = new Date(submitData.loggedAt).toISOString();
            }

            // Remove UI-only fields and empty containers before sending
            delete submitData.vitalsTests;

            // Ensure logType is present and valid
            submitData.logType = String(formData.logType || '').trim();

            // Drop empty objects to avoid validation noise
            Object.keys(submitData).forEach((k) => {
                const v = submitData[k];
                if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) {
                    delete submitData[k];
                }
            });

            await obstetricsAPI.addLog(targetId, submitData);

            resetForm();
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            const backendMsg = err?.response?.data?.message;
            const backendDetail = err?.response?.data?.error;
            const msg = backendMsg || backendDetail || 'Failed to add health log';
            setError(msg);
            console.error('Error adding log:', err?.response?.data || err);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Helper function for field styling with validation
    const getFieldClassName = (fieldName, baseClassName = 'mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none') => {
        const hasError = fieldErrors[fieldName];
        const errorClasses = hasError ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500';
        return `${baseClassName} ${errorClasses}`;
    };

    // Helper function for error message
    const renderError = (fieldName) => {
        if (fieldErrors[fieldName]) {
            return (
                <div className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors[fieldName]}
                </div>
            );
        }
        return null;
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add Obstetrics Log" size="xl">
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 -m-6 mb-6 p-6 border-b">
                <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">New Obstetrics Log Entry</h3>
                        <p className="text-sm text-gray-600">Record pregnancy and maternal health information</p>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection - only show if not preselected */}
                {!preselectedPatientId && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <label className="block text-sm font-semibold text-gray-700">Select Patient *</label>
                        </div>
                        <select
                            name="targetPatientId"
                            value={formData.targetPatientId}
                            onChange={handleInputChange}
                            className={getFieldClassName('targetPatientId', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors')}
                        >
                            <option value="">Choose a patient...</option>
                            {patients.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.name} ({p.patientId})
                                </option>
                            ))}
                        </select>
                        {renderError('targetPatientId')}
                    </div>
                )}

                {/* Patient Info Display - show if preselected */}
                {preselectedPatientId && preselectedPatientInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {preselectedPatientInfo.name ? preselectedPatientInfo.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <h4 className="text-lg font-semibold text-gray-900">{preselectedPatientInfo.name || 'Unknown Patient'}</h4>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Selected</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    <span className="inline-flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z"
                                            />
                                        </svg>
                                        ID: {preselectedPatientInfo.patientId}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span className="inline-flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Status: {preselectedPatientInfo.isPostnatal ? 'Postnatal' : 'Prenatal'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <label className="block text-sm font-semibold text-gray-700">Log Type *</label>
                    </div>
                    <select
                        name="logType"
                        value={formData.logType}
                        onChange={handleInputChange}
                        className={getFieldClassName('logType', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors')}
                    >
                        <option value="trimester_symptoms">Trimester Symptoms</option>
                        <option value="baby_movement">Baby Movement</option>
                        <option value="sleep_nutrition">Sleep & Nutrition</option>
                        <option value="postnatal_recovery">Postnatal Recovery</option>
                        <option value="vitals_tests">Vitals & Tests</option>
                    </select>
                    {renderError('logType')}
                </div>

                {formData.logType === 'trimester_symptoms' && (
                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Trimester Symptoms</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-yellow-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Pregnancy Stage</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3].map((tri) => (
                                        <label
                                            key={tri}
                                            className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                formData.trimester === tri ? 'border-yellow-500 bg-yellow-100 text-yellow-800' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                                            }`}
                                        >
                                            <input type="radio" name="trimester" value={tri} checked={formData.trimester === tri} onChange={handleInputChange} className="sr-only" />
                                            <span className="text-sm font-medium">
                                                {tri}
                                                {tri === 1 ? 'st' : tri === 2 ? 'nd' : 'rd'} Trimester
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-yellow-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4">Common Symptoms</h5>
                                <div className="space-y-4">
                                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="symptoms.nausea.hasSymptom"
                                            checked={formData.symptoms.nausea.hasSymptom}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                        <span className="text-sm font-medium text-gray-900">Nausea & Morning Sickness</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="symptoms.cramps.hasSymptom"
                                            checked={formData.symptoms.cramps.hasSymptom}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                        <span className="text-sm font-medium text-gray-900">Cramps & Discomfort</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'vitals_tests' && (
                    <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Vitals & Medical Tests</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-green-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                    Vital Signs
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
                                        <input
                                            type="text"
                                            name="vitalsTests.bloodPressure"
                                            value={formData.vitalsTests.bloodPressure}
                                            onChange={handleInputChange}
                                            placeholder="e.g., 120/80"
                                            className={getFieldClassName('vitalsTests.bloodPressure', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('vitalsTests.bloodPressure')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Sugar</label>
                                        <input
                                            type="number"
                                            name="vitalsTests.bloodSugar"
                                            value={formData.vitalsTests.bloodSugar}
                                            onChange={handleInputChange}
                                            placeholder="mg/dL"
                                            className={getFieldClassName('vitalsTests.bloodSugar', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('vitalsTests.bloodSugar')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            name="vitalsTests.weight"
                                            value={formData.vitalsTests.weight}
                                            onChange={handleInputChange}
                                            placeholder="kg"
                                            className={getFieldClassName('vitalsTests.weight', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('vitalsTests.weight')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fetal Heart Rate</label>
                                        <input
                                            type="number"
                                            name="vitalsTests.fetalHeartRate"
                                            value={formData.vitalsTests.fetalHeartRate}
                                            onChange={handleInputChange}
                                            placeholder="bpm"
                                            className={getFieldClassName('vitalsTests.fetalHeartRate', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('vitalsTests.fetalHeartRate')}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-green-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Additional Information
                                </h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Symptoms</label>
                                        <input
                                            type="text"
                                            name="vitalsTests.symptoms"
                                            value={formData.vitalsTests.symptoms}
                                            onChange={handleInputChange}
                                            placeholder="Describe any current symptoms..."
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Medication</label>
                                        <input
                                            type="text"
                                            name="vitalsTests.medication"
                                            value={formData.vitalsTests.medication}
                                            onChange={handleInputChange}
                                            placeholder="List current medications..."
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Test Results</label>
                                        <textarea
                                            name="vitalsTests.testResults"
                                            value={formData.vitalsTests.testResults}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Enter test results, lab values, ultrasound findings..."
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Test Date</label>
                                        <input
                                            type="datetime-local"
                                            name="vitalsTests.logDate"
                                            value={formData.vitalsTests.logDate}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'baby_movement' && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Baby Movement Tracking</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-purple-100">
                                <label className="block text-sm font-medium text-gray-700 mb-4">Pregnancy Week</label>
                                <div className="flex items-center justify-center space-x-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                babyMovement: {
                                                    ...prev.babyMovement,
                                                    week: Math.max(1, Number(prev.babyMovement.week || 1) - 1),
                                                },
                                            }))
                                        }
                                        className="w-12 h-12 rounded-full border-2 border-purple-300 bg-white hover:bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xl transition-colors"
                                    >
                                        −
                                    </button>
                                    <div className="flex-1 max-w-xs">
                                        <div className="text-center border-2 border-purple-200 rounded-xl px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50">
                                            <div className="text-2xl font-bold text-purple-800">{formData.babyMovement.week}</div>
                                            <div className="text-sm text-purple-600">Week{formData.babyMovement.week > 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                babyMovement: {
                                                    ...prev.babyMovement,
                                                    week: Math.min(40, Number(prev.babyMovement.week || 1) + 1),
                                                },
                                            }))
                                        }
                                        className="w-12 h-12 rounded-full border-2 border-purple-300 bg-white hover:bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xl transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                {renderError('babyMovement.week')}
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-purple-100">
                                <label className="block text-sm font-medium text-gray-700 mb-4">Movement Activity Level</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'low', label: 'Low', color: 'blue' },
                                        { value: 'medium', label: 'Medium', color: 'yellow' },
                                        { value: 'high', label: 'High', color: 'green' },
                                    ].map((level) => (
                                        <label
                                            key={level.value}
                                            className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                formData.babyMovement.movementLevel === level.value
                                                    ? `border-${level.color}-500 bg-${level.color}-100 text-${level.color}-800`
                                                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="babyMovement.movementLevel"
                                                value={level.value}
                                                checked={formData.babyMovement.movementLevel === level.value}
                                                onChange={handleInputChange}
                                                className="sr-only"
                                            />
                                            <span className="text-sm font-medium">{level.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {renderError('babyMovement.movementLevel')}
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'sleep_nutrition' && (
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Sleep & Nutrition</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-indigo-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    Sleep & Rest
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Hours</label>
                                        <input
                                            type="number"
                                            name="sleepNutrition.sleepHours"
                                            value={formData.sleepNutrition.sleepHours}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="24"
                                            placeholder="Hours per night"
                                            className={getFieldClassName('sleepNutrition.sleepHours', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('sleepNutrition.sleepHours')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                                        <select
                                            name="sleepNutrition.sleepQuality"
                                            value={formData.sleepNutrition.sleepQuality}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50"
                                        >
                                            <option value="excellent">Excellent</option>
                                            <option value="good">Good</option>
                                            <option value="fair">Fair</option>
                                            <option value="poor">Poor</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-indigo-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                    Nutrition & Hydration
                                </h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Water Intake (liters)</label>
                                        <input
                                            type="number"
                                            name="sleepNutrition.waterIntake"
                                            value={formData.sleepNutrition.waterIntake}
                                            onChange={handleInputChange}
                                            step="0.1"
                                            min="0"
                                            max="10"
                                            placeholder="Liters per day"
                                            className={getFieldClassName('sleepNutrition.waterIntake', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                        />
                                        {renderError('sleepNutrition.waterIntake')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nutrition Notes</label>
                                        <textarea
                                            name="sleepNutrition.nutritionNotes"
                                            value={formData.sleepNutrition.nutritionNotes}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Diet, supplements, cravings, concerns..."
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'postnatal_recovery' && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Postnatal Recovery</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-rose-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        />
                                    </svg>
                                    Recovery Status
                                </h5>
                                <div className="space-y-4">
                                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="postnatalRecovery.bleeding.hasBleeding"
                                            checked={formData.postnatalRecovery.bleeding.hasBleeding}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                        />
                                        <span className="text-sm font-medium text-gray-900">Postpartum Bleeding</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="postnatalRecovery.breastfeeding.isBreastfeeding"
                                            checked={formData.postnatalRecovery.breastfeeding.isBreastfeeding}
                                            onChange={handleInputChange}
                                            className="h-5 w-5 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                                        />
                                        <span className="text-sm font-medium text-gray-900">Breastfeeding</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-rose-100">
                                <h5 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                        />
                                    </svg>
                                    Pain & Comfort Level
                                </h5>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Pain Level (0-10)</label>
                                        <input
                                            type="number"
                                            name="postnatalRecovery.painLevel"
                                            value={formData.postnatalRecovery.painLevel}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="10"
                                            placeholder="Rate pain from 0-10"
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50 text-center text-xl font-bold"
                                        />
                                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                                            <span>No Pain</span>
                                            <span>Moderate</span>
                                            <span>Severe</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                                        <select
                                            name="postnatalRecovery.energyLevel"
                                            value={formData.postnatalRecovery.energyLevel}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50"
                                        >
                                            <option value="high">High Energy</option>
                                            <option value="medium">Medium Energy</option>
                                            <option value="low">Low Energy</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Log metadata */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-gray-700">Log Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <label className="block text-sm font-medium text-gray-700">Logged By *</label>
                            </div>
                            <input
                                type="text"
                                name="loggedBy"
                                value={formData.loggedBy}
                                onChange={handleInputChange}
                                placeholder="Doctor/Midwife name"
                                className={getFieldClassName('loggedBy', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors')}
                            />
                            {renderError('loggedBy')}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11m-6 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h2"
                                    />
                                </svg>
                                <label className="block text-sm font-medium text-gray-700">Logged At</label>
                            </div>
                            <input
                                type="datetime-local"
                                name="loggedAt"
                                value={formData.loggedAt}
                                onChange={handleInputChange}
                                className={getFieldClassName('loggedAt', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors')}
                            />
                            {renderError('loggedAt')}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                        </svg>
                        <label className="block text-sm font-semibold text-gray-700">Additional Notes</label>
                    </div>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Any additional observations, concerns, or important notes..."
                        className="mt-1 block w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors resize-none"
                    />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        className="px-6 py-3 rounded-xl"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={!isFormValid}
                        className={`px-8 py-3 rounded-xl ${
                            !isFormValid ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 shadow-lg'
                        }`}
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                    >
                        Add Obstetrics Log
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddObstetricsLogModal;
