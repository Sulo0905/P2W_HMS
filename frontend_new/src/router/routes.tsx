import { lazy } from 'react';
import HealthLog from '../pages/Apps/Admin/HealthLog';
import CarePatient from '../pages/Apps/Admin/CarePatient';
import ManageDoctors from '../pages/Apps/Admin/Doctors/ManageDoctors';
import ViewAppointment from '../pages/Apps/Doctors/ViewAppointment';
import { Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const DoctorDashboard = lazy(() => import('../pages/Apps/Doctors/Dashboard'));
const PatientDashboard = lazy(() => import('../pages/Apps/Patient/Dashboard'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const ManagePatients = lazy(() => import('../pages/Apps/Admin/Patients/ManagePatients'));
const MyAppointments = lazy(() => import('../pages/Apps/Admin/Patients/Appointments'));
const AssignPatient = lazy(() => import('../pages/Apps/Admin/Patients/AssignPatient'));
const CreateAppointment = lazy(() => import('../pages/Apps/Patient/CreateAppointment'));
const PatientViewAppointment = lazy(() => import('../pages/Apps/Patient/ViewAppointment'));
const EmergencyAppointment = lazy(() => import('../pages/Apps/Patient/EmergancyAppointment'));
const EntPatients = lazy(() => import('../pages/Apps/Doctors/EntPatients'));
const EntProfile = lazy(() => import('../pages/Apps/Doctors/EntProfile'));
const EntLogs = lazy(() => import('../pages/Apps/Doctors/EntLogs'));
const EntTimeline = lazy(() => import('../pages/Apps/Doctors/EntTimeline'));
const EntProgress = lazy(() => import('../pages/Apps/Doctors/EntProgress'));
const ObstetricsPatients = lazy(() => import('../pages/Apps/Doctors/ObstetricsPatients'));
const ObstetricsProfile = lazy(() => import('../pages/Apps/Doctors/ObstetricsProfile'));
const ObstetricsLogs = lazy(() => import('../pages/Apps/Doctors/ObstetricsLogs'));
const ObstetricsTimeline = lazy(() => import('../pages/Apps/Doctors/ObstetricsTimeline'));
const ObstetricsProgress = lazy(() => import('../pages/Apps/Doctors/ObstetricsProgress'));
const RegisterPatient = lazy(() => import('../pages/Apps/Doctors/RegisterPatient'));
const Reports = lazy(() => import('../pages/Apps/Doctors/Reports'));
const AIInsight = lazy(() => import('../pages/Apps/Admin/AdminAiInsight'));

const routes = [
    {
        path: '/',
        element: <Navigate to="/auth/login" replace />,
    },
    // dashboards
    {
        path: '/admin-dashboard',
        protected: true,
        element: <Dashboard />,
        roles: ['admin'],
    },
    {
        path: '/doctor-dashboard',
        protected: true,
        element: <DoctorDashboard />,
        roles: ['doctor'],
    },
    {
        path: '/patient-dashboard',
        protected: true,
        element: <PatientDashboard />,
        roles: ['patient'],
    },
    {
        path: '/admin/manage-patients',
        element: <ManagePatients />,
        roles: ['admin'],
    },
    //Authentication
    {
        path: '/auth/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },

    {
        path: '/admin/manage-patients',
        element: <ManagePatients />,
        roles: ['admin'],
    },

    {
        path: '/admin/health-log',
        element: <HealthLog />,
        roles: ['admin'],
    },

    {
        path: '/admin/care-patient',
        element: <CarePatient />,
        roles: ['admin'],
    },

    {
        path: '/admin/manage-doctor',
        element: <ManageDoctors />,
        roles: ['admin'],
    },
    {
        path: '/admin/appointments',
        element: <MyAppointments />,
        roles: ['admin'],
    },
    {
        path: '/admin/assign-patient',
        element: <AssignPatient />,
        roles: ['admin'],
    },

    {
        path: '/doctor/view-appointments',
        element: <ViewAppointment />,
        roles: ['doctor'],
    },

    {
        path: '/admin/care-plan',
        element: <CarePatient />,
        roles: ['doctor'],
    },
    {
        path: '/patient/create-appointment',
        element: <CreateAppointment />,
        roles: ['patient'],
    },
    {
        path: '/patient/view-appointment',
        element: <PatientViewAppointment />,
        roles: ['patient'],
    },
    {
        path: '/patient/emergency-appointment',
        element: <EmergencyAppointment />,
        roles: ['patient'],
    },

    // ENT pages
    { path: '/ent', element: <EntPatients /> },
    { path: '/ent/:id/profile', element: <EntProfile /> },
    { path: '/ent/:id/logs', element: <EntLogs /> },
    { path: '/ent/:id/timeline', element: <EntTimeline /> },
    { path: '/ent/:id/progress', element: <EntProgress /> },

    // Obstetrics pages
    { path: '/obstetrics', element: <ObstetricsPatients /> },
    { path: '/obstetrics/:id/profile', element: <ObstetricsProfile /> },
    { path: '/obstetrics/:id/logs', element: <ObstetricsLogs /> },
    { path: '/obstetrics/:id/timeline', element: <ObstetricsTimeline /> },
    { path: '/obstetrics/:id/progress', element: <ObstetricsProgress /> },

    // Register & Reports
    { path: '/register', element: <RegisterPatient /> },
    { path: '/reports', element: <Reports /> },

    { path: '/admin/ai-insight', element: <AIInsight /> },
];

export { routes };
