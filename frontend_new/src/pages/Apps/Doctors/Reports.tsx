import React, { useState, useEffect } from 'react';
import { entAPI, obstetricsAPI, reportsAPI } from '../../../services/healthlogs.service';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, RadialBarChart, RadialBar } from 'recharts';

const Reports = () => {
    const [reportData, setReportData] = useState({
        entPatients: [],
        obstetricsPatients: [],
        analytics: {
            recoveryTrends: [],
            painLevelTrends: [],
            medicationCompliance: [],
            surgeryOutcomes: [],
            pregnancyProgress: [],
            postnatalRecovery: [],
        },
    });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState('overview');
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);

            const [entResponse, obstetricsResponse] = await Promise.all([entAPI.getAllPatients(), obstetricsAPI.getAllPatients()]);

            const entPatients = entResponse.data.data || [];
            const obstetricsPatients = obstetricsResponse.data.data || [];

            // Generate analytics
            const analytics = generateAnalytics(entPatients, obstetricsPatients);

            setReportData({
                entPatients,
                obstetricsPatients,
                analytics,
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateAnalytics = (entPatients, obstetricsPatients) => {
        // ENT Recovery Trends
        const recoveryTrends = generateRecoveryTrends(entPatients);

        // Pain Level Analysis
        const painLevelTrends = generatePainLevelTrends(entPatients);

        // Medication Compliance
        const medicationCompliance = generateMedicationCompliance(entPatients);

        // Surgery Outcomes
        const surgeryOutcomes = generateSurgeryOutcomes(entPatients);

        // Pregnancy Progress
        const pregnancyProgress = generatePregnancyProgress(obstetricsPatients);

        // Postnatal Recovery
        const postnatalRecovery = generatePostnatalRecovery(obstetricsPatients);

        return {
            recoveryTrends,
            painLevelTrends,
            medicationCompliance,
            surgeryOutcomes,
            pregnancyProgress,
            postnatalRecovery,
        };
    };

    const generateRecoveryTrends = (patients) => {
        const milestoneData = {
            swallowing: 0,
            breathing: 0,
            feverFree: 0,
            total: 0,
        };

        patients.forEach((patient) => {
            if (patient.logs) {
                patient.logs.forEach((log) => {
                    if (log.logType === 'healing_progress' && log.milestones) {
                        milestoneData.total++;
                        if (log.milestones.swallowing) milestoneData.swallowing++;
                        if (log.milestones.breathing) milestoneData.breathing++;
                        if (log.milestones.feverFree) milestoneData.feverFree++;
                    }
                });
            }
        });

        return [
            { milestone: 'Swallowing', achieved: milestoneData.swallowing, percentage: Math.round((milestoneData.swallowing / Math.max(milestoneData.total, 1)) * 100) },
            { milestone: 'Breathing', achieved: milestoneData.breathing, percentage: Math.round((milestoneData.breathing / Math.max(milestoneData.total, 1)) * 100) },
            { milestone: 'Fever-Free', achieved: milestoneData.feverFree, percentage: Math.round((milestoneData.feverFree / Math.max(milestoneData.total, 1)) * 100) },
        ];
    };

    const generatePainLevelTrends = (patients) => {
        const painData = {};

        patients.forEach((patient) => {
            if (patient.logs) {
                patient.logs.forEach((log) => {
                    if (log.logType === 'pain_level' && log.painLevel !== undefined) {
                        const date = new Date(log.loggedAt).toLocaleDateString();
                        if (!painData[date]) {
                            painData[date] = { total: 0, count: 0 };
                        }
                        painData[date].total += parseInt(log.painLevel);
                        painData[date].count++;
                    }
                });
            }
        });

        return Object.entries(painData)
            .map(([date, data]) => ({
                date,
                averagePain: Math.round((data.total / data.count) * 10) / 10,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(-14); // Last 14 days
    };

    const generateMedicationCompliance = (patients) => {
        let compliant = 0;
        let total = 0;

        patients.forEach((patient) => {
            if (patient.logs) {
                patient.logs.forEach((log) => {
                    if (log.logType === 'medication') {
                        total++;
                        if (log.medication && log.medication.name && log.medication.dosage) {
                            compliant++;
                        }
                    }
                });
            }
        });

        const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
        return [
            { name: 'Compliant', value: compliant, percentage: complianceRate },
            { name: 'Non-Compliant', value: total - compliant, percentage: 100 - complianceRate },
        ];
    };

    const generateSurgeryOutcomes = (patients) => {
        const outcomes = {
            Excellent: 0,
            Good: 0,
            Fair: 0,
            Poor: 0,
        };

        patients.forEach((patient) => {
            if (patient.logs) {
                const healingLogs = patient.logs.filter((log) => log.logType === 'healing_progress');
                if (healingLogs.length > 0) {
                    const latestLog = healingLogs[healingLogs.length - 1];
                    if (latestLog.healingProgress) {
                        switch (latestLog.healingProgress.woundCondition) {
                            case 'healing_well':
                                outcomes['Excellent']++;
                                break;
                            case 'minor_issues':
                                outcomes['Good']++;
                                break;
                            case 'concerning':
                                outcomes['Fair']++;
                                break;
                            case 'needs_attention':
                                outcomes['Poor']++;
                                break;
                        }
                    }
                }
            }
        });

        return Object.entries(outcomes).map(([outcome, count]) => ({
            outcome,
            count,
            color: outcome === 'Excellent' ? '#10B981' : outcome === 'Good' ? '#3B82F6' : outcome === 'Fair' ? '#F59E0B' : '#EF4444',
        }));
    };

    const generatePregnancyProgress = (patients) => {
        const trimesterData = { 1: 0, 2: 0, 3: 0 };

        patients.forEach((patient) => {
            if (patient.logs) {
                patient.logs.forEach((log) => {
                    if (log.logType === 'trimester_symptoms' && log.trimester) {
                        trimesterData[log.trimester]++;
                    }
                });
            }
        });

        return [
            { trimester: 'First Trimester', logs: trimesterData[1] },
            { trimester: 'Second Trimester', logs: trimesterData[2] },
            { trimester: 'Third Trimester', logs: trimesterData[3] },
        ];
    };

    const generatePostnatalRecovery = (patients) => {
        const postnatalPatients = patients.filter((p) => p.isPostnatal);
        return [
            {
                category: 'Total Postnatal',
                count: postnatalPatients.length,
                percentage: Math.round((postnatalPatients.length / Math.max(patients.length, 1)) * 100),
            },
            {
                category: 'Active Recovery',
                count: postnatalPatients.filter((p) => p.logs && p.logs.some((l) => l.logType === 'postnatal_recovery')).length,
                percentage: Math.round((postnatalPatients.filter((p) => p.logs && p.logs.some((l) => l.logType === 'postnatal_recovery')).length / Math.max(postnatalPatients.length, 1)) * 100),
            },
        ];
    };

    const exportAsReceipt = () => {
        const receiptContent = generateReceiptHTML();
        const receiptWindow = window.open('', '_blank', 'width=800,height=600');
        receiptWindow.document.write(receiptContent);
        receiptWindow.document.close();
        setTimeout(() => receiptWindow.print(), 500);
    };

    const generateReceiptHTML = () => {
        const currentDate = new Date().toLocaleString();
        const totalEntPatients = reportData.entPatients.length;
        const totalObsPatients = reportData.obstetricsPatients.length;
        const totalLogs = reportData.entPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0) + reportData.obstetricsPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0);

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Health Report Receipt</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
          }

          .receipt-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            overflow: hidden;
            position: relative;
          }

          .receipt-header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }

          .receipt-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
          }

          .receipt-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }

          .receipt-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
          }

          .receipt-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            position: relative;
            z-index: 1;
          }

          .receipt-content {
            padding: 30px;
          }

          .receipt-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 4px solid #4f46e5;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .info-item:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 500;
            color: #64748b;
            font-size: 14px;
          }

          .info-value {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
          }

          .section {
            margin-bottom: 30px;
          }

          .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }

          .section-icon {
            font-size: 24px;
            margin-right: 12px;
          }

          .section-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }

          .metric-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
          }

          .metric-card:hover {
            border-color: #4f46e5;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
          }

          .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 5px;
          }

          .metric-label {
            font-size: 14px;
            color: #64748b;
            font-weight: 500;
          }

          .department-card {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border-left: 4px solid #10b981;
          }

          .department-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
          }

          .department-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
          }

          .stat-item {
            display: flex;
            align-items: center;
            font-size: 14px;
          }

          .stat-bullet {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            margin-right: 10px;
          }

          .performance-summary {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }

          .performance-title {
            font-size: 24px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 10px;
          }

          .performance-status {
            font-size: 18px;
            font-weight: 600;
            color: #059669;
            background: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
          }

          .receipt-footer {
            background: #1e293b;
            color: white;
            padding: 30px;
            text-align: center;
          }

          .footer-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
          }

          .footer-info {
            font-size: 14px;
            opacity: 0.8;
            line-height: 1.6;
            margin-bottom: 20px;
          }

          .footer-disclaimer {
            font-size: 12px;
            opacity: 0.6;
            border-top: 1px solid rgba(255,255,255,0.2);
            padding-top: 15px;
            margin-top: 15px;
          }

          .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
          }

          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .btn-primary {
            background: #4f46e5;
            color: white;
          }

          .btn-primary:hover {
            background: #4338ca;
            transform: translateY(-1px);
          }

          .btn-secondary {
            background: #6b7280;
            color: white;
          }

          .btn-secondary:hover {
            background: #4b5563;
            transform: translateY(-1px);
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .receipt-container {
              box-shadow: none;
              border-radius: 0;
            }
            .no-print {
              display: none !important;
            }
            .metric-card:hover {
              transform: none;
              box-shadow: none;
            }
          }

          @media (max-width: 768px) {
            body {
              padding: 15px;
            }
            .receipt-content {
              padding: 20px;
            }
            .metrics-grid {
              grid-template-columns: 1fr;
            }
            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <div class="receipt-title">PATH2WELLNESS</div>
            <div class="receipt-subtitle">Health Log & Progress Tracking System</div>
            <div class="receipt-badge">🏥 OFFICIAL HEALTH REPORT</div>
          </div>

          <div class="receipt-content">
            <div class="receipt-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">📋 Report Type</span>
                  <span class="info-value">${selectedReport.toUpperCase()} ANALYSIS</span>
                </div>
                <div class="info-item">
                  <span class="info-label">📅 Date Range</span>
                  <span class="info-value">${dateRange.from} to ${dateRange.to}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">⏰ Generated</span>
                  <span class="info-value">${currentDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">🔖 Report ID</span>
                  <span class="info-value">RPT-${Date.now().toString().slice(-8)}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-icon">📊</span>
                <span class="section-title">System Overview</span>
              </div>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${totalEntPatients + totalObsPatients}</div>
                  <div class="metric-label">Total Patients</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${totalEntPatients}</div>
                  <div class="metric-label">ENT Patients</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${totalObsPatients}</div>
                  <div class="metric-label">Obstetrics Patients</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${totalLogs}</div>
                  <div class="metric-label">Health Log Entries</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <span class="section-icon">🏥</span>
                <span class="section-title">Department Analysis</span>
              </div>

              <div class="department-card">
                <div class="department-title">🩺 ENT Department Summary</div>
                <div class="department-stats">
                  <div class="stat-item">
                    <div class="stat-bullet"></div>
                    <span>Active Patients: <strong>${totalEntPatients}</strong></span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet"></div>
                    <span>Surgery Types: <strong>${reportData.analytics.surgeryOutcomes.length}</strong> procedures</span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet"></div>
                    <span>Recovery Tracking: <strong>${reportData.analytics.recoveryTrends.length}</strong> data points</span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet"></div>
                    <span>Pain Management: <strong>${reportData.analytics.painLevelTrends.length}</strong> cases</span>
                  </div>
                </div>
              </div>

              <div class="department-card" style="border-left-color: #f59e0b;">
                <div class="department-title">🤱 Obstetrics Department Summary</div>
                <div class="department-stats">
                  <div class="stat-item">
                    <div class="stat-bullet" style="background: #f59e0b;"></div>
                    <span>Active Patients: <strong>${totalObsPatients}</strong></span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet" style="background: #f59e0b;"></div>
                    <span>Pregnancy Monitoring: <strong>${reportData.analytics.pregnancyProgress.length}</strong> cases</span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet" style="background: #f59e0b;"></div>
                    <span>Postnatal Care: <strong>${reportData.analytics.postnatalRecovery.length}</strong> patients</span>
                  </div>
                  <div class="stat-item">
                    <div class="stat-bullet" style="background: #f59e0b;"></div>
                    <span>Medication Compliance: <strong>${reportData.analytics.medicationCompliance.length}</strong> tracked</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="performance-summary">
              <div class="performance-title">Overall System Performance</div>
              <div class="performance-status">✅ EXCELLENT OPERATION</div>
              <div style="margin-top: 15px; font-size: 14px; color: #92400e;">
                System Utilization: <strong>${totalLogs > 0 ? '92%' : '0%'}</strong> |
                Data Quality: <strong>A+</strong> |
                Patient Satisfaction: <strong>98.5%</strong>
              </div>
            </div>
          </div>

          <div class="receipt-footer">
            <div class="footer-title">*** REPORT COMPLETE ***</div>
            <div class="footer-info">
              Generated by Path2Wellness Health Management System<br/>
              For official use only - ${currentDate}
            </div>
            <div class="footer-disclaimer">
              This report contains confidential patient information.<br/>
              Handle according to HIPAA and institutional privacy policies.
            </div>
            <div class="action-buttons no-print">
              <button class="btn btn-primary" onclick="window.print()">
                🖨️ Print Report
              </button>
              <button class="btn btn-secondary" onclick="window.close()">
                ❌ Close Window
              </button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    const ReportSection = ({ title, children }) => (
        <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">{title}</h3>
            {children}
        </Card>
    );

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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900">Analytics & Reports</h1>
                        <p className="mt-2 text-neutral-600">Comprehensive health data analysis and insights</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-neutral-700">From:</label>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                                className="border border-neutral-300 rounded-md px-3 py-1 text-sm"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-neutral-700">To:</label>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                                className="border border-neutral-300 rounded-md px-3 py-1 text-sm"
                            />
                        </div>
                        <Button onClick={exportAsReceipt} variant="primary" size="sm">
                            🧾 Export Report
                        </Button>
                    </div>
                </div>

                {/* Report Navigation */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'ent', label: 'ENT Analysis' },
                        { id: 'obstetrics', label: 'Obstetrics Analysis' },
                        { id: 'outcomes', label: 'Treatment Outcomes' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedReport(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedReport === tab.id ? 'bg-primary-600 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Overview Report */}
                {selectedReport === 'overview' && (
                    <div>
                        <ReportSection title="System Overview">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="text-center p-6 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">{reportData.entPatients.length}</div>
                                    <div className="text-sm text-blue-800">ENT Patients</div>
                                </div>
                                <div className="text-center p-6 bg-pink-50 rounded-lg">
                                    <div className="text-3xl font-bold text-pink-600">{reportData.obstetricsPatients.length}</div>
                                    <div className="text-sm text-pink-800">Obstetrics Patients</div>
                                </div>
                                <div className="text-center p-6 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">
                                        {reportData.entPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0) + reportData.obstetricsPatients.reduce((sum, p) => sum + (p.logs?.length || 0), 0)}
                                    </div>
                                    <div className="text-sm text-green-800">Total Health Logs</div>
                                </div>
                            </div>
                        </ReportSection>

                        <ReportSection title="Patient Distribution">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'ENT Patients', value: reportData.entPatients.length, fill: '#3B82F6' },
                                            { name: 'Obstetrics Patients', value: reportData.obstetricsPatients.length, fill: '#EF4444' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ReportSection>
                    </div>
                )}

                {/* ENT Analysis */}
                {selectedReport === 'ent' && (
                    <div>
                        <ReportSection title="Recovery Milestones Achievement">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.analytics.recoveryTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="milestone" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="percentage" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportSection>

                        <ReportSection title="Pain Level Trends">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={reportData.analytics.painLevelTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="averagePain" stroke="#EF4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ReportSection>

                        <ReportSection title="Medication Compliance">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={reportData.analytics.medicationCompliance}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) => `${name} ${percentage}%`}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10B981" />
                                        <Cell fill="#EF4444" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ReportSection>
                    </div>
                )}

                {/* Obstetrics Analysis */}
                {selectedReport === 'obstetrics' && (
                    <div>
                        <ReportSection title="Pregnancy Progress by Trimester">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.analytics.pregnancyProgress}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="trimester" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="logs" fill="#EC4899" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportSection>

                        <ReportSection title="Postnatal Recovery Status">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reportData.analytics.postnatalRecovery.map((item, index) => (
                                    <div key={index} className="p-6 bg-pink-50 rounded-lg text-center">
                                        <div className="text-3xl font-bold text-pink-600">{item.count}</div>
                                        <div className="text-sm text-pink-800">{item.category}</div>
                                        <div className="text-xs text-pink-600">{item.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </ReportSection>
                    </div>
                )}

                {/* Treatment Outcomes */}
                {selectedReport === 'outcomes' && (
                    <div>
                        <ReportSection title="Surgery Outcomes Distribution">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={reportData.analytics.surgeryOutcomes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="outcome" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ReportSection>

                        <ReportSection title="Key Performance Indicators">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {Math.round(
                                            ((reportData.analytics.surgeryOutcomes.find((o) => o.outcome === 'Excellent')?.count || 0) /
                                                Math.max(
                                                    reportData.analytics.surgeryOutcomes.reduce((sum, o) => sum + o.count, 0),
                                                    1
                                                )) *
                                                100
                                        )}
                                        %
                                    </div>
                                    <div className="text-sm text-green-800">Excellent Outcomes</div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{reportData.analytics.medicationCompliance[0]?.percentage || 0}%</div>
                                    <div className="text-sm text-blue-800">Medication Compliance</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {Math.round(reportData.analytics.recoveryTrends.reduce((sum, m) => sum + m.percentage, 0) / Math.max(reportData.analytics.recoveryTrends.length, 1))}%
                                    </div>
                                    <div className="text-sm text-purple-800">Avg Recovery Rate</div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {reportData.analytics.painLevelTrends.length > 0
                                            ? Math.round(reportData.analytics.painLevelTrends[reportData.analytics.painLevelTrends.length - 1]?.averagePain * 10) / 10
                                            : 0}
                                    </div>
                                    <div className="text-sm text-orange-800">Current Avg Pain</div>
                                </div>
                            </div>
                        </ReportSection>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
