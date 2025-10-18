import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Mail, Lock, ChevronDown, Globe, Zap, SquareActivity } from 'lucide-react';
import { login } from '../../services/auth.service';
import { loginSuccess } from '../../store/authSlice';

const LoginBoxed = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [Email, setEmail] = useState('');
    const [Password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const submitForm = async () => {
        if (loading) return;

        try {
            setLoading(true);
            setError('');

            const data = await login(Email, Password);
            console.log('Login response:', data);

            const token = data.token;
            const user = data.user;
            const role = data.role || user?.role;
            const redirect = data.redirect || getRedirectPath(role);

            if (!token) throw new Error('No token received');

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('role', role);

            dispatch(loginSuccess({ user, token }));

            navigate(redirect, { replace: true });
        } catch (err: any) {
            console.error('Login error:', err);
            const message = err?.response?.data?.message || err?.message || 'Login failed';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to decide where to go
    const getRedirectPath = (role: string) => {
        switch (role) {
            case 'admin':
                return '/admin-dashboard';
            case 'doctor':
                return '/doctor-dashboard';
            case 'patient':
                return '/patient-dashboard';
            default:
                return '/';
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Left Side - Logo and Branding (60%) */}
            <div className="hidden lg:flex lg:w-4/5 flex-col items-center justify-center relative p-8 bg-white">
                <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    {/* Logo with white background circle */}
                    <div className="mb-12 bg-white rounded-3xl p-8 shadow-2xl">
                        <img src="/assets/images/logo-p2w.png" alt="Path2Wellness Logo" className="w-80 h-auto object-contain" />
                    </div>

                    {/* Company Name */}
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">Path2Wellness</h1>

                    {/* Tagline */}
                    <p className="text-xl text-gray-600 max-w-lg leading-relaxed">Pregnancy Care & ENT Management System connecting patients, doctors, and administrators seamlessly.</p>

                    {/* Decorative elements */}
                    <div className="absolute top-20 left-20 w-32 h-32 bg-indigo-100 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-100 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-10 w-24 h-24 bg-green-100 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* Right Side - Login Form (40%) */}
            <div className="w-full lg:w-2/5 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-700 p-8">
                <div className="w-full max-w-md">
                    {/* Login Header */}
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                        <p className="text-blue-100">Please sign in to your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-300 rounded-xl backdrop-blur-sm">
                            <p className="text-red-100 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <div className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="Email" className="block text-sm font-semibold text-white mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="Email"
                                    type="email"
                                    value={Email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="Password" className="block text-sm font-semibold text-white">
                                    Password
                                </label>
                                <button className="text-sm text-blue-100 hover:text-white font-medium transition-colors duration-200">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    id="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={Password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-11 pr-11 py-3.5 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors duration-200"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input id="remember-me" type="checkbox" className="w-4 h-4 rounded border-white/30 text-indigo-600 focus:ring-white/50 bg-white/10" />
                            <label htmlFor="remember-me" className="ml-3 text-sm text-blue-100">
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Sign In Button */}
                        <button
                            onClick={submitForm}
                            disabled={loading}
                            className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-indigo-600 font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="mt-8 text-center">
                        <p className="text-blue-100">
                            Don't have an account? <button className="font-semibold text-white hover:text-blue-100 transition-colors duration-200">Signup</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;
