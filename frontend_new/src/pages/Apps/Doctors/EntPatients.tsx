import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { entAPI, obstetricsAPI, reportsAPI } from '../../../services/healthlogs.service';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import AddHealthLogModal from '../../../components/AddHealthLogModal';

interface Patient {
    _id: string;
    name: string;
    patientId: string;
    age: number;
    gender: string;
    surgeryType: string;
    surgeryDate: string;
    createdAt: string;
    status: string;
    phone?: string;
    email?: string;
}

const EntPatients: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const canEdit: boolean = true;
    const canDelete: boolean = true;
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await entAPI.getAllPatients();
            setPatients(response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch patients');
            console.error('Error fetching patients:', err);
        } finally {
            setLoading(false);
        }
    };

    // Derived: visible patients filtered by search query
    const visiblePatients = patients.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (p.name && p.name.toLowerCase().includes(q)) || (p.patientId && String(p.patientId).toLowerCase().includes(q));
    });

    const handleLogSuccess = () => {
        // Optionally refresh patients or show success message
        // For now, we'll just close the modal as the shared component handles the rest
    };

    const handleDelete = async (id: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await entAPI.deletePatient(id);
                fetchPatients();
            } catch (err: unknown) {
                setError('Failed to delete patient');
                console.error('Error deleting patient:', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="text-neutral-600">Loading ENT patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-neutral-900">ENT Health Log</h1>
                                    <p className="text-neutral-600">Comprehensive otolaryngology patient management and post-surgical monitoring</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search patient by ID or name..."
                                    className="form-input pl-10 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-600"
                                        aria-label="Clear search"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {canEdit && (
                                <Button
                                    onClick={() => setShowModal(true)}
                                    variant="primary"
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    }
                                >
                                    Add Health Log
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    {/* Patients Table */}
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto scrollbar-thin">
                            <table className="min-w-full divide-y divide-neutral-200">
                                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Patient</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Surgery Details</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-200">
                                    {visiblePatients.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-medium text-neutral-900">No patients found</h3>
                                                        <p className="text-neutral-500">Try adjusting your search or add a new patient.</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        visiblePatients.map((patient) => (
                                            <tr key={patient._id} className="hover:bg-neutral-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                                            {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-neutral-900">{patient.name || 'Unknown Patient'}</div>
                                                            <div className="text-sm text-neutral-500">
                                                                Age {patient.age} • {patient.gender}
                                                            </div>
                                                            <div className="text-xs text-neutral-400">ID: {patient.patientId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-neutral-900">{patient.phone}</div>
                                                        {patient.email && <div className="text-sm text-neutral-500">{patient.email}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <Badge variant="info" size="sm">
                                                            {patient.surgeryType || 'Not specified'}
                                                        </Badge>
                                                        {patient.surgeryDate && <div className="text-xs text-neutral-500">{new Date(patient.surgeryDate).toLocaleDateString()}</div>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end space-x-3">
                                                        <Link
                                                            to={`/ent/${patient._id}/logs`}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            Logs
                                                        </Link>
                                                        <Link
                                                            to={`/ent/${patient._id}/timeline`}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Timeline
                                                        </Link>
                                                        <Link
                                                            to={`/ent/${patient._id}/progress`}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 hover:bg-accent-50 rounded-lg transition-colors"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                            </svg>
                                                            Progress
                                                        </Link>
                                                        {canDelete && (
                                                            <button
                                                                onClick={() => handleDelete(patient._id)}
                                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Add Health Log Modal */}
                    <AddHealthLogModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={handleLogSuccess} patients={patients as any} />
                </div>
            </div>
        </div>
    );
};

export default EntPatients;
