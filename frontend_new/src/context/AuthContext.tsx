import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Role = 'guest' | 'patient' | 'doctor' | 'admin';

export interface AuthUser {
    name: string;
    role: Role;
    patientId?: string;
}

interface AuthContextValue {
    role: Role;
    user: AuthUser | null;
    isAdmin: boolean;
    isDoctor: boolean;
    isPatient: boolean;
    isGuest: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
    loginAs: (newRole: Role, opts?: { name?: string; patientId?: string }) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [role, setRole] = useState<Role>('doctor');
    const [user, setUser] = useState<AuthUser | null>({ name: 'doctor', role: 'doctor' });

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('auth') || 'null') as { role?: Role; user?: AuthUser } | null;
            if (saved && saved.role) {
                setRole(saved.role);
                setUser(saved.user ?? null);
            } else {
                setRole('doctor');
                setUser({ name: 'doctor', role: 'doctor' });
            }
        } catch {
            setRole('doctor');
            setUser({ name: 'doctor', role: 'doctor' });
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('auth', JSON.stringify({ role, user }));
        } catch {}
    }, [role, user]);

    const loginAs = (newRole: Role, opts: { name?: string; patientId?: string } = {}) => {
        setRole(newRole);
        setUser({ name: opts.name || newRole, role: newRole, patientId: opts.patientId });
    };

    const logout = () => {
        setRole('guest');
        setUser(null);
    };

    const value: AuthContextValue = useMemo(() => {
        const isAdmin = role === 'admin';
        const isDoctor = role === 'doctor';
        const isPatient = role === 'patient';
        const isGuest = role === 'guest';

        const canEdit = isAdmin || isDoctor;
        const canDelete = isAdmin || isDoctor;
        const canView = true;

        return { role, user, isAdmin, isDoctor, isPatient, isGuest, canEdit, canDelete, canView, loginAs, logout };
    }, [role, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};
