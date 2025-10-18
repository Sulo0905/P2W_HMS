import React, { useEffect, useState } from 'react';
import { Brain, AlertCircle, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';

interface Action {
    action: string;
    details: string;
    priority: 'high' | 'medium' | 'low';
}

interface InsightData {
    prioritized_actions: Action[];
    alerts: string[];
}

const AdminAiInsight: React.FC = () => {
    const [insightData, setInsightData] = useState<InsightData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchSuggestion = async () => {
            try {
                const response = await fetch('http://localhost:3004/api/ai-insight/');
                if (!response.ok) throw new Error('Failed to fetch');
                const data = await response.json();
                setInsightData(data);
            } catch (err: any) {
                console.error(err);
                setError('Failed to fetch AI insight. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestion();
    }, []);

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'high':
                return {
                    card: 'bg-red-50 border-red-300 hover:border-red-400 hover:bg-red-100',
                    badge: 'bg-red-500 text-white',
                    icon: 'text-red-500',
                    text: 'text-red-900',
                };
            case 'medium':
                return {
                    card: 'bg-blue-50 border-blue-300 hover:border-blue-400 hover:bg-blue-100',
                    badge: 'bg-blue-500 text-white',
                    icon: 'text-blue-500',
                    text: 'text-blue-900',
                };
            case 'low':
                return {
                    card: 'bg-green-50 border-green-300 hover:border-green-400 hover:bg-green-100',
                    badge: 'bg-green-500 text-white',
                    icon: 'text-green-500',
                    text: 'text-green-900',
                };
            default:
                return {
                    card: 'bg-gray-50 border-gray-300 hover:border-gray-400 hover:bg-gray-100',
                    badge: 'bg-gray-500 text-white',
                    icon: 'text-gray-500',
                    text: 'text-gray-900',
                };
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return <AlertCircle className="w-4 h-4" />;
            case 'medium':
                return <Clock className="w-4 h-4" />;
            case 'low':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <CheckCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto mt-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Brain className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">AI Admin Insights</h2>
                                <p className="text-sm text-blue-100 mt-0.5">Intelligent recommendations for optimal patient care</p>
                            </div>
                        </div>
                        <div className="bg-green-500 px-4 py-2 rounded-full">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Live
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 bg-gray-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                            <p className="text-gray-600">Analyzing hospital data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                    ) : insightData ? (
                        <div className="space-y-6">
                            {/* Alerts Section */}
                            {insightData.alerts && insightData.alerts.length > 0 && (
                                <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="bg-red-500 p-2 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-red-900">Critical Alerts</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {insightData.alerts.map((alert, index) => (
                                            <div key={index} className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3 hover:bg-red-100 transition-colors">
                                                <div className="bg-red-500 p-1.5 rounded-full mt-0.5 flex-shrink-0">
                                                    <AlertCircle className="w-4 h-4 text-white" />
                                                </div>
                                                <p className="text-red-900 font-medium text-sm flex-1">{alert}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Prioritized Actions */}
                            {insightData.prioritized_actions && insightData.prioritized_actions.length > 0 && (
                                <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="bg-blue-500 p-2 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-blue-900">Recommended Actions</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        {insightData.prioritized_actions.map((action, index) => {
                                            const styles = getPriorityStyles(action.priority);
                                            return (
                                                <div key={index} className={`border-2 rounded-xl p-5 transition-all hover:shadow-md duration-200 ${styles.card}`}>
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div className={`p-1.5 rounded-full mt-0.5 ${styles.icon}`}>{getPriorityIcon(action.priority)}</div>
                                                            <h4 className={`font-bold text-base ${styles.text}`}>{action.action}</h4>
                                                        </div>
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 flex-shrink-0 ${styles.badge}`}>
                                                            {getPriorityIcon(action.priority)}
                                                            {action.priority}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm leading-relaxed ml-9 ${styles.text}`}>{action.details}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <p className="text-gray-500">No insights available at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAiInsight;
