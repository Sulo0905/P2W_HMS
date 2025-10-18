import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { IRootState } from '../store';
import { loginSuccess } from '../store/authSlice';

interface AuthenticateRouteProps {
    element: JSX.Element;
    allowedRoles?: string[];
}

const AuthenticateRoute: React.FC<AuthenticateRouteProps> = ({ element, allowedRoles }) => {
    const location = useLocation();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: IRootState) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            try {
                const token = localStorage.getItem('token');
                const userString = localStorage.getItem('user');

                if (token && userString) {
                    const parsedUser = JSON.parse(userString);
                    dispatch(loginSuccess({ user: parsedUser, token }));
                    console.log('Auth state restored from localStorage');
                }
            } catch (error) {
                console.error('Error restoring auth state:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }, [isAuthenticated, dispatch]);

    const token = localStorage.getItem('token');
    const hasValidAuth = isAuthenticated || token;

    // ❌ Not logged in
    if (!hasValidAuth) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    // ⚠️ Role-based access check
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return element;
};

export default AuthenticateRoute;
