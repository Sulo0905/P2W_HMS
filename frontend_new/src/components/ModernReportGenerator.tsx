import React, { useState } from 'react';
import { FaFilePdf, FaDownload, FaCalendarAlt, FaUserMd, FaUser, FaCheckCircle, FaHospital, FaSpinner, FaPrint, FaShare, FaChartBar } from 'react-icons/fa';
import jsPDF from 'jspdf';

// Type definitions
interface Doctor {
    _id: string;
    name: string;
    title?: string;
    specialization?: string;
}

interface Appointment {
    _id: string;
    patientName: string;
    patientAge: string;
    patientGender: string;
    patientPhone: string;
    patientEmail: string;
    doctor: Doctor;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    urgency: 'normal' | 'urgent' | 'emergency';
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
    queueNumber: string;
    patient: string;
    createdAt: string;
    updatedAt: string;
    doctorNotes?: string;
}

interface ModernReportGeneratorProps {
    appointment: Appointment;
    onClose: () => void;
}

const ModernReportGenerator: React.FC<ModernReportGeneratorProps> = ({ appointment, onClose }) => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [reportGenerated, setReportGenerated] = useState<boolean>(false);

    const generatePDF = (): void => {
        setGenerating(true);

        setTimeout(() => {
            try {
                // Validate appointment data
                if (!appointment) {
                    throw new Error('No appointment data available');
                }

                // Create new PDF document
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4',
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Header with gradient effect (simulated with colors)
                doc.setFillColor(37, 99, 235); // Blue
                doc.rect(0, 0, pageWidth, 40, 'F');

                // Logo/Icon area
                doc.setFillColor(255, 255, 255);
                doc.circle(20, 20, 8, 'F');

                // Title
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(24);
                doc.setFont('helvetica', 'bold');
                doc.text('Medical Appointment Report', pageWidth / 2, 20, { align: 'center' });

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Healthcare Management System', pageWidth / 2, 28, { align: 'center' });

                // Reset text color
                doc.setTextColor(0, 0, 0);

                // Report metadata
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`Report Generated: ${new Date().toLocaleString()}`, 15, 50);
                doc.text(`Report ID: ${appointment.queueNumber || 'N/A'}`, pageWidth - 15, 50, { align: 'right' });

                // Divider line
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.5);
                doc.line(15, 55, pageWidth - 15, 55);

                let yPos = 65;

                // Patient Information Section
                doc.setFillColor(240, 249, 255); // Light blue background
                doc.roundedRect(15, yPos, pageWidth - 30, 50, 3, 3, 'F');

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(37, 99, 235);
                doc.text('Patient Information', 20, yPos + 8);

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                yPos += 18;
                doc.text(`Name:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.patientName || 'N/A'}`, 60, yPos);

                yPos += 8;
                doc.setFont('helvetica', 'normal');
                doc.text(`Age:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.patientAge || 'N/A'} years`, 60, yPos);

                yPos += 8;
                doc.setFont('helvetica', 'normal');
                doc.text(`Queue Number:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.queueNumber || 'N/A'}`, 60, yPos);

                yPos += 20;

                // Doctor Information Section
                doc.setFillColor(243, 244, 246); // Light gray background
                doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'F');

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(79, 70, 229); // Indigo
                doc.text('Doctor Information', 20, yPos + 8);

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                yPos += 18;
                const doctorName = appointment.doctor?.name || 'N/A';
                const doctorTitle = appointment.doctor?.title || 'Dr.';
                doc.text(`Doctor:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${doctorTitle} ${doctorName}`, 60, yPos);

                yPos += 8;
                doc.setFont('helvetica', 'normal');
                doc.text(`Specialization:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.doctor?.specialization || 'N/A'}`, 60, yPos);

                yPos += 20;

                // Appointment Details Section
                doc.setFillColor(254, 243, 199); // Light yellow background
                doc.roundedRect(15, yPos, pageWidth - 30, 50, 3, 3, 'F');

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(217, 119, 6); // Amber
                doc.text('Appointment Details', 20, yPos + 8);

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                yPos += 18;
                const appointmentDate = appointment.appointmentDate
                    ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                      })
                    : 'N/A';
                doc.text(`Date:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointmentDate}`, 60, yPos);

                yPos += 8;
                doc.setFont('helvetica', 'normal');
                doc.text(`Time:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                doc.text(`${appointment.appointmentTime || 'N/A'}`, 60, yPos);

                yPos += 8;
                doc.setFont('helvetica', 'normal');
                doc.text(`Status:`, 20, yPos);
                doc.setFont('helvetica', 'bold');
                const status = appointment.status || 'pending';
                const statusColor = status === 'confirmed' ? [34, 197, 94] : status === 'completed' ? [59, 130, 246] : status === 'cancelled' ? [239, 68, 68] : [234, 179, 8];
                doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                doc.text(`${status.toUpperCase()}`, 60, yPos);
                doc.setTextColor(0, 0, 0);

                yPos += 20;

                // Reason for Visit Section
                if (appointment.reason) {
                    doc.setFillColor(243, 232, 255); // Light purple background
                    const reasonHeight = Math.max(35, Math.ceil(appointment.reason.length / 80) * 8 + 20);
                    doc.roundedRect(15, yPos, pageWidth - 30, reasonHeight, 3, 3, 'F');

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(147, 51, 234); // Purple
                    doc.text('Reason for Visit', 20, yPos + 8);

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0);

                    yPos += 18;
                    const reasonLines = doc.splitTextToSize(appointment.reason, pageWidth - 50);
                    doc.text(reasonLines, 20, yPos);

                    yPos += reasonHeight - 10;
                }

                // Doctor Notes Section (if available)
                if (appointment.doctorNotes) {
                    yPos += 10;
                    doc.setFillColor(220, 252, 231); // Light green background
                    const notesHeight = Math.max(35, Math.ceil(appointment.doctorNotes.length / 80) * 8 + 20);
                    doc.roundedRect(15, yPos, pageWidth - 30, notesHeight, 3, 3, 'F');

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(22, 163, 74); // Green
                    doc.text('Doctor Notes', 20, yPos + 8);

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(0, 0, 0);

                    yPos += 18;
                    const notesLines = doc.splitTextToSize(appointment.doctorNotes, pageWidth - 50);
                    doc.text(notesLines, 20, yPos);

                    yPos += notesHeight - 10;
                }

                // Footer
                doc.setDrawColor(200, 200, 200);
                doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);

                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('This is a computer-generated report and does not require a signature.', pageWidth / 2, pageHeight - 18, { align: 'center' });
                doc.text('For any queries, please contact the hospital administration.', pageWidth / 2, pageHeight - 13, { align: 'center' });
                doc.text(`© ${new Date().getFullYear()} Healthcare Management System. All rights reserved.`, pageWidth / 2, pageHeight - 8, { align: 'center' });

                // Save the PDF
                const fileName = `Appointment_Report_${appointment.queueNumber || 'Unknown'}_${new Date().getTime()}.pdf`;
                doc.save(fileName);

                setGenerating(false);
                setReportGenerated(true);

                setTimeout(() => {
                    setReportGenerated(false);
                }, 3000);
            } catch (error) {
                console.error('Error generating PDF:', error);

                // More user-friendly error message
                const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
                alert(`Failed to generate PDF: ${errorMsg}\n\nPlease check:\n- All appointment data is complete\n- Your browser allows downloads\n- Try refreshing the page`);

                setGenerating(false);
            }
        }, 1500);
    };

    const printReport = (): void => {
        window.print();
    };

    const shareReport = (): void => {
        if (navigator.share) {
            navigator.share({
                title: 'Appointment Report',
                text: `Appointment for ${appointment.patientName} with ${appointment.doctor?.name}`,
            });
        } else {
            alert('Share feature not supported on this browser');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                <FaFilePdf className="text-white text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Appointment Report</h2>
                                <p className="text-blue-100 text-sm mt-1">Generate and download your report</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Report Preview */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-blue-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <FaChartBar className="mr-2 text-blue-600" />
                            Report Preview
                        </h3>

                        <div className="space-y-4">
                            {/* Patient Info */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center mb-3">
                                    <FaUser className="text-blue-600 mr-2" />
                                    <h4 className="font-semibold text-gray-800">Patient Information</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <span className="ml-2 font-medium">{appointment.patientName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Age:</span>
                                        <span className="ml-2 font-medium">{appointment.patientAge} years</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Queue Number:</span>
                                        <span className="ml-2 font-medium text-blue-600">{appointment.queueNumber}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Doctor Info */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center mb-3">
                                    <FaUserMd className="text-indigo-600 mr-2" />
                                    <h4 className="font-semibold text-gray-800">Doctor Information</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Doctor:</span>
                                        <span className="ml-2 font-medium">
                                            {appointment.doctor?.title || 'Dr.'} {appointment.doctor?.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Specialization:</span>
                                        <span className="ml-2 font-medium">{appointment.doctor?.specialization}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center mb-3">
                                    <FaCalendarAlt className="text-purple-600 mr-2" />
                                    <h4 className="font-semibold text-gray-800">Appointment Details</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-600">Date:</span>
                                        <span className="ml-2 font-medium">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Time:</span>
                                        <span className="ml-2 font-medium">{appointment.appointmentTime}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Status:</span>
                                        <span
                                            className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                                appointment.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : appointment.status === 'completed'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : appointment.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {appointment.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            {appointment.reason && (
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <FaHospital className="text-green-600 mr-2" />
                                        <h4 className="font-semibold text-gray-800">Reason for Visit</h4>
                                    </div>
                                    <p className="text-sm text-gray-700">{appointment.reason}</p>
                                </div>
                            )}

                            {/* Doctor Notes */}
                            {appointment.doctorNotes && (
                                <div className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center mb-3">
                                        <FaCheckCircle className="text-blue-600 mr-2" />
                                        <h4 className="font-semibold text-gray-800">Doctor Notes</h4>
                                    </div>
                                    <p className="text-sm text-gray-700">{appointment.doctorNotes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Success Message */}
                    {reportGenerated && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 animate-slideIn">
                            <div className="flex items-center">
                                <FaCheckCircle className="text-green-600 text-xl mr-3" />
                                <div>
                                    <p className="font-semibold text-green-800">Report Generated Successfully!</p>
                                    <p className="text-sm text-green-700">Your PDF has been downloaded.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Generate PDF */}
                        <button
                            onClick={generatePDF}
                            disabled={generating}
                            className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg ${
                                generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                            }`}
                        >
                            {generating ? (
                                <>
                                    <FaSpinner className="animate-spin text-xl" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <FaDownload className="text-xl" />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>

                        {/* Print */}
                        <button
                            onClick={printReport}
                            className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                            <FaPrint className="text-xl" />
                            <span>Print Report</span>
                        </button>

                        {/* Share */}
                        <button
                            onClick={shareReport}
                            className="flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                            <FaShare className="text-xl" />
                            <span>Share</span>
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h4 className="text-sm font-semibold text-blue-800">Report Information</h4>
                                <p className="text-xs text-blue-700 mt-1">
                                    This report contains all appointment details including patient information, doctor details, and appointment status. The PDF will be automatically downloaded to your
                                    device.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
                .animate-slideIn {
                    animation: slideIn 0.5s ease-out;
                }
                `}
            </style>
        </div>
    );
};

export default ModernReportGenerator;
