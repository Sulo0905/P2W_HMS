import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useParams, Link } from 'react-router-dom';
import { entAPI } from '../../../services/healthlogs.service';
import { formatHospitalDateTime } from '../../../utils/datetime';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import AddHealthLogModal from '../../../components/AddHealthLogModal';

const EntLogs = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState<any | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [filters, setFilters] = useState({ logType: '', from: '', to: '', loggedBy: '' });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [openHistory, setOpenHistory] = useState({});
    const canEdit: boolean = true;
    const canDelete: boolean = true;
    const isPatient: boolean = false;

    interface FormDataType {
        logType: string;
        loggedBy: string;
        loggedAt: string;
        painLevel: string | number;
        // Recovery milestones
        milestones: { swallowing: boolean; breathing: boolean; feverFree: boolean };
        // Optional attachments (base64)
        attachmentsBase64: string[];
        breathingIssues: {
            hasIssues: boolean;
            description: string;
            severity: 'mild' | 'moderate' | 'severe';
        };
        throatDiscomfort: {
            hasDiscomfort: boolean;
            description: string;
            severity: 'mild' | 'moderate' | 'severe';
        };
        medication: {
            name: string;
            dosage: string;
            frequency: string;
            sideEffects: string[];
            takenAt: string;
        };
        healingProgress: {
            woundCondition: string;
            notes: string;
            photos: string[];
            nextCheckup: string;
        };
        notes: string;
        [key: string]: any;
    }

    const [formData, setFormData] = useState<FormDataType>({
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
    const [fieldErrors, setFieldErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    // Receipt toast state
    const [receiptToast, setReceiptToast] = useState({ visible: false, log: null });

    useEffect(() => {
        fetchPatientAndLogs();
    }, [id, page, limit, filters]);

    // Validate form whenever formData changes
    useEffect(() => {
        validateForm();
    }, [formData]);

    const fetchPatientAndLogs = async () => {
        try {
            setLoading(true);
            const response = await entAPI.getPatientById(id as string);
            setPatient(response.data.data);

            // Fetch logs with filters & pagination (excludes soft-deleted)
            const logsRes = await entAPI.listLogs(id as string, {
                logType: filters.logType || undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
                loggedBy: filters.loggedBy || undefined,
                page,
                limit,
            });
            // Ensure logs is always an array
            const logsData = logsRes.data.data.logs;
            setLogs(Array.isArray(logsData) ? logsData : []);
            setTotal(logsRes.data.data.totalCount || 0);
            setError(null);
        } catch (err) {
            setError('Failed to fetch patient data');
            console.error('Error fetching patient:', err);
        } finally {
            setLoading(false);
        }
    };

    interface OpenHistoryMap {
        [logId: string]: boolean;
    }

    // Minimal log/patient interfaces for clarity (expanded elsewhere as needed)
    interface EntLog {
        _id?: string;
        logType?: string;
        loggedAt?: string;
        createdAt?: string;
        [key: string]: any;
    }

    interface Patient {
        name?: string;
        patientId?: string;
        age?: number;
        gender?: string;
        phone?: string;
        email?: string;
        surgeryType?: string;
        surgeryDate?: string;
        [key: string]: any;
    }

    const toggleHistory = (logId: string) => {
        setOpenHistory((prev: OpenHistoryMap) => ({ ...prev, [logId]: !prev[logId] }));
    };

    // Build diff rows from history entry
    const buildDiffRows = (before: Record<string, any> = {}, after: Record<string, any> = {}) => {
        const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
        interface DiffRow {
            key: string;
            before: unknown;
            after: unknown;
        }
        const rows: DiffRow[] = [];
        keys.forEach((k: string) => {
            const b = before ? before[k] : undefined;
            const a = after ? after[k] : undefined;
            if (JSON.stringify(b) !== JSON.stringify(a)) {
                rows.push({ key: k, before: b, after: a });
            }
        });
        return rows;
    };

    // File attachments handler
    type Base64String = string;
    type FileInput = FileList | File[];

    const filesToBase64 = (files: FileInput): Promise<Base64String[]> => {
        const fileArray: File[] = files instanceof FileList ? Array.from(files) : files;
        const tasks: Promise<Base64String>[] = fileArray.map(
            (file: File) =>
                new Promise<Base64String>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(reader.error);
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

    // Build data for charts
    const painTrendData = logs
        .filter((l) => l.logType === 'pain_level' && typeof l.painLevel === 'number')
        .map((l) => ({
            date: new Date(l.loggedAt || l.createdAt).toLocaleDateString(),
            painLevel: l.painLevel,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Medication history events
    const medicationEvents = logs
        .filter((l) => l.logType === 'medication' || l.medication?.name)
        .map((l) => ({
            date: new Date(l.loggedAt || l.createdAt).toLocaleDateString(),
            name: l.medication?.name || '-',
            dosage: l.medication?.dosage || '-',
            frequency: l.medication?.frequency || '-',
            sideEffects: Array.isArray(l.medication?.sideEffects) ? l.medication.sideEffects : [],
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Recovery milestones: first achieved dates
    const milestoneNames = [
        { key: 'swallowing', label: 'Swallowing' },
        { key: 'breathing', label: 'Breathing' },
        { key: 'feverFree', label: 'Fever-free' },
    ];
    const milestoneFirstAchieved = milestoneNames.reduce((acc, m) => {
        acc[m.key] = null;
        return acc;
    }, {});
    logs.sort((a, b) => new Date(a.loggedAt || a.createdAt) - new Date(b.loggedAt || b.createdAt)).forEach((l) => {
        if (l.milestones) {
            milestoneNames.forEach((m) => {
                if (l.milestones[m.key] && !milestoneFirstAchieved[m.key]) {
                    milestoneFirstAchieved[m.key] = new Date(l.loggedAt || l.createdAt).toLocaleDateString();
                }
            });
        }
    });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(1); // reset to first page on filter change
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const validationMsg = validateForm();
            if (validationMsg) {
                setError(validationMsg);
                return;
            }
            const submitData = { ...formData };
            // If loggedAt is empty, default to now (ISO for backend)
            if (!submitData.loggedAt) {
                submitData.loggedAt = new Date().toISOString();
            } else if (submitData.loggedAt.length === 16) {
                // Convert datetime-local value to ISO if needed
                submitData.loggedAt = new Date(submitData.loggedAt).toISOString();
            }

            // Ensure loggedBy is not undefined, but can be empty string
            if (submitData.loggedBy === undefined) {
                submitData.loggedBy = '';
            }

            // Clean up empty side effects (only for medication logs)
            if (submitData.logType === 'medication' && submitData.medication?.sideEffects) {
                submitData.medication.sideEffects = submitData.medication.sideEffects.filter((effect) => effect.trim() !== '');
            }
            // Ensure milestones present for submit (only for healing progress logs)
            if (submitData.logType === 'healing_progress' && !submitData.milestones) {
                submitData.milestones = { swallowing: false, breathing: false, feverFree: false };
            }

            if (editingLog) {
                await entAPI.updateLog(id as string, editingLog._id, submitData);
            } else {
                const res = await entAPI.addLog(id as string, submitData);
                // Try to capture newly created log for receipt
                const updatedPatient = res?.data?.data;
                const latest = Array.isArray(updatedPatient?.logs) && updatedPatient.logs.length > 0 ? updatedPatient.logs[updatedPatient.logs.length - 1] : null;
                setReceiptToast({ visible: true, log: latest });
            }

            setShowModal(false);
            setEditingLog(null);
            resetForm();
            fetchPatientAndLogs();
        } catch (err) {
            setError(editingLog ? 'Failed to update log' : 'Failed to add log');
            console.error('Error saving log:', err);
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setFormData({
            logType: log.logType,
            loggedBy: log.loggedBy === 'System' ? '' : log.loggedBy || '',
            loggedAt: log.loggedAt ? new Date(log.loggedAt).toISOString().slice(0, 16) : '',
            milestones: log.milestones || { swallowing: false, breathing: false, feverFree: false },
            attachmentsBase64: [],
            painLevel: log.painLevel || '',
            breathingIssues: log.breathingIssues || { hasIssues: false, description: '', severity: 'mild' },
            throatDiscomfort: log.throatDiscomfort || { hasDiscomfort: false, description: '', severity: 'mild' },
            medication: log.medication || { name: '', dosage: '', frequency: '', sideEffects: [], takenAt: '' },
            healingProgress: log.healingProgress || { woundCondition: 'healing_well', notes: '', photos: [], nextCheckup: '' },
            notes: log.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (logId) => {
        console.log('Delete button clicked for logId:', logId);
        console.log('Patient ID:', id);
        console.log('Current user permissions:', { canDelete, canEdit, isPatient });

        if (window.confirm('Are you sure you want to delete this log?')) {
            console.log('User confirmed deletion');
            try {
                console.log('Calling API deleteLog with:', { patientId: id, logId });
                const response = await entAPI.deleteLog(id as string, logId);
                console.log('Delete API response:', response);
                fetchPatientAndLogs();
            } catch (err) {
                console.error('Error deleting log:', err);
                console.error('Error response:', err.response?.data);
                setError('Failed to delete log: ' + (err.response?.data?.message || err.message));
            }
        } else {
            console.log('User cancelled deletion');
        }
    };

    const resetForm = () => {
        setFormData({
            logType: 'pain_level',
            loggedBy: '',
            loggedAt: new Date().toISOString().slice(0, 16),
            milestones: { swallowing: false, breathing: false, feverFree: false },
            attachmentsBase64: [],
            painLevel: '',
            breathingIssues: { hasIssues: false, description: '', severity: 'mild' },
            throatDiscomfort: { hasDiscomfort: false, description: '', severity: 'mild' },
            medication: { name: '', dosage: '', frequency: '', sideEffects: [], takenAt: '' },
            healingProgress: { woundCondition: 'healing_well', notes: '', photos: [], nextCheckup: '' },
            notes: '',
        });
    };

    const openModal = () => {
        resetForm();
        setEditingLog(null);
        setShowModal(true);
    };

    const openAddModal = () => {
        setShowAddModal(true);
    };

    const handleAddLogSuccess = () => {
        fetchPatientAndLogs();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingLog(null);
        resetForm();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getLogTypeLabel = (logType) => {
        const labels = {
            pain_level: 'Pain Level',
            breathing_issues: 'Breathing Issues',
            medication: 'Medication',
            healing_progress: 'Healing Progress',
        };
        return labels[logType] || logType;
    };

    const getSeverityColor = (severity) => {
        const colors = {
            mild: 'bg-green-100 text-green-800',
            moderate: 'bg-yellow-100 text-yellow-800',
            severe: 'bg-red-100 text-red-800',
        };
        return colors[severity] || 'bg-gray-100 text-gray-800';
    };

    // Comprehensive field-level validation for ENT logs
    const validateForm = () => {
        const errors = {};

        // Required field: Log Type
        if (!formData.logType) {
            errors['logType'] = 'Log Type is required.';
        }

        // Keep loggedBy as is, even if empty

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

        // Medication validation - No validation, all fields optional
        if (t === 'medication') {
            // No validation - all fields are optional
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

    // Allow editing Surgery Type from filters bar
    const handleSurgeryTypeChange = async (e) => {
        const newType = e.target.value;
        // Optimistic UI update
        setPatient((prev) => (prev ? { ...prev, surgeryType: newType } : prev));
        try {
            await entAPI.updatePatient(id as string, { surgeryType: newType });
        } catch (err) {
            console.error('Failed to update surgery type', err);
            // revert on failure by refetching
            fetchPatientAndLogs();
        }
    };

    // Generate printable receipt (no extra dependency)
    const buildReceiptHtml = (p, l) => {
        const style = `
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; padding: 24px; color: #111827; }
        .receipt-container { max-width: 720px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(17, 24, 39, 0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); color: white; padding: 24px; text-align: center; }
        .clinic { font-size: 12px; letter-spacing: 0.5px; opacity: 0.95; }
        .title { font-size: 20px; font-weight: 800; margin-top: 6px; }
        .meta { font-size: 12px; opacity: 0.9; margin-top: 6px; }
        .content { padding: 20px; }
        .section { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 14px 0; }
        .section h3 { margin: 0 0 10px 0; font-size: 14px; color: #374151; font-weight: 700; }
        .row { display: flex; gap: 16px; }
        .col { flex: 1; }
        .label { display: block; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .value { font-weight: 700; color: #111827; }
        .footer { padding: 14px 20px; font-size: 12px; color: #6b7280; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        @media print { body { background: white; padding: 0 } .receipt-container { box-shadow: none; } }
      </style>
    `;
        const rid = `ENT-${(l._id || '').slice(-6).toUpperCase()}-${new Date(l.loggedAt || l.createdAt || Date.now()).getTime()}`;
        const clinic = 'Path2Welness';
        const rows = [];
        if (l.logType === 'pain_level') rows.push(`<div class="row"><div class="col"><span class="label">Pain Level</span><div class="value">${l.painLevel}/10</div></div></div>`);
        if (l.logType === 'breathing_issues')
            rows.push(`
      <div class="row">
        <div class="col"><span class="label">Breathing Issues</span><div class="value">${l?.breathingIssues?.hasIssues ? l?.breathingIssues?.severity || '-' : 'No'}</div></div>
        <div class="col"><span class="label">Description</span><div class="value">${l?.breathingIssues?.description || '-'}</div></div>
      </div>
      <div class="row">
        <div class="col"><span class="label">Throat Discomfort</span><div class="value">${l?.throatDiscomfort?.hasDiscomfort ? l?.throatDiscomfort?.severity || '-' : 'No'}</div></div>
        <div class="col"><span class="label">Description</span><div class="value">${l?.throatDiscomfort?.description || '-'}</div></div>
      </div>
    `);
        if (l.logType === 'medication')
            rows.push(`
      <div class="row">
        <div class="col"><span class="label">Medication</span><div class="value">${l?.medication?.name || '-'}</div></div>
        <div class="col"><span class="label">Dosage</span><div class="value">${l?.medication?.dosage || '-'}</div></div>
      </div>
      <div class="row">
        <div class="col"><span class="label">Frequency</span><div class="value">${l?.medication?.frequency || '-'}</div></div>
        <div class="col"><span class="label">Side Effects</span><div class="value">${
            Array.isArray(l?.medication?.sideEffects) && l.medication.sideEffects.length ? l.medication.sideEffects.join(', ') : '-'
        }</div></div>
      </div>
    `);
        if (l.logType === 'healing_progress')
            rows.push(`
      <div class="row">
        <div class="col"><span class="label">Wound Condition</span><div class="value">${(l?.healingProgress?.woundCondition || '-').replace('_', ' ')}</div></div>
        <div class="col"><span class="label">Next Checkup</span><div class="value">${l?.healingProgress?.nextCheckup ? new Date(l.healingProgress.nextCheckup).toLocaleDateString() : '-'}</div></div>
      </div>
      <div class="row"><div class="col"><span class="label">Notes</span><div class="value">${l?.healingProgress?.notes || '-'}</div></div></div>
    `);
        if (l.notes) rows.push(`<div class="row"><div class="col"><span class="label">Additional Notes</span><div class="value">${l.notes}</div></div></div>`);

        const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>ENT Log Receipt</title>
          ${style}
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="clinic">${clinic}</div>
              <div class="title">ENT Health Log Receipt</div>
              <div class="meta">Receipt ID: ${rid}</div>
            </div>
            <div class="content">
              <div class="section">
                <h3>Patient Information</h3>
                <div class="row">
                  <div class="col"><span class="label">Patient Name</span><div class="value">${p?.name || '-'}</div></div>
                  <div class="col"><span class="label">Patient ID</span><div class="value">${p?.patientId || '-'}</div></div>
                </div>
                <div class="row">
                  <div class="col"><span class="label">Age / Gender</span><div class="value">${p?.age ?? '-'} ${p?.gender ? '/ ' + p.gender : ''}</div></div>
                  <div class="col"><span class="label">Contact</span><div class="value">${p?.phone || '-'} ${p?.email ? '• ' + p.email : ''}</div></div>
                </div>
              </div>
              <div class="section">
                <h3>Log Details</h3>
                <div class="row">
                  <div class="col"><span class="label">Logged At</span><div class="value">${formatHospitalDateTime(l.loggedAt || l.createdAt)}</div></div>
                  <div class="col"><span class="label">Logged By</span><div class="value">${l.loggedBy || '-'}</div></div>
                </div>
                ${rows.join('')}
              </div>
            </div>
            <div class="footer">Generated on ${formatHospitalDateTime(new Date())}
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">This is an automated receipt from Path2Welness Health Management System</div>
            </div>
          </div>
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `;
        return html;
    };

    const handleGenerateReceipt = (log) => {
        try {
            const w = window.open('', '_blank');
            if (!w) return;
            const html = buildReceiptHtml(patient, log);
            w.document.open();
            w.document.write(html);
            w.document.close();
        } catch (e) {
            console.error('Failed to generate receipt', e);
            setError('Failed to generate receipt');
        }
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/ent"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to ENT Patients
                            </Link>
                        </div>
                        {canEdit && (
                            <Button
                                onClick={openAddModal}
                                icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                }
                            >
                                Add New Health Log
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Log Type</label>
                                <select
                                    name="logType"
                                    value={filters.logType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                >
                                    <option value="">All Types</option>
                                    <option value="pain_level">Pain Level</option>
                                    <option value="breathing_issues">Breathing Issues</option>
                                    <option value="medication">Medication</option>
                                    <option value="healing_progress">Healing Progress</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    name="from"
                                    value={filters.from}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">To Date</label>
                                <input
                                    type="date"
                                    name="to"
                                    value={filters.to}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Logged By</label>
                                <input
                                    type="text"
                                    name="loggedBy"
                                    value={filters.loggedBy}
                                    onChange={handleFilterChange}
                                    placeholder="Doctor/Nurse name"
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Surgery Type</label>
                                <select
                                    name="surgeryType"
                                    value={patient?.surgeryType || ''}
                                    onChange={handleSurgeryTypeChange}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                >
                                    <option value="">Select surgery type</option>
                                    <option value="Tonsillectomy">Tonsillectomy</option>
                                    <option value="Adenoidectomy">Adenoidectomy</option>
                                    <option value="Septoplasty">Septoplasty</option>
                                    <option value="FESS">FESS</option>
                                    <option value="Myringotomy">Myringotomy</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {patient && (
                        <Card>
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xl">
                                    {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900">{patient.name} - Recovery Logs</h1>
                                    <p className="text-neutral-600 mt-1">
                                        Surgery: <Badge variant="info">{patient.surgeryType}</Badge> on {formatDate(patient.surgeryDate)}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Timeline */}
                    {logs.length > 0 && (
                        <Card>
                            <h2 className="text-xl font-bold text-neutral-900 mb-6">Recovery Timeline</h2>
                            <div className="space-y-3">
                                {[...logs]
                                    .sort((a, b) => new Date(a.loggedAt || a.createdAt) - new Date(b.loggedAt || b.createdAt))
                                    .map((l) => (
                                        <div key={l._id} className="flex items-start space-x-3">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-primary-500"></div>
                                            <div>
                                                <div className="text-sm text-gray-500">{formatHospitalDateTime(l.loggedAt || l.createdAt)}</div>
                                                <div className="text-gray-900">
                                                    <span className="font-medium">{getLogTypeLabel(l.logType)}</span>
                                                    {l.loggedBy && <span className="text-gray-600"> • by {l.loggedBy}</span>}
                                                </div>
                                                {l.notes && <div className="text-sm text-gray-700">{l.notes}</div>}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    )}

                    {/* Medication History */}
                    {medicationEvents.length > 0 && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Medication History</h2>
                            <div className="space-y-3">
                                {medicationEvents.map((e, idx) => (
                                    <div key={idx} className="flex items-start justify-between border rounded p-3">
                                        <div>
                                            <div className="text-sm text-gray-500">{e.date}</div>
                                            <div className="text-gray-900 font-medium">{e.name}</div>
                                            <div className="text-gray-700 text-sm">
                                                Dosage: {e.dosage} • Frequency: {e.frequency}
                                            </div>
                                            {e.sideEffects.length > 0 && <div className="text-gray-600 text-sm">Side Effects: {e.sideEffects.join(', ')}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recovery Milestones */}
                    <Card>
                        <h2 className="text-xl font-bold text-neutral-900 mb-6">Recovery Milestones</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {milestoneNames.map((m) => {
                                const date = milestoneFirstAchieved[m.key];
                                const achieved = Boolean(date);
                                return (
                                    <div key={m.key} className={`rounded border p-4 ${achieved ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="text-sm text-gray-500">{m.label}</div>
                                        <div className="mt-1 font-semibold {achieved ? 'text-green-700' : 'text-gray-700'}">{achieved ? `Achieved on ${date}` : 'Not achieved yet'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Pain Trend Chart */}
                    {painTrendData.length > 0 && (
                        <Card>
                            <h2 className="text-xl font-bold text-neutral-900 mb-6">Pain Level Trend</h2>
                            <div className="w-full h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={painTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis domain={[0, 10]} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="painLevel" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Pain Level" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

                    <div className="grid gap-6">
                        {logs.map((log) => (
                            <Card key={log._id}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {getLogTypeLabel(log.logType)}
                                            {log.trimester && ` - Trimester ${log.trimester}`}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {formatHospitalDateTime(log.loggedAt || log.createdAt)}
                                            {log.loggedBy ? ` • by ${log.loggedBy}` : ''}
                                        </p>
                                        {Array.isArray(log.history) && log.history.length > 0 && (
                                            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Edited</span>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        {!isPatient && canEdit && (
                                            <Button
                                                onClick={() => handleEdit(log)}
                                                variant="secondary"
                                                size="sm"
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                }
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => handleGenerateReceipt(log)}
                                            variant="success"
                                            size="sm"
                                            icon={
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                            }
                                        >
                                            Receipt
                                        </Button>
                                        {!isPatient && canDelete && (
                                            <Button
                                                onClick={() => handleDelete(log._id)}
                                                variant="danger"
                                                size="sm"
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                }
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {log.logType === 'pain_level' && (
                                        <div>
                                            <span className="font-medium">Pain Level: </span>
                                            <span className="text-2xl font-bold text-red-600">{log.painLevel}/10</span>
                                        </div>
                                    )}

                                    {log.logType === 'breathing_issues' && (
                                        <div className="space-y-2">
                                            {log.breathingIssues?.hasIssues && (
                                                <div>
                                                    <span className="font-medium">Breathing Issues: </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(log.breathingIssues.severity)}`}>
                                                        {log.breathingIssues.severity}
                                                    </span>
                                                    {log.breathingIssues.description && <p className="mt-1 text-gray-600">{log.breathingIssues.description}</p>}
                                                </div>
                                            )}
                                            {log.throatDiscomfort?.hasDiscomfort && (
                                                <div>
                                                    <span className="font-medium">Throat Discomfort: </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(log.throatDiscomfort.severity)}`}>
                                                        {log.throatDiscomfort.severity}
                                                    </span>
                                                    {log.throatDiscomfort.description && <p className="mt-1 text-gray-600">{log.throatDiscomfort.description}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'medication' && (
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium">Medication: </span>
                                                <span>{log.medication?.name}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Dosage: </span>
                                                <span>{log.medication?.dosage}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium">Frequency: </span>
                                                <span>{log.medication?.frequency}</span>
                                            </div>
                                            {log.medication?.sideEffects && log.medication.sideEffects.length > 0 && (
                                                <div>
                                                    <span className="font-medium">Side Effects: </span>
                                                    <span>{log.medication.sideEffects.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'healing_progress' && (
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-medium">Wound Condition: </span>
                                                <span className="capitalize">{log.healingProgress?.woundCondition?.replace('_', ' ')}</span>
                                            </div>
                                            {log.healingProgress?.notes && (
                                                <div>
                                                    <span className="font-medium">Notes: </span>
                                                    <span>{log.healingProgress.notes}</span>
                                                </div>
                                            )}
                                            {log.healingProgress?.nextCheckup && (
                                                <div>
                                                    <span className="font-medium">Next Checkup: </span>
                                                    <span>{formatDate(log.healingProgress.nextCheckup)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.notes && (
                                        <div>
                                            <span className="font-medium">Additional Notes: </span>
                                            <span>{log.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}

                        {logs.length === 0 && (
                            <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                                <p className="text-neutral-500">No logs found. Add your first log to track recovery progress.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-neutral-600">Total: {total}</div>
                        <div className="flex space-x-2">
                            <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="secondary" size="sm">
                                Previous
                            </Button>
                            <span className="text-sm text-neutral-600 px-3 py-1">Page {page}</span>
                            <Button
                                onClick={() => {
                                    const maxPage = Math.max(1, Math.ceil(total / limit));
                                    setPage((p) => Math.min(maxPage, p + 1));
                                }}
                                disabled={page >= Math.ceil(total / limit)}
                                variant="secondary"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Log Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingLog ? 'Edit Health Log' : 'Add New Health Log'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        {renderLabel('Log Type', true)}
                        <select name="logType" value={formData.logType} onChange={handleInputChange} className={getFieldClassName('logType')}>
                            <option value="">-- Select Log Type --</option>
                            <option value="pain_level">Pain Level</option>
                            <option value="breathing_issues">Breathing Issues</option>
                            <option value="medication">Medication</option>
                            <option value="healing_progress">Healing Progress</option>
                        </select>
                        {renderError('logType')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            {renderLabel('Logged By', true)}
                            <input type="text" name="loggedBy" value={formData.loggedBy} onChange={handleInputChange} placeholder="Doctor/Nurse name" className={getFieldClassName('loggedBy')} />
                            {renderError('loggedBy')}
                        </div>
                        <div>
                            {renderLabel('Logged At')}
                            <input type="datetime-local" name="loggedAt" value={formData.loggedAt} onChange={handleInputChange} className={getFieldClassName('loggedAt')} />
                            {renderError('loggedAt')}
                        </div>
                    </div>

                    {formData.logType === 'pain_level' && (
                        <div>
                            {renderLabel('Pain Level (0-10)', true)}
                            <input
                                type="number"
                                name="painLevel"
                                value={formData.painLevel}
                                onChange={handleInputChange}
                                min="0"
                                max="10"
                                step="1"
                                placeholder="Enter pain level from 0 to 10"
                                className={getFieldClassName('painLevel')}
                            />
                            {renderError('painLevel')}
                            <div className="text-xs text-gray-500 mt-1">0 = No pain, 10 = Severe pain</div>
                        </div>
                    )}

                    {formData.logType === 'breathing_issues' && (
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-3">
                                    Select at least one issue <span className="text-red-500">*</span>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="breathingIssues.hasIssues"
                                        checked={formData.breathingIssues.hasIssues}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">Breathing Issues</label>
                                </div>
                                {renderError('breathingIssues.hasIssues')}
                            </div>

                            {formData.breathingIssues.hasIssues && (
                                <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-md">
                                    <div>
                                        {renderLabel('Severity', true)}
                                        <select
                                            name="breathingIssues.severity"
                                            value={formData.breathingIssues.severity}
                                            onChange={handleInputChange}
                                            className={getFieldClassName('breathingIssues.severity')}
                                        >
                                            <option value="">-- Select Severity --</option>
                                            <option value="mild">Mild</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="severe">Severe</option>
                                        </select>
                                        {renderError('breathingIssues.severity')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            name="breathingIssues.description"
                                            value={formData.breathingIssues.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Describe the breathing issues..."
                                            className={getFieldClassName('breathingIssues.description')}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="throatDiscomfort.hasDiscomfort"
                                    checked={formData.throatDiscomfort.hasDiscomfort}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">Throat Discomfort</label>
                            </div>
                            {formData.throatDiscomfort.hasDiscomfort && (
                                <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-md">
                                    <div>
                                        {renderLabel('Severity', true)}
                                        <select
                                            name="throatDiscomfort.severity"
                                            value={formData.throatDiscomfort.severity}
                                            onChange={handleInputChange}
                                            className={getFieldClassName('throatDiscomfort.severity')}
                                        >
                                            <option value="">-- Select Severity --</option>
                                            <option value="mild">Mild</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="severe">Severe</option>
                                        </select>
                                        {renderError('throatDiscomfort.severity')}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            name="throatDiscomfort.description"
                                            value={formData.throatDiscomfort.description}
                                            onChange={handleInputChange}
                                            rows="2"
                                            placeholder="Describe the throat discomfort..."
                                            className={getFieldClassName('throatDiscomfort.description')}
                                        />
                                    </div>
                                </div>
                            )}
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
                                        <input
                                            type="checkbox"
                                            name="milestones.swallowing"
                                            checked={formData.milestones.swallowing}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-primary-600"
                                        />
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows="3"
                            placeholder="Any additional observations or notes..."
                            className={getFieldClassName('notes')}
                        />
                        {renderError('notes')}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid}
                            className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            }
                        >
                            {editingLog ? 'Update Log' : 'Add Log'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Health Log Modal */}
            <AddHealthLogModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleAddLogSuccess} preselectedPatientId={id as string} preselectedPatientInfo={patient} />
        </div>
    );
};

export default EntLogs;
