import React, { useState, useEffect } from 'react';
import { entAPI } from '../services/healthlogs.service';
import Button from './ui/Button';
import Modal from './ui/Modal';

type PatientInfo = {
    _id: string;
    name?: string;
    patientId?: string;
    surgeryType?: string;
};

interface AddHealthLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preselectedPatientId?: string | null;
    preselectedPatientInfo?: PatientInfo | null;
    patients?: PatientInfo[];
}

const AddHealthLogModal: React.FC<AddHealthLogModalProps> = ({ isOpen, onClose, onSuccess, preselectedPatientId = null, preselectedPatientInfo = null, patients = [] }) => {
    const [formData, setFormData] = useState({
        targetPatientId: preselectedPatientId || '',
        logType: 'pain_level',
        loggedBy: '',
        loggedAt: new Date().toISOString().slice(0, 16),
        painLevel: '',
        // Recovery milestones
        milestones: { swallowing: false, breathing: false, feverFree: false },
        // Optional attachments (base64)
        attachmentsBase64: [],
        breathingIssues: {
            hasIssues: false,
            description: '',
            severity: 'mild',
        },
        throatDiscomfort: {
            hasDiscomfort: false,
            description: '',
            severity: 'mild',
        },
        medication: {
            name: '',
            dosage: '',
            frequency: '',
            sideEffects: [],
            takenAt: new Date().toISOString().split('T')[0],
        },
        healingProgress: {
            woundCondition: 'healing_well',
            notes: '',
            photos: [],
            nextCheckup: '',
        },
        notes: '',
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        const errors: Record<string, string> = {};

        // Required field: Patient selection (only if not preselected)
        if (!preselectedPatientId && !formData.targetPatientId) {
            errors['targetPatientId'] = 'Please select a patient.';
        }

        // Required field: Log Type
        if (!formData.logType) {
            errors['logType'] = 'Log Type is required.';
        }

        // Required field: Logged By
        if (!formData.loggedBy?.trim()) {
            errors['loggedBy'] = 'Logged By is required.';
        }

        // Validate loggedAt
        if (formData.loggedAt) {
            const d = new Date(formData.loggedAt);
            if (isNaN(d.getTime())) {
                errors['loggedAt'] = 'Please provide a valid date and time.';
            } else {
                const now = new Date();
                if (d.getTime() - now.getTime() > 5 * 60 * 1000) {
                    errors['loggedAt'] = 'Logged time cannot be in the future.';
                }
            }
        }

        const t = formData.logType;

        // Pain Level validation
        if (t === 'pain_level') {
            if (formData.painLevel === '' || formData.painLevel === null || formData.painLevel === undefined) {
                errors['painLevel'] = 'Pain Level is required.';
            } else {
                const level = Number(formData.painLevel);
                if (isNaN(level) || level < 0 || level > 10) {
                    errors['painLevel'] = 'Pain Level must be between 0 and 10.';
                }
            }
        }

        // Breathing Issues validation
        if (t === 'breathing_issues') {
            const bi = formData.breathingIssues || {};
            const td = formData.throatDiscomfort || {};

            if (bi.hasIssues && !['mild', 'moderate', 'severe'].includes(bi.severity)) {
                errors['breathingIssues.severity'] = 'Breathing Issues severity is required.';
            }
            if (td.hasDiscomfort && !['mild', 'moderate', 'severe'].includes(td.severity)) {
                errors['throatDiscomfort.severity'] = 'Throat Discomfort severity is required.';
            }

            // At least one issue must be selected
            if (!bi.hasIssues && !td.hasDiscomfort) {
                errors['breathingIssues.hasIssues'] = 'Please select at least one breathing issue or throat discomfort.';
            }
        }

        // Healing Progress validation
        if (t === 'healing_progress') {
            const hp = formData.healingProgress || {};

            if (!['healing_well', 'minor_issues', 'concerning', 'needs_attention'].includes(hp.woundCondition || '')) {
                errors['healingProgress.woundCondition'] = 'Wound condition is required.';
            }

            if (hp.nextCheckup) {
                const nc = new Date(hp.nextCheckup);
                if (isNaN(nc.getTime())) {
                    errors['healingProgress.nextCheckup'] = 'Please provide a valid checkup date.';
                } else {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (nc < today) {
                        errors['healingProgress.nextCheckup'] = 'Next checkup cannot be in the past.';
                    }
                }
            }
        }

        setFieldErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        setIsFormValid(isValid);

        return isValid ? '' : 'Please fix the errors below.';
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value,
                },
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        }
    };

    const handleSideEffectChange = (e, index) => {
        const newSideEffects = [...formData.medication.sideEffects];
        newSideEffects[index] = e.target.value;
        setFormData((prev) => ({
            ...prev,
            medication: {
                ...prev.medication,
                sideEffects: newSideEffects,
            },
        }));
    };

    const addSideEffect = () => {
        setFormData((prev) => ({
            ...prev,
            medication: {
                ...prev.medication,
                sideEffects: [...prev.medication.sideEffects, ''],
            },
        }));
    };

    const removeSideEffect = (index) => {
        const newSideEffects = formData.medication.sideEffects.filter((_, i) => i !== index);
        setFormData((prev) => ({
            ...prev,
            medication: {
                ...prev.medication,
                sideEffects: newSideEffects,
            },
        }));
    };

    // File attachments handler
    const filesToBase64 = (files) => {
        const tasks = Array.from(files).map(
            (file) =>
                new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                })
        );
        return Promise.all(tasks);
    };

    const handleFileChange = async (e) => {
        try {
            const b64s = await filesToBase64(e.target.files || []);
            setFormData((prev) => ({ ...prev, attachmentsBase64: b64s }));
        } catch (err) {
            console.error('File read error', err);
        }
    };

    const resetForm = () => {
        setFormData({
            targetPatientId: preselectedPatientId || '',
            logType: 'pain_level',
            loggedBy: '',
            loggedAt: new Date().toISOString().slice(0, 16),
            milestones: { swallowing: false, breathing: false, feverFree: false },
            attachmentsBase64: [],
            painLevel: '',
            breathingIssues: { hasIssues: false, description: '', severity: 'mild' },
            throatDiscomfort: { hasDiscomfort: false, description: '', severity: 'mild' },
            medication: { name: '', dosage: '', frequency: '', sideEffects: [], takenAt: new Date().toISOString().split('T')[0] },
            healingProgress: { woundCondition: 'healing_well', notes: '', photos: [], nextCheckup: '' },
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

            const submitData = { ...formData };
            delete submitData.targetPatientId; // Remove this field before sending to API

            // If loggedAt is empty, default to now (ISO for backend)
            if (!submitData.loggedAt) {
                submitData.loggedAt = new Date().toISOString();
            } else if (submitData.loggedAt.length === 16) {
                // Convert datetime-local value to ISO if needed
                submitData.loggedAt = new Date(submitData.loggedAt).toISOString();
            }

            // Clean up empty side effects (only for medication logs)
            if (submitData.logType === 'medication' && submitData.medication?.sideEffects) {
                submitData.medication.sideEffects = submitData.medication.sideEffects.filter((effect) => effect.trim() !== '');
            }

            // Ensure milestones present for submit (only for healing progress logs)
            if (submitData.logType === 'healing_progress' && !submitData.milestones) {
                submitData.milestones = { swallowing: false, breathing: false, feverFree: false };
            }

            await entAPI.addLog(targetId, submitData);

            resetForm();
            onClose();
            if (onSuccess) onSuccess();
        } catch (err) {
            setError('Failed to add log');
            console.error('Error saving log:', err);
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

    // Helper function for label with required indicator
    const renderLabel = (text, required = false) => (
        <label className="block text-sm font-medium text-gray-700">
            {text}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );

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
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Health Log" size="xl">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 -m-6 mb-6 p-6 border-b">
                <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-600 to-blue-700 flex items-center justify-center">
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
                        <h3 className="text-lg font-semibold text-gray-900">New Health Log Entry</h3>
                        <p className="text-sm text-gray-600">Record patient health information and progress</p>
                    </div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Patient Selection - only show if not preselected */}
                {!preselectedPatientId && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {renderLabel('Select Patient', true)}
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
                                    {p.name || 'Unknown Patient'} ({p.patientId})
                                </option>
                            ))}
                        </select>
                        {renderError('targetPatientId')}
                    </div>
                )}

                {/* Patient Info Display - show if preselected */}
                {preselectedPatientId && preselectedPatientInfo && (
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                            />
                                        </svg>
                                        Surgery: {preselectedPatientInfo.surgeryType || 'Not specified'}
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
                        {renderLabel('Log Type', true)}
                    </div>
                    <select
                        name="logType"
                        value={formData.logType}
                        onChange={handleInputChange}
                        className={getFieldClassName('logType', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors')}
                    >
                        <option value="">Select log type...</option>
                        <option value="pain_level">Pain Level Assessment</option>
                        <option value="breathing_issues">Breathing Issues</option>
                        <option value="medication">Medication Record</option>
                        <option value="healing_progress">Healing Progress</option>
                    </select>
                    {renderError('logType')}
                </div>

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
                                {renderLabel('Logged By', true)}
                            </div>
                            <input
                                type="text"
                                name="loggedBy"
                                value={formData.loggedBy}
                                onChange={handleInputChange}
                                placeholder="Doctor/Nurse name"
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
                                {renderLabel('Logged At')}
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

                {formData.logType === 'pain_level' && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                />
                            </svg>
                            {renderLabel('Pain Level Assessment', true)}
                        </div>
                        <div className="space-y-4">
                            <input
                                type="number"
                                name="painLevel"
                                value={formData.painLevel}
                                onChange={handleInputChange}
                                min="0"
                                max="10"
                                step="1"
                                placeholder="Enter pain level (0-10)"
                                className={getFieldClassName('painLevel', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-white text-center text-2xl font-bold')}
                            />
                            {renderError('painLevel')}
                            <div className="bg-white rounded-lg p-4 border">
                                <div className="flex justify-between items-center text-xs font-medium">
                                    <span className="text-green-600">No Pain</span>
                                    <span className="text-yellow-600">Moderate</span>
                                    <span className="text-red-600">Severe</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-green-600">0</span>
                                    <span className="text-yellow-600">5</span>
                                    <span className="text-red-600">10</span>
                                </div>
                                <div className="w-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 h-2 rounded-full mt-2"></div>
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'breathing_issues' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <h4 className="text-lg font-semibold text-gray-800">Breathing Assessment</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-4 border border-cyan-100">
                                <div className="flex items-center space-x-3 mb-4">
                                    <input
                                        type="checkbox"
                                        name="breathingIssues.hasIssues"
                                        checked={formData.breathingIssues.hasIssues}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                                    />
                                    <label className="text-sm font-medium text-gray-900 flex items-center">Breathing Issues</label>
                                </div>
                                {renderError('breathingIssues.hasIssues')}

                                {formData.breathingIssues.hasIssues && (
                                    <div className="space-y-4 pl-8 border-l-2 border-cyan-200">
                                        <div>
                                            {renderLabel('Severity', true)}
                                            <select
                                                name="breathingIssues.severity"
                                                value={formData.breathingIssues.severity}
                                                onChange={handleInputChange}
                                                className={getFieldClassName('breathingIssues.severity', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                            >
                                                <option value="">Select severity...</option>
                                                <option value="mild">Mild</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="severe">Severe</option>
                                            </select>
                                            {renderError('breathingIssues.severity')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                name="breathingIssues.description"
                                                value={formData.breathingIssues.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Describe the breathing difficulties..."
                                                className={getFieldClassName('breathingIssues.description', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-cyan-100">
                                <div className="flex items-center space-x-3 mb-4">
                                    <input
                                        type="checkbox"
                                        name="throatDiscomfort.hasDiscomfort"
                                        checked={formData.throatDiscomfort.hasDiscomfort}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                                    />
                                    <label className="text-sm font-medium text-gray-900 flex items-center">Throat Discomfort</label>
                                </div>

                                {formData.throatDiscomfort.hasDiscomfort && (
                                    <div className="space-y-4 pl-8 border-l-2 border-cyan-200">
                                        <div>
                                            {renderLabel('Severity', true)}
                                            <select
                                                name="throatDiscomfort.severity"
                                                value={formData.throatDiscomfort.severity}
                                                onChange={handleInputChange}
                                                className={getFieldClassName('throatDiscomfort.severity', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                            >
                                                <option value="">Select severity...</option>
                                                <option value="mild">Mild</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="severe">Severe</option>
                                            </select>
                                            {renderError('throatDiscomfort.severity')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                name="throatDiscomfort.description"
                                                value={formData.throatDiscomfort.description}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Describe the throat discomfort..."
                                                className={getFieldClassName('throatDiscomfort.description', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {formData.logType === 'medication' && (
                    <div className="space-y-4">
                        <div>
                            {renderLabel('Medication Name', true)}
                            <input
                                type="text"
                                name="medication.name"
                                value={formData.medication.name}
                                onChange={handleInputChange}
                                placeholder="Enter medication name"
                                className={getFieldClassName('medication.name')}
                            />
                            {renderError('medication.name')}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                {renderLabel('Dosage', true)}
                                <input
                                    type="text"
                                    name="medication.dosage"
                                    value={formData.medication.dosage}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 500mg, 2 tablets"
                                    className={getFieldClassName('medication.dosage')}
                                />
                                {renderError('medication.dosage')}
                            </div>
                            <div>
                                {renderLabel('Frequency', true)}
                                <input
                                    type="text"
                                    name="medication.frequency"
                                    value={formData.medication.frequency}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Twice daily, Every 8 hours"
                                    className={getFieldClassName('medication.frequency')}
                                />
                                {renderError('medication.frequency')}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Taken To (Future Date)</label>
                            <input type="date" name="medication.takenAt" value={formData.medication.takenAt} onChange={handleInputChange} className={getFieldClassName('medication.takenAt')} />
                            {renderError('medication.takenAt')}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Side Effects</label>
                            {formData.medication.sideEffects.map((effect, index) => (
                                <div key={index} className="flex space-x-2 mt-2">
                                    <input
                                        type="text"
                                        value={effect}
                                        onChange={(e) => handleSideEffectChange(e, index)}
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Enter side effect"
                                    />
                                    <button type="button" onClick={() => removeSideEffect(index)} className="px-3 py-2 text-red-600 hover:text-red-800">
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addSideEffect} className="mt-2 text-primary-600 hover:text-primary-800 text-sm">
                                + Add Side Effect
                            </button>
                        </div>
                    </div>
                )}

                {formData.logType === 'healing_progress' && (
                    <div className="space-y-4">
                        {/* Recovery milestones */}
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-3">Recovery Milestones</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-md">
                                <label className="inline-flex items-center space-x-2">
                                    <input type="checkbox" name="milestones.swallowing" checked={formData.milestones.swallowing} onChange={handleInputChange} className="h-4 w-4 text-primary-600" />
                                    <span className="text-sm text-gray-700">Swallowing</span>
                                </label>
                                <label className="inline-flex items-center space-x-2">
                                    <input type="checkbox" name="milestones.breathing" checked={formData.milestones.breathing} onChange={handleInputChange} className="h-4 w-4 text-primary-600" />
                                    <span className="text-sm text-gray-700">Breathing</span>
                                </label>
                                <label className="inline-flex items-center space-x-2">
                                    <input type="checkbox" name="milestones.feverFree" checked={formData.milestones.feverFree} onChange={handleInputChange} className="h-4 w-4 text-primary-600" />
                                    <span className="text-sm text-gray-700">Fever-free</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            {renderLabel('Wound Condition', true)}
                            <select
                                name="healingProgress.woundCondition"
                                value={formData.healingProgress.woundCondition}
                                onChange={handleInputChange}
                                className={getFieldClassName('healingProgress.woundCondition')}
                            >
                                <option value="">-- Select Condition --</option>
                                <option value="healing_well">Healing Well</option>
                                <option value="minor_issues">Minor Issues</option>
                                <option value="concerning">Concerning</option>
                                <option value="needs_attention">Needs Attention</option>
                            </select>
                            {renderError('healingProgress.woundCondition')}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Progress Notes</label>
                            <textarea
                                name="healingProgress.notes"
                                value={formData.healingProgress.notes}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Describe the healing progress..."
                                className={getFieldClassName('healingProgress.notes')}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Next Checkup Date</label>
                            <input
                                type="date"
                                name="healingProgress.nextCheckup"
                                value={formData.healingProgress.nextCheckup}
                                onChange={handleInputChange}
                                min={new Date().toISOString().split('T')[0]}
                                className={getFieldClassName('healingProgress.nextCheckup')}
                            />
                            {renderError('healingProgress.nextCheckup')}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Attach Files (images/PDF)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                        </div>
                    </div>
                )}

                {/* Additional Notes - Always visible */}
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
                        rows="4"
                        placeholder="Any additional observations, symptoms, or important notes..."
                        className={getFieldClassName('notes', 'mt-1 block w-full border rounded-xl px-4 py-3 focus:outline-none bg-gray-50 hover:bg-white transition-colors resize-none')}
                    />
                    {renderError('notes')}
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
                            !isFormValid ? 'opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-slate-600 to-blue-700 hover:from-slate-700 hover:to-blue-800 shadow-lg'
                        }`}
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                    >
                        Add Health Log
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddHealthLogModal;
