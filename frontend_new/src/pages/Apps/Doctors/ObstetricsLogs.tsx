import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useParams, Link } from 'react-router-dom';
import { obstetricsAPI } from '../../../services/healthlogs.service';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import { formatHospitalDateTime } from '../../../utils/datetime';
import AddObstetricsLogModal from '../../../components/AddObstetricsLogModal';

const ObstetricsLogs = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [filters, setFilters] = useState({ logType: '', from: '', to: '', loggedBy: '', trimester: '' });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [openHistory, setOpenHistory] = useState({});
    const [receiptToast, setReceiptToast] = useState({ visible: false, log: null });
    const [fieldErrors, setFieldErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isPatient: boolean = false;

    // Fetch suggestions based on input
    const fetchSuggestions = async (input) => {
        if (!input || input.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            // Get existing logs and extract unique loggedBy values
            const response = await obstetricsAPI.listLogs(id, { limit: 1000 });
            const logs = response.data.data || [];

            // Filter and map unique loggedBy values that match the input
            const loggedBySet = new Set();
            const filtered = logs
                .filter((log) => log.loggedBy && log.loggedBy.toLowerCase().includes(input.toLowerCase()))
                .map((log) => log.loggedBy)
                .filter((loggedBy) => {
                    if (!loggedBy || loggedBySet.has(loggedBy)) return false;
                    loggedBySet.add(loggedBy);
                    return true;
                });

            setSuggestions(filtered.slice(0, 5)); // Show top 5 suggestions
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        }
    };

    // Handle input change with debounce for suggestions
    const handleLoggedByChange = (e) => {
        const { value } = e.target;

        // Update the form data
        handleInputChange(e);

        // Debounce the suggestion fetch
        const timer = setTimeout(() => {
            fetchSuggestions(value);
        }, 300);

        return () => clearTimeout(timer);
    };

    // Select a suggestion
    const selectSuggestion = (suggestion) => {
        setFormData((prev) => ({
            ...prev,
            loggedBy: suggestion,
        }));
        setShowSuggestions(false);
    };

    // Helper function to get current date and time in local format
    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`,
            dateTimeLocal: `${year}-${month}-${day}T${hours}:${minutes}`,
        };
    };

    const [formData, setFormData] = useState({
        logType: 'trimester_symptoms',
        loggedBy: '',
        // Initialize with current date and time
        loggedDate: getCurrentDateTimeLocal().date,
        loggedTime: getCurrentDateTimeLocal().time,
        loggedAt: getCurrentDateTimeLocal().dateTimeLocal,
        trimester: 1,
        // Simple Vitals & Tests fields (per minimal spec)
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
            const response = await obstetricsAPI.getPatientById(id);
            setPatient(response.data.data);

            const logsRes = await obstetricsAPI.listLogs(id, {
                logType: filters.logType || undefined,
                from: filters.from || undefined,
                to: filters.to || undefined,
                loggedBy: filters.loggedBy || undefined,
                trimester: filters.trimester || undefined,
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

    // Single-field validator for real-time feedback
    const validateSingle = (name, value, nextForm) => {
        // Only validate relevant fields
        if (name === 'vitalsTests.bloodPressure') {
            if (!value) return '';
            if (!value.includes('/')) return 'Blood Pressure should be like 120/80.';
            const parts = value.split('/').map((p) => parseInt(p.trim(), 10));
            if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return 'Blood Pressure should be like 120/80.';
            if (parts[0] < 50 || parts[0] > 250 || parts[1] < 30 || parts[1] > 150) return 'Blood Pressure values look invalid.';
            return '';
        }
        if (name === 'vitalsTests.bloodSugar') {
            if (value === '' || value === null || value === undefined) return '';
            const n = Number(value);
            if (isNaN(n) || n < 20 || n > 600) return 'Blood Sugar value looks invalid.';
            return '';
        }
        if (name === 'vitalsTests.weight') {
            if (value === '' || value === null || value === undefined) return '';
            const n = Number(value);
            if (isNaN(n) || n < 20 || n > 250) return 'Weight value looks invalid.';
            return '';
        }
        if (name === 'vitalsTests.fetalHeartRate') {
            if (value === '' || value === null || value === undefined) return '';
            const n = Number(value);
            if (isNaN(n) || n < 60 || n > 220) return 'Fetal Heart Rate value looks invalid.';
            return '';
        }
        if (name === 'babyMovement.week') {
            const wk = Number(value);
            if (!Number.isInteger(wk) || wk < 1 || wk > 40) return 'Week must be 1–40.';
            return '';
        }
        if (name === 'babyMovement.movementLevel') {
            const v = String(value || '').toLowerCase();
            if (!['low', 'medium', 'high'].includes(v)) return 'Select Low / Medium / High.';
            return '';
        }
        if (name === 'sleepNutrition.sleepHours') {
            if (value === '' || value === null || value === undefined) return '';
            const n = Number(value);
            if (isNaN(n) || n < 0 || n > 24) return 'Sleep hours must be 0–24.';
            return '';
        }
        if (name === 'sleepNutrition.waterIntake') {
            if (value === '' || value === null || value === undefined) return '';
            const n = Number(value);
            if (isNaN(n) || n < 0 || n > 20) return 'Water intake looks invalid.';
            return '';
        }
        return '';
    };

    // Comprehensive field-level validation for Obstetrics logs
    const validateForm = () => {
        const errs = {};

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
            const v = formData.vitalsTests || {};

            // Blood Pressure validation (enhanced)
            if (v.bloodPressure?.trim()) {
                if (!v.bloodPressure.includes('/')) {
                    errs['vitalsTests.bloodPressure'] = 'Blood Pressure should be in format 120/80.';
                } else {
                    const parts = v.bloodPressure.split('/').map((p) => parseInt(p.trim(), 10));
                    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
                        errs['vitalsTests.bloodPressure'] = 'Blood Pressure should be in format 120/80.';
                    } else if (parts[0] < 80 || parts[0] > 200 || parts[1] < 50 || parts[1] > 120) {
                        errs['vitalsTests.bloodPressure'] = 'Blood Pressure values should be 80-200/50-120.';
                    }
                }
            }

            // Blood Sugar validation (enhanced)
            if (v.bloodSugar && String(v.bloodSugar).trim()) {
                const sugar = Number(v.bloodSugar);
                if (isNaN(sugar) || sugar < 50 || sugar > 400) {
                    errs['vitalsTests.bloodSugar'] = 'Blood Sugar should be between 50-400 mg/dL.';
                }
            }

            // Weight validation (enhanced)
            if (v.weight !== '' && v.weight != null) {
                const weight = Number(v.weight);
                if (isNaN(weight) || weight < 30 || weight > 150) {
                    errs['vitalsTests.weight'] = 'Weight should be between 30-150 kg.';
                }
            }

            // Fetal Heart Rate validation (enhanced)
            if (v.fetalHeartRate !== '' && v.fetalHeartRate != null) {
                const fhr = Number(v.fetalHeartRate);
                if (isNaN(fhr) || fhr < 110 || fhr > 180) {
                    errs['vitalsTests.fetalHeartRate'] = 'Fetal Heart Rate should be between 110-180 bpm.';
                }
            }
        }

        // Trimester Symptoms validation
        if (t === 'trimester_symptoms') {
            const tri = Number(formData.trimester);
            if (!Number.isInteger(tri) || tri < 1 || tri > 3) {
                errs['trimester'] = 'Trimester must be 1, 2, or 3.';
            }
        }

        // Baby Movement validation
        if (t === 'baby_movement') {
            const bm = formData.babyMovement || {};
            const wk = Number(bm.week);
            if (!Number.isInteger(wk) || wk < 1 || wk > 42) {
                errs['babyMovement.week'] = 'Pregnancy week must be between 1-42.';
            }
            if (!['low', 'medium', 'high'].includes(String(bm.movementLevel || '').toLowerCase())) {
                errs['babyMovement.movementLevel'] = 'Movement level is required.';
            }
        }

        // Sleep & Nutrition validation
        if (t === 'sleep_nutrition') {
            const sn = formData.sleepNutrition || {};
            if (sn.sleepHours !== '' && sn.sleepHours != null) {
                const hours = Number(sn.sleepHours);
                if (isNaN(hours) || hours < 0 || hours > 24) {
                    errs['sleepNutrition.sleepHours'] = 'Sleep hours must be between 0-24.';
                }
            }
            if (sn.waterIntake !== '' && sn.waterIntake != null) {
                const water = Number(sn.waterIntake);
                if (isNaN(water) || water < 0 || water > 10) {
                    errs['sleepNutrition.waterIntake'] = 'Water intake should be between 0-10 liters.';
                }
            }
        }

        if (t === 'postnatal_recovery') {
            const pr = formData.postnatalRecovery || {};
            if (pr.bleeding?.hasBleeding && !['light', 'moderate', 'heavy'].includes(pr.bleeding.severity)) {
                errs['postnatalRecovery.bleeding.severity'] = 'Severity must be light, moderate, or heavy.';
            }
            if (pr.painLevel !== '' && (isNaN(Number(pr.painLevel)) || Number(pr.painLevel) < 0 || Number(pr.painLevel) > 10)) {
                errs['postnatalRecovery.painLevel'] = 'Pain Level must be 0–10.';
            }
        }

        setFieldErrors(errs);
        const isValid = Object.keys(errs).length === 0;
        setIsFormValid(isValid);

        return isValid ? '' : 'Please fix the errors below.';
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

    const toggleHistory = (logId) => {
        setOpenHistory((prev) => ({ ...prev, [logId]: !prev[logId] }));
    };

    // Build diff rows from history before/after
    const buildDiffRows = (before = {}, after = {}) => {
        const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
        const rows = [];
        keys.forEach((k) => {
            const b = before ? before[k] : undefined;
            const a = after ? after[k] : undefined;
            if (JSON.stringify(b) !== JSON.stringify(a)) {
                rows.push({ key: k, before: b, after: a });
            }
        });
        return rows;
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle date and time changes
        if (name === 'loggedDate' || name === 'loggedTime') {
            setFormData((prev) => {
                const date = name === 'loggedDate' ? value : prev.loggedDate;
                const time = name === 'loggedTime' ? value : prev.loggedTime;
                const dateTimeLocal = date && time ? `${date}T${time}` : '';

                const next = {
                    ...prev,
                    [name]: value,
                    loggedAt: dateTimeLocal,
                };

                // Validate the changed field
                const msg = validateSingle(name, value, next);
                setFieldErrors((errs) => ({ ...errs, [name]: msg || undefined }));

                return next;
            });
            return;
        }

        // Handle nested fields (e.g., vitalsTests.bloodPressure)
        if (name.includes('.')) {
            const [parent, child, subChild] = name.split('.');
            setFormData((prev) => {
                let next;
                if (subChild) {
                    next = {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: {
                                ...(prev[parent]?.[child] || {}),
                                [subChild]: type === 'checkbox' ? checked : value,
                            },
                        },
                    };
                } else {
                    next = {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: type === 'checkbox' ? checked : value,
                        },
                    };
                }

                // Validate the changed field
                const msg = validateSingle(name, type === 'checkbox' ? checked : value, next);
                setFieldErrors((errs) => ({ ...errs, [name]: msg || undefined }));

                return next;
            });
            return;
        }

        // Handle regular fields
        setFormData((prev) => {
            const next = { ...prev, [name]: type === 'checkbox' ? checked : value };

            // Validate the changed field
            const msg = validateSingle(name, type === 'checkbox' ? checked : value, next);
            setFieldErrors((errs) => ({ ...errs, [name]: msg || undefined }));

            return next;
        });
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

            // If logging Vitals & Tests, construct payload that matches backend schema
            if (submitData.logType === 'vitals_tests') {
                const { bloodPressure, bloodSugar, weight, fetalHeartRate, symptoms, medication, testResults, logDate } = submitData.vitalsTests || {};

                // Parse blood pressure like "120/80" into systolic/diastolic if possible
                let systolic, diastolic;
                if (bloodPressure && bloodPressure.includes('/')) {
                    const parts = bloodPressure.split('/').map((p) => parseInt(p.trim(), 10));
                    if (!Number.isNaN(parts[0])) systolic = parts[0];
                    if (!Number.isNaN(parts[1])) diastolic = parts[1];
                }

                submitData.vitals = {
                    bloodPressure: {
                        ...(systolic !== undefined ? { systolic } : {}),
                        ...(diastolic !== undefined ? { diastolic } : {}),
                    },
                    ...(bloodSugar ? { sugarLevel: Number(bloodSugar) } : {}),
                    ...(weight ? { weightKg: Number(weight) } : {}),
                    ...(fetalHeartRate ? { fetalHeartRate: Number(fetalHeartRate) } : {}),
                };

                // Store medication as a simple one-item array if provided
                if (medication && medication.trim()) {
                    submitData.medications = [{ name: medication.trim() }];
                }

                // Store test results under ultrasound.notes for simplicity
                if (testResults && testResults.trim()) {
                    submitData.tests = {
                        ultrasound: {
                            notes: testResults.trim(),
                        },
                        labs: [],
                    };
                }

                // Use symptoms into top-level notes for visibility
                if (symptoms && symptoms.trim()) {
                    submitData.notes = symptoms.trim();
                }

                // Map logDate to loggedAt if provided
                if (logDate) {
                    submitData.loggedAt = new Date(logDate).toISOString();
                }
            }

            // Set the loggedAt from the combined date and time
            if (submitData.loggedDate && submitData.loggedTime) {
                submitData.loggedAt = new Date(`${submitData.loggedDate}T${submitData.loggedTime}`).toISOString();
            } else {
                // Fallback to current time if not set
                submitData.loggedAt = new Date().toISOString();
            }

            // Remove temporary fields before submitting
            const { loggedDate, loggedTime, ...dataToSubmit } = submitData;

            if (editingLog) {
                await obstetricsAPI.updateLog(id, editingLog._id, dataToSubmit);
            } else {
                await obstetricsAPI.addLog(id, dataToSubmit);
            }

            setShowModal(false);
            setEditingLog(null);
            resetForm();
            fetchPatientAndLogs();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || (editingLog ? 'Failed to update log' : 'Failed to add log');
            setError(msg);
            console.error('Error saving log:', err);
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setFormData({
            logType: log.logType,
            loggedBy: log.loggedBy || '',
            loggedAt: log.loggedAt ? new Date(log.loggedAt).toISOString().slice(0, 16) : '',
            vitalsTests: {
                bloodPressure: log.vitals?.bloodPressure ? `${log.vitals.bloodPressure.systolic || ''}${log.vitals.bloodPressure.systolic ? '/' : ''}${log.vitals.bloodPressure.diastolic || ''}` : '',
                bloodSugar: log.vitals?.sugarLevel ?? '',
                weight: log.vitals?.weightKg ?? '',
                fetalHeartRate: log.vitals?.fetalHeartRate ?? '',
                symptoms: log.notes || '',
                medication: (log.medications && log.medications[0]?.name) || '',
                testResults: log.tests?.ultrasound?.notes || '',
                logDate: log.loggedAt ? new Date(log.loggedAt).toISOString().slice(0, 16) : '',
            },
            trimester: log.trimester || 1,
            symptoms: log.symptoms || {
                nausea: { hasSymptom: false, severity: 'mild', notes: '' },
                cramps: { hasSymptom: false, severity: 'mild', notes: '' },
                mood: { level: 'good', notes: '' },
                otherSymptoms: [],
            },
            babyMovement: log.babyMovement
                ? {
                      week: log.babyMovement.week || 1,
                      movementLevel: log.babyMovement.movementLevel || 'medium',
                      notes: log.babyMovement.notes || '',
                      timeOfDay: log.babyMovement.timeOfDay || 'morning',
                  }
                : { week: 1, movementLevel: 'medium', notes: '', timeOfDay: 'morning' },
            sleepNutrition: log.sleepNutrition || { sleepHours: '', sleepQuality: 'good', nutritionNotes: '', waterIntake: '', supplements: [], cravings: [] },
            postnatalRecovery: log.postnatalRecovery || {
                bleeding: { hasBleeding: false, severity: 'light', color: 'red' },
                stitches: { hasStitches: false, condition: 'healing_well', notes: '' },
                breastfeeding: { isBreastfeeding: false, frequency: '', duration: '', issues: [], notes: '' },
                painLevel: '',
                energyLevel: 'medium',
            },
            notes: log.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (logId) => {
        if (window.confirm('Are you sure you want to delete this log?')) {
            try {
                await obstetricsAPI.deleteLog(id, logId);
                fetchPatientAndLogs();
            } catch (err) {
                setError('Failed to delete log');
                console.error('Error deleting log:', err);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            logType: 'trimester_symptoms',
            loggedBy: '',
            // Keep empty so validation doesn't run when field is hidden
            loggedAt: '',
            vitalsTests: { bloodPressure: '', bloodSugar: '', weight: '', fetalHeartRate: '', symptoms: '', medication: '', testResults: '', logDate: '' },
            trimester: 1,
            symptoms: { nausea: { hasSymptom: false, severity: 'mild', notes: '' }, cramps: { hasSymptom: false, severity: 'mild', notes: '' }, mood: { level: 'good', notes: '' }, otherSymptoms: [] },
            babyMovement: { week: 1, movementLevel: 'medium', notes: '', timeOfDay: 'morning' },
            sleepNutrition: { sleepHours: '', sleepQuality: 'good', nutritionNotes: '', waterIntake: '', supplements: [], cravings: [] },
            postnatalRecovery: {
                bleeding: { hasBleeding: false, severity: 'light', color: 'red' },
                stitches: { hasStitches: false, condition: 'healing_well', notes: '' },
                breastfeeding: { isBreastfeeding: false, frequency: '', duration: '', issues: [], notes: '' },
                painLevel: '',
                energyLevel: 'medium',
            },
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

    // Generate printable receipt (no extra dependency)
    const buildReceiptHtml = (p, l) => {
        // Debug: Log the actual data structure
        console.log('Receipt generation - Patient data:', p);
        console.log('Receipt generation - Log data:', l);
        const style = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 32px;
          color: #1f2937;
          background: #f9fafb;
          line-height: 1.5;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .clinic { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .meta { font-size: 14px; opacity: 0.9; }
        .content { padding: 32px; }
        .section {
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #fafafa;
        }
        .section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .row {
          display: flex;
          gap: 24px;
          font-size: 14px;
          margin-bottom: 12px;
          align-items: center;
        }
        .col { flex: 1; }
        .label {
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .value {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
        }
        .footer {
          background: #f3f4f6;
          padding: 20px 32px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          background: #dbeafe;
          color: #1e40af;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          margin: 8px 0;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .metric-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        @media print {
          body { background: white; padding: 0; }
          .receipt-container { box-shadow: none; }
        }
      </style>
    `;
        const rid = `OBS-${(l._id || '').slice(-6).toUpperCase()}-${new Date(l.loggedAt || l.createdAt || Date.now()).getTime()}`;
        const clinic = 'Path2Welness';
        const rows = [];
        if (l.logType === 'vitals_tests') {
            // Handle multiple possible data structures for vitals
            const vitalsData = l.vitals || l.vitalsTests || l;

            // Blood pressure - try multiple field structures
            let bp = '-';
            if (vitalsData?.bloodPressure) {
                if (typeof vitalsData.bloodPressure === 'string') {
                    bp = vitalsData.bloodPressure;
                } else if (vitalsData.bloodPressure.systolic || vitalsData.bloodPressure.diastolic) {
                    bp = `${vitalsData.bloodPressure.systolic || ''}${vitalsData.bloodPressure.systolic ? '/' : ''}${vitalsData.bloodPressure.diastolic || ''}`;
                }
            }

            // Try different field names for each vital
            const bloodSugar = vitalsData?.sugarLevel || vitalsData?.bloodSugar || l.bloodSugar || '-';
            const weight = vitalsData?.weightKg || vitalsData?.weight || l.weight || '-';
            const fetalHeartRate = vitalsData?.fetalHeartRate || l.fetalHeartRate || '-';

            rows.push(`
        <div class="row">
          <div class="col"><span class="label">Blood Pressure</span><div class="value">${bp}</div></div>
          <div class="col"><span class="label">Blood Sugar</span><div class="value">${bloodSugar}</div></div>
        </div>
        <div class="row">
          <div class="col"><span class="label">Weight (kg)</span><div class="value">${weight}</div></div>
          <div class="col"><span class="label">Fetal Heart Rate</span><div class="value">${fetalHeartRate}</div></div>
        </div>
      `);

            // Test notes - try multiple possible locations
            const testNotes = l.tests?.ultrasound?.notes || l.testResults || vitalsData?.testResults || l.notes;
            if (testNotes) {
                rows.push(`<div class="row"><div class="col"><span class="label">Test Notes</span><div class="value">${testNotes}</div></div></div>`);
            }
        }
        if (l.logType === 'trimester_symptoms') {
            rows.push(`
        <div class="row">
          <div class="col"><span class="label">Trimester</span><div class="value">${l.trimester || '-'}</div></div>
          <div class="col"><span class="label">Symptoms</span><div class="value">${l.notes || '-'}</div></div>
        </div>
      `);
        }
        if (l.logType === 'baby_movement') {
            // Handle multiple possible data structures
            const movementData = l.babyMovement || l;
            const timeOfDay = movementData?.timeOfDay || l.timeOfDay || 'Morning';
            const capTimeOfDay = typeof timeOfDay === 'string' && timeOfDay.length > 0 ? timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1) : timeOfDay;

            // Try different possible field names for movement count
            const movementCount = movementData?.movementCount || l.movementCount || movementData?.count || l.count || '-';

            // Try different possible field names for duration
            const duration = movementData?.duration || l.duration || movementData?.durationMin || l.durationMin || '-';

            // Try different possible field names for week
            const week = movementData?.week || l.week || movementData?.pregnancyWeek || l.pregnancyWeek || l.trimester || '-';

            rows.push(`
        <div class="row">
          <div class="col"><span class="label">Movement Count</span><div class="value">${movementCount}</div></div>
          <div class="col"><span class="label">Duration (min)</span><div class="value">${duration}</div></div>
        </div>
        <div class="row">
          <div class="col"><span class="label">Time of Day</span><div class="value">${capTimeOfDay}</div></div>
          <div class="col"><span class="label">Week</span><div class="value">${week}</div></div>
        </div>
        ${movementData?.notes || l.notes ? `<div class="row"><div class="col"><span class="label">Notes</span><div class="value">${movementData?.notes || l.notes}</div></div></div>` : ''}
      `);
        }
        if (l.logType === 'sleep_nutrition') {
            rows.push(`
        <div class="row">
          <div class="col"><span class="label">Sleep Hours</span><div class="value">${l.sleepNutrition?.sleepHours || '-'}</div></div>
          <div class="col"><span class="label">Sleep Quality</span><div class="value">${l.sleepNutrition?.sleepQuality || '-'}</div></div>
        </div>
        <div class="row">
          <div class="col"><span class="label">Water Intake (L)</span><div class="value">${l.sleepNutrition?.waterIntake || '-'}</div></div>
          <div class="col"><span class="label">Nutrition Notes</span><div class="value">${l.sleepNutrition?.nutritionNotes || '-'}</div></div>
        </div>
      `);
        }
        if (l.logType === 'postnatal_recovery') {
            rows.push(`
        <div class="row">
          <div class="col"><span class="label">Bleeding</span><div class="value">${
              l.postnatalRecovery?.bleeding?.hasBleeding ? l.postnatalRecovery.bleeding.severity + ' - ' + l.postnatalRecovery.bleeding.color : 'No'
          }</div></div>
          <div class="col"><span class="label">Stitches</span><div class="value">${l.postnatalRecovery?.stitches?.hasStitches ? l.postnatalRecovery.stitches.condition : 'No'}</div></div>
        </div>
        <div class="row">
          <div class="col"><span class="label">Breastfeeding</span><div class="value">${
              l.postnatalRecovery?.breastfeeding?.isBreastfeeding ? l.postnatalRecovery.breastfeeding.frequency + 'x/day' : 'No'
          }</div></div>
          <div class="col"><span class="label">Pain Level</span><div class="value">${l.postnatalRecovery?.painLevel ?? '-'}</div></div>
        </div>
      `);
        }
        if (l.notes) rows.push(`<div class="row"><div class="col"><span class="label">Additional Notes</span><div class="value">${l.notes}</div></div></div>`);

        const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Obstetrics Log Receipt - ${clinic}</title>
          ${style}
        </head>
        <body>
          <div class="receipt-container">
          <div class="header">
              <div class="clinic">${clinic}</div>
              <div class="title">Obstetrics Health Log Receipt</div>
              <div class="meta">Receipt ID: ${rid}</div>
            </div>

            <div class="content">
          <div class="section">
                <h3>Patient Information</h3>
            <div class="row">
                  <div class="col"><span class="label">Patient Name</span><div class="value">${patient?.name || '-'}</div></div>
              <div class="col"><span class="label">Patient ID</span><div class="value">${patient?.patientId || '-'}</div></div>
            </div>
            <div class="row">
                  <div class="col"><span class="label">Age</span><div class="value">${patient?.age ?? '-'} years</div></div>
              <div class="col"><span class="label">Due Date</span><div class="value">${patient?.dueDate ? new Date(patient.dueDate).toLocaleDateString() : '-'}</div></div>
            </div>
          </div>

          <div class="section">
            <h3>Log Details</h3>
            <div class="row">
                  <div class="col"><span class="label">Log Type</span><div class="value">${getLogTypeLabel(l.logType)}</div></div>
              <div class="col"><span class="label">Logged At</span><div class="value">${new Date(l.loggedAt || l.createdAt).toLocaleString()}</div></div>
                </div>
                <div class="row">
              <div class="col"><span class="label">Logged By</span><div class="value">${l.loggedBy || '-'}</div></div>
                  ${l.trimester ? `<div class="col"><span class="label">Trimester</span><div class="value">${l.trimester}</div></div>` : ''}
            </div>
            ${rows.join('')}
          </div>
            </div>

            <div class="footer">
              <div>Generated on ${new Date().toLocaleString()}</div>
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                This is an automated receipt from Path2Welness Health Management System
              </div>
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

    // Build vitals trend data for charts
    const bpTrend = logs
        .filter((l) => l.vitals?.bloodPressure && (l.vitals.bloodPressure.systolic || l.vitals.bloodPressure.diastolic))
        .map((l) => ({
            date: new Date(l.loggedAt || l.createdAt).toLocaleDateString(),
            systolic: l.vitals.bloodPressure.systolic,
            diastolic: l.vitals.bloodPressure.diastolic,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const sugarTrend = logs
        .filter((l) => typeof l.vitals?.sugarLevel === 'number')
        .map((l) => ({
            date: new Date(l.loggedAt || l.createdAt).toLocaleDateString(),
            sugar: l.vitals.sugarLevel,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const weightTrend = logs
        .filter((l) => typeof l.vitals?.weightKg === 'number')
        .map((l) => ({
            date: new Date(l.loggedAt || l.createdAt).toLocaleDateString(),
            weight: l.vitals.weightKg,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const getLogTypeLabel = (logType) => {
        const labels = {
            trimester_symptoms: 'Trimester Symptoms',
            baby_movement: 'Baby Movement',
            sleep_nutrition: 'Sleep & Nutrition',
            postnatal_recovery: 'Postnatal Recovery',
            vitals_tests: 'Vitals & Tests',
        };
        return labels[logType] || logType;
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
                                to="/obstetrics"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 shadow-sm hover:shadow-md transition-all"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </Link>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isPatient && (
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
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="trimester_symptoms">Trimester Symptoms</option>
                                    <option value="baby_movement">Baby Movement</option>
                                    <option value="sleep_nutrition">Sleep & Nutrition</option>
                                    <option value="postnatal_recovery">Postnatal Recovery</option>
                                    <option value="vitals_tests">Vitals & Tests</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Trimester</label>
                                <select
                                    name="trimester"
                                    value={filters.trimester}
                                    onChange={handleFilterChange}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">All Trimesters</option>
                                    <option value="1">1st Trimester</option>
                                    <option value="2">2nd Trimester</option>
                                    <option value="3">3rd Trimester</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">From Date</label>
                                <input
                                    type="date"
                                    name="from"
                                    value={filters.from}
                                    onChange={handleFilterChange}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">To Date</label>
                                <input
                                    type="date"
                                    name="to"
                                    value={filters.to}
                                    onChange={handleFilterChange}
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Logged By</label>
                                <input
                                    type="text"
                                    name="loggedBy"
                                    value={filters.loggedBy}
                                    onChange={handleFilterChange}
                                    placeholder="Doctor/Midwife name"
                                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {patient && (
                        <Card>
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
                                    {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-neutral-900">{patient.name} - Pregnancy Logs</h1>
                                    <p className="text-neutral-600">
                                        Due Date: {formatDate(patient.dueDate)} | Pregnancy #{patient.pregnancyNumber}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Timeline */}
                    {logs.length > 0 && (
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Timeline</h2>
                            <div className="space-y-4">
                                {[...logs]
                                    .sort((a, b) => new Date(a.loggedAt || a.createdAt) - new Date(b.loggedAt || b.createdAt))
                                    .map((l) => (
                                        <div key={l._id} className="flex items-start space-x-4">
                                            <div className="mt-2 h-3 w-3 rounded-full bg-primary-500 shadow-sm"></div>
                                            <div className="flex-1">
                                                <div className="text-sm text-neutral-500 mb-1">{formatHospitalDateTime(l.loggedAt || l.createdAt)}</div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-semibold text-neutral-900">{getLogTypeLabel(l.logType)}</span>
                                                    {l.trimester && (
                                                        <Badge variant="primary" size="xs">
                                                            Trimester {l.trimester}
                                                        </Badge>
                                                    )}
                                                    {l.loggedBy && <span className="text-sm text-neutral-600">by {l.loggedBy}</span>}
                                                </div>
                                                {l.notes && <div className="text-sm text-neutral-700 bg-neutral-50 rounded-lg p-3 mt-2">{l.notes}</div>}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>
                    )}

                    {/* Vitals Charts */}
                    {(bpTrend.length > 0 || sugarTrend.length > 0 || weightTrend.length > 0) && (
                        <Card>
                            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Vitals Trends</h2>
                            <div className="space-y-8">
                                {bpTrend.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Blood Pressure</h3>
                                        <div className="w-full h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={bpTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" stroke="#6b7280" />
                                                    <YAxis allowDecimals={false} stroke="#6b7280" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="systolic" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                                                    <Line type="monotone" dataKey="diastolic" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                                {sugarTrend.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Blood Sugar</h3>
                                        <div className="w-full h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={sugarTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" stroke="#6b7280" />
                                                    <YAxis allowDecimals={false} stroke="#6b7280" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="sugar" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Sugar (mg/dL)" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                                {weightTrend.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Weight (kg)</h3>
                                        <div className="w-full h-56">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={weightTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                    <XAxis dataKey="date" stroke="#6b7280" />
                                                    <YAxis allowDecimals={false} stroke="#6b7280" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="weight" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

                    <div className="grid gap-6">
                        {logs.map((log) => (
                            <Card key={log._id}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-neutral-900">{getLogTypeLabel(log.logType)}</h3>
                                            {log.trimester && (
                                                <Badge variant="primary" size="sm">
                                                    Trimester {log.trimester}
                                                </Badge>
                                            )}
                                            {Array.isArray(log.history) && log.history.length > 0 && (
                                                <Badge variant="warning" size="sm">
                                                    Edited
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-neutral-500">
                                            {formatHospitalDateTime(log.loggedAt || log.createdAt)}
                                            {log.loggedBy ? ` • by ${log.loggedBy}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {!isPatient && (
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
                                        {!isPatient && (
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
                                    {log.logType === 'trimester_symptoms' && (
                                        <div className="space-y-3">
                                            {log.symptoms?.nausea?.hasSymptom && (
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="warning" size="xs">
                                                        Nausea
                                                    </Badge>
                                                    <span className="text-sm text-neutral-700 capitalize">{log.symptoms.nausea.severity}</span>
                                                    {log.symptoms.nausea.notes && <span className="text-sm text-neutral-500">- {log.symptoms.nausea.notes}</span>}
                                                </div>
                                            )}
                                            {log.symptoms?.cramps?.hasSymptom && (
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="danger" size="xs">
                                                        Cramps
                                                    </Badge>
                                                    <span className="text-sm text-neutral-700 capitalize">{log.symptoms.cramps.severity}</span>
                                                    {log.symptoms.cramps.notes && <span className="text-sm text-neutral-500">- {log.symptoms.cramps.notes}</span>}
                                                </div>
                                            )}
                                            {log.symptoms?.mood && (
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="info" size="xs">
                                                        Mood
                                                    </Badge>
                                                    <span className="text-sm text-neutral-700 capitalize">{log.symptoms.mood.level}</span>
                                                    {log.symptoms.mood.notes && <span className="text-sm text-neutral-500">- {log.symptoms.mood.notes}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'baby_movement' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                {log.babyMovement?.movementCount && (
                                                    <div className="bg-primary-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Movement Count</div>
                                                        <div className="text-lg font-bold text-primary-900">{log.babyMovement.movementCount}</div>
                                                    </div>
                                                )}
                                                {log.babyMovement?.duration && (
                                                    <div className="bg-secondary-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-secondary-700 uppercase tracking-wide">Duration</div>
                                                        <div className="text-lg font-bold text-secondary-900">{log.babyMovement.duration} min</div>
                                                    </div>
                                                )}
                                            </div>
                                            {fieldErrors['babyMovement.week'] && <div className="text-xs text-red-600 mt-1">{fieldErrors['babyMovement.week']}</div>}
                                            {log.babyMovement?.timeOfDay && (
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="accent" size="sm">
                                                        {log.babyMovement.timeOfDay ? log.babyMovement.timeOfDay.charAt(0).toUpperCase() + log.babyMovement.timeOfDay.slice(1) : '-'}
                                                    </Badge>
                                                    <span className="text-sm text-neutral-600">Time of Day</span>
                                                </div>
                                            )}
                                            {log.babyMovement?.notes && (
                                                <div className="bg-neutral-50 rounded-lg p-3">
                                                    <div className="text-sm text-neutral-700">{log.babyMovement.notes}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'sleep_nutrition' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                {log.sleepNutrition?.sleepHours && (
                                                    <div className="bg-indigo-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Sleep Hours</div>
                                                        <div className="text-lg font-bold text-indigo-900">{log.sleepNutrition.sleepHours}h</div>
                                                    </div>
                                                )}
                                                {log.sleepNutrition?.sleepQuality && (
                                                    <div className="bg-purple-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Quality</div>
                                                        <div className="text-lg font-bold text-purple-900 capitalize">{log.sleepNutrition.sleepQuality}</div>
                                                    </div>
                                                )}
                                            </div>
                                            {log.sleepNutrition?.waterIntake && (
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Water Intake</div>
                                                    <div className="text-lg font-bold text-blue-900">{log.sleepNutrition.waterIntake}L</div>
                                                </div>
                                            )}
                                            {log.sleepNutrition?.nutritionNotes && (
                                                <div className="bg-neutral-50 rounded-lg p-3">
                                                    <div className="text-sm text-neutral-700">{log.sleepNutrition.nutritionNotes}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'postnatal_recovery' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                {log.postnatalRecovery?.bleeding?.hasBleeding && (
                                                    <div className="bg-red-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Bleeding</div>
                                                        <div className="text-lg font-bold text-red-900 capitalize">
                                                            {log.postnatalRecovery.bleeding.severity} - {log.postnatalRecovery.bleeding.color}
                                                        </div>
                                                    </div>
                                                )}
                                                {log.postnatalRecovery?.stitches?.hasStitches && (
                                                    <div className="bg-orange-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Stitches</div>
                                                        <div className="text-lg font-bold text-orange-900 capitalize">{log.postnatalRecovery.stitches.condition}</div>
                                                    </div>
                                                )}
                                            </div>
                                            {log.postnatalRecovery?.breastfeeding?.isBreastfeeding && (
                                                <div className="bg-green-50 rounded-lg p-3">
                                                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Breastfeeding</div>
                                                    <div className="text-lg font-bold text-green-900">
                                                        {log.postnatalRecovery.breastfeeding.frequency} times/day, {log.postnatalRecovery.breastfeeding.duration} min/session
                                                    </div>
                                                </div>
                                            )}
                                            {log.postnatalRecovery?.painLevel && (
                                                <div className="bg-yellow-50 rounded-lg p-3">
                                                    <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Pain Level</div>
                                                    <div className="text-2xl font-bold text-yellow-900">{log.postnatalRecovery.painLevel}/10</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.logType === 'vitals_tests' && (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                {(log.vitalsTests?.bloodPressure || log.bloodPressure) && (
                                                    <div className="bg-red-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Blood Pressure</div>
                                                        <div className="text-lg font-bold text-red-900">{log.vitalsTests?.bloodPressure || log.bloodPressure}</div>
                                                    </div>
                                                )}
                                                {(log.vitalsTests?.bloodSugar || log.bloodSugar) && (
                                                    <div className="bg-blue-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Blood Sugar</div>
                                                        <div className="text-lg font-bold text-blue-900">{log.vitalsTests?.bloodSugar || log.bloodSugar} mg/dL</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                {(log.vitalsTests?.weight || log.weight) && (
                                                    <div className="bg-green-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Weight</div>
                                                        <div className="text-lg font-bold text-green-900">{log.vitalsTests?.weight || log.weight} kg</div>
                                                    </div>
                                                )}
                                                {(log.vitalsTests?.fetalHeartRate || log.fetalHeartRate) && (
                                                    <div className="bg-purple-50 rounded-lg p-3">
                                                        <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Fetal Heart Rate</div>
                                                        <div className="text-lg font-bold text-purple-900">{log.vitalsTests?.fetalHeartRate || log.fetalHeartRate} bpm</div>
                                                    </div>
                                                )}
                                            </div>
                                            {(log.vitalsTests?.testResults || log.testResults) && (
                                                <div className="bg-neutral-50 rounded-lg p-3">
                                                    <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Test Results</div>
                                                    <div className="text-sm text-neutral-700">{log.vitalsTests?.testResults || log.testResults}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {log.notes && (
                                        <div className="bg-neutral-50 rounded-lg p-3 border-l-4 border-primary-200">
                                            <div className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-1">Additional Notes</div>
                                            <div className="text-sm text-neutral-700">{log.notes}</div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}

                        {logs.length === 0 && (
                            <Card>
                                <div className="text-center py-12">
                                    <div className="mx-auto h-12 w-12 text-neutral-400 mb-4">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No logs found</h3>
                                    <p className="text-neutral-500">Add your first log to track your pregnancy journey.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Total: {total}</div>
                <div className="space-x-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-3 py-1 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Prev
                    </button>
                    <span className="text-sm">Page {page}</span>
                    <button
                        onClick={() => {
                            const maxPage = Math.max(1, Math.ceil(total / limit));
                            setPage((p) => Math.min(maxPage, p + 1));
                        }}
                        disabled={page >= Math.ceil(total / limit)}
                        className={`px-3 py-1 rounded border ${page >= Math.ceil(total / limit) ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Receipt Toast */}
            {receiptToast.visible && (
                <div className="fixed bottom-4 right-4 bg-white shadow-lg border border-gray-200 rounded-lg p-4 z-50 w-80">
                    <div className="font-medium text-gray-900">Log saved</div>
                    <div className="text-sm text-gray-600 mt-1">Would you like to generate a receipt?</div>
                    <div className="mt-3 flex items-center space-x-2">
                        <button
                            onClick={() => {
                                const target = receiptToast.log || logs[0];
                                if (target) handleGenerateReceipt(target);
                                setReceiptToast({ visible: false, log: null });
                            }}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                            Generate Receipt
                        </button>
                        <button onClick={() => setReceiptToast({ visible: false, log: null })} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Log Modal - Simplified for space */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingLog ? 'Edit Log' : 'Edit Health Log'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    {renderLabel('Log Type', true)}
                                    <select name="logType" value={formData.logType} onChange={handleInputChange} className={getFieldClassName('logType')}>
                                        <option value="">-- Select Log Type --</option>
                                        <option value="trimester_symptoms">Trimester Symptoms</option>
                                        <option value="baby_movement">Baby Movement</option>
                                        <option value="sleep_nutrition">Sleep & Nutrition</option>
                                        <option value="postnatal_recovery">Postnatal Recovery</option>
                                        <option value="vitals_tests">Vitals & Tests</option>
                                    </select>
                                    {renderError('logType')}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        {renderLabel('Logged By', true)}
                                        <input
                                            type="text"
                                            name="loggedBy"
                                            value={formData.loggedBy}
                                            onChange={handleLoggedByChange}
                                            onFocus={() => setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            placeholder="Doctor/Nurse name"
                                            className={getFieldClassName('loggedBy', 'w-full')}
                                            autoComplete="off"
                                        />
                                        {suggestions.length > 0 && showSuggestions && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                                {suggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        className="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            selectSuggestion(suggestion);
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {renderError('loggedBy')}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            {renderLabel('Date', true)}
                                            <input
                                                type="date"
                                                name="loggedDate"
                                                value={formData.loggedDate}
                                                onChange={handleInputChange}
                                                className={getFieldClassName('loggedDate', 'mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none')}
                                            />
                                            {renderError('loggedDate')}
                                        </div>
                                        <div>
                                            {renderLabel('Time', true)}
                                            <input
                                                type="time"
                                                name="loggedTime"
                                                value={formData.loggedTime}
                                                onChange={handleInputChange}
                                                className={getFieldClassName('loggedTime', 'mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none')}
                                            />
                                            {renderError('loggedTime')}
                                        </div>
                                        <input type="hidden" name="loggedAt" value={formData.loggedAt} />
                                    </div>
                                </div>

                                {formData.logType === 'trimester_symptoms' && (
                                    <div className="space-y-4">
                                        <div>
                                            {renderLabel('Trimester', true)}
                                            <select name="trimester" value={formData.trimester} onChange={handleInputChange} className={getFieldClassName('trimester')}>
                                                <option value="">-- Select Trimester --</option>
                                                <option value={1}>1st Trimester (Weeks 1-12)</option>
                                                <option value={2}>2nd Trimester (Weeks 13-26)</option>
                                                <option value={3}>3rd Trimester (Weeks 27-40)</option>
                                            </select>
                                            {renderError('trimester')}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="symptoms.nausea.hasSymptom"
                                                    checked={formData.symptoms.nausea.hasSymptom}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <label className="ml-2 block text-sm text-gray-900">Nausea</label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="symptoms.cramps.hasSymptom"
                                                    checked={formData.symptoms.cramps.hasSymptom}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                />
                                                <label className="ml-2 block text-sm text-gray-900">Cramps</label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.logType === 'vitals_tests' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Blood Pressure (80-200/50-120)</label>
                                                <input
                                                    type="text"
                                                    name="vitalsTests.bloodPressure"
                                                    value={formData.vitalsTests.bloodPressure}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 120/80"
                                                    className={getFieldClassName('vitalsTests.bloodPressure')}
                                                />
                                                {renderError('vitalsTests.bloodPressure')}
                                                <div className="text-xs text-gray-500 mt-1">Format: Systolic/Diastolic (e.g., 120/80)</div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Blood Sugar (50-400 mg/dL)</label>
                                                <input
                                                    type="number"
                                                    name="vitalsTests.bloodSugar"
                                                    value={formData.vitalsTests.bloodSugar}
                                                    onChange={handleInputChange}
                                                    min="50"
                                                    max="400"
                                                    placeholder="e.g., 120"
                                                    className={getFieldClassName('vitalsTests.bloodSugar')}
                                                />
                                                {renderError('vitalsTests.bloodSugar')}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Weight (30-150 kg)</label>
                                                <input
                                                    type="number"
                                                    name="vitalsTests.weight"
                                                    value={formData.vitalsTests.weight}
                                                    onChange={handleInputChange}
                                                    min="30"
                                                    max="150"
                                                    step="0.1"
                                                    placeholder="e.g., 65.5"
                                                    className={getFieldClassName('vitalsTests.weight')}
                                                />
                                                {renderError('vitalsTests.weight')}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Fetal Heart Rate (110-180 bpm)</label>
                                                <input
                                                    type="number"
                                                    name="vitalsTests.fetalHeartRate"
                                                    value={formData.vitalsTests.fetalHeartRate}
                                                    onChange={handleInputChange}
                                                    min="110"
                                                    max="180"
                                                    placeholder="e.g., 140"
                                                    className={getFieldClassName('vitalsTests.fetalHeartRate')}
                                                />
                                                {renderError('vitalsTests.fetalHeartRate')}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                                            <input
                                                type="text"
                                                name="vitalsTests.symptoms"
                                                value={formData.vitalsTests.symptoms}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Medication</label>
                                            <input
                                                type="text"
                                                name="vitalsTests.medication"
                                                value={formData.vitalsTests.medication}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Test Results</label>
                                            <textarea
                                                name="vitalsTests.testResults"
                                                value={formData.vitalsTests.testResults}
                                                onChange={handleInputChange}
                                                rows="3"
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Log Date</label>
                                            <input
                                                type="datetime-local"
                                                name="vitalsTests.logDate"
                                                value={formData.vitalsTests.logDate}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.logType === 'baby_movement' && (
                                    <div className="space-y-4">
                                        <div>
                                            {renderLabel('Pregnancy Week (1-42)', true)}
                                            <div className="mt-1 flex items-center space-x-2">
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
                                                    className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                                                >
                                                    −
                                                </button>
                                                <div
                                                    className={`flex-1 text-center border rounded-md px-3 py-2 select-none ${
                                                        fieldErrors['babyMovement.week'] ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'
                                                    }`}
                                                >
                                                    {`Week ${formData.babyMovement.week}`}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            babyMovement: {
                                                                ...prev.babyMovement,
                                                                week: Math.min(42, Number(prev.babyMovement.week || 1) + 1),
                                                            },
                                                        }))
                                                    }
                                                    className="px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            {fieldErrors['babyMovement.week'] && <div className="text-xs text-red-600 mt-1">{fieldErrors['babyMovement.week']}</div>}
                                        </div>
                                        <div>
                                            {renderLabel('Movement Level', true)}
                                            <select
                                                name="babyMovement.movementLevel"
                                                value={formData.babyMovement.movementLevel || ''}
                                                onChange={handleInputChange}
                                                className={getFieldClassName('babyMovement.movementLevel')}
                                            >
                                                <option value="">-- Select Movement Level --</option>
                                                <option value="low">Low (Less than 10 movements/day)</option>
                                                <option value="medium">Medium (10-20 movements/day)</option>
                                                <option value="high">High (More than 20 movements/day)</option>
                                            </select>
                                            {renderError('babyMovement.movementLevel')}
                                        </div>
                                    </div>
                                )}

                                {formData.logType === 'sleep_nutrition' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Sleep Hours (0-24)</label>
                                            <input
                                                type="number"
                                                name="sleepNutrition.sleepHours"
                                                value={formData.sleepNutrition.sleepHours}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                placeholder="e.g., 8.5"
                                                className={getFieldClassName('sleepNutrition.sleepHours')}
                                            />
                                            {renderError('sleepNutrition.sleepHours')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Water Intake (0-10 liters)</label>
                                            <input
                                                type="number"
                                                name="sleepNutrition.waterIntake"
                                                value={formData.sleepNutrition.waterIntake}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="10"
                                                step="0.1"
                                                placeholder="e.g., 2.5"
                                                className={getFieldClassName('sleepNutrition.waterIntake')}
                                            />
                                            {renderError('sleepNutrition.waterIntake')}
                                        </div>
                                    </div>
                                )}

                                {formData.logType === 'postnatal_recovery' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="postnatalRecovery.bleeding.hasBleeding"
                                                checked={formData.postnatalRecovery.bleeding.hasBleeding}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">Bleeding</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="postnatalRecovery.breastfeeding.isBreastfeeding"
                                                checked={formData.postnatalRecovery.breastfeeding.isBreastfeeding}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <label className="ml-2 block text-sm text-gray-900">Breastfeeding</label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Pain Level (0-10)</label>
                                            <input
                                                type="number"
                                                name="postnatalRecovery.painLevel"
                                                value={formData.postnatalRecovery.painLevel}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="10"
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.logType === 'vitals_tests' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                {renderLabel('Blood Pressure')}
                                                <input
                                                    type="text"
                                                    name="vitalsTests.bloodPressure"
                                                    value={formData.vitalsTests.bloodPressure}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 120/80"
                                                    className={getFieldClassName('vitalsTests.bloodPressure')}
                                                />
                                                {renderError('vitalsTests.bloodPressure')}
                                            </div>
                                            <div>
                                                {renderLabel('Blood Sugar')}
                                                <input
                                                    type="text"
                                                    name="vitalsTests.bloodSugar"
                                                    value={formData.vitalsTests.bloodSugar}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 95 mg/dL"
                                                    className={getFieldClassName('vitalsTests.bloodSugar')}
                                                />
                                                {renderError('vitalsTests.bloodSugar')}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                {renderLabel('Weight (kg)')}
                                                <input
                                                    type="number"
                                                    name="vitalsTests.weight"
                                                    value={formData.vitalsTests.weight}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    step="0.1"
                                                    placeholder="e.g., 65.5"
                                                    className={getFieldClassName('vitalsTests.weight')}
                                                />
                                                {renderError('vitalsTests.weight')}
                                            </div>
                                            <div>
                                                {renderLabel('Fetal Heart Rate')}
                                                <input
                                                    type="number"
                                                    name="vitalsTests.fetalHeartRate"
                                                    value={formData.vitalsTests.fetalHeartRate}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    placeholder="e.g., 140 bpm"
                                                    className={getFieldClassName('vitalsTests.fetalHeartRate')}
                                                />
                                                {renderError('vitalsTests.fetalHeartRate')}
                                            </div>
                                        </div>
                                        <div>
                                            {renderLabel('Test Results')}
                                            <textarea
                                                name="vitalsTests.testResults"
                                                value={formData.vitalsTests.testResults}
                                                onChange={handleInputChange}
                                                rows="3"
                                                placeholder="Enter test results, ultrasound notes, etc."
                                                className={getFieldClassName('vitalsTests.testResults')}
                                            />
                                            {renderError('vitalsTests.testResults')}
                                        </div>
                                    </div>
                                )}

                                {/* Log metadata */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Logged By</label>
                                    <input
                                        type="text"
                                        name="loggedBy"
                                        value={formData.loggedBy}
                                        onChange={handleInputChange}
                                        placeholder="Doctor/Midwife name"
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isFormValid}
                                        className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                                            isFormValid ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        {editingLog ? 'Update Log' : 'Add Log'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Health Log Modal */}
            <AddObstetricsLogModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleAddLogSuccess} preselectedPatientId={id} preselectedPatientInfo={patient} />
        </div>
    );
};

export default ObstetricsLogs;
