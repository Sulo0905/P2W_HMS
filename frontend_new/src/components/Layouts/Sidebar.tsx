import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';
import IconCaretDown from '../Icon/IconCaretDown';
import IconMenuDashboard from '../Icon/Menu/IconMenuDashboard';
import IconMinus from '../Icon/IconMinus';
import IconMenuComponents from '../Icon/Menu/IconMenuComponents';
import IconMenuElements from '../Icon/Menu/IconMenuElements';
import IconMenuCharts from '../Icon/Menu/IconMenuCharts';
import IconMenuFontIcons from '../Icon/Menu/IconMenuFontIcons';
import IconMenuUsers from '../Icon/Menu/IconMenuUsers';
import IconMenuPOS from '../Icon/Menu/IconMenuPOS';
import IconMenuProduct from '../Icon/Menu/IconMenuProduct';
import IconMenuProductLocation from '../Icon/Menu/IconMenuProductLocation';
import IconMenuStocks from '../Icon/Menu/IconMenuStocks';
import IconMenuStockWarning from '../Icon/Menu/IconMenuStockWarning';
import { SquareActivity } from 'lucide-react';
import IconMenuCategory from '../Icon/Menu/IconMenuCategory';
import IconMenuOrders from '../Icon/Menu/IconMenuOrders';
import IconHeart from '../Icon/IconHeart';
import IconNotes from '../Icon/IconNotes';
import IconPlus from '../Icon/IconPlus';
import IconCalendar from '../Icon/IconCalendar';
import IconArchive from '../Icon/IconArchive';
import IconMapPin from '../Icon/IconMapPin';
import IconAirplay from '../Icon/IconAirplay';
import IconAward from '../Icon/IconAward';
import IconBolt from '../Icon/IconBolt';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user?.role;

    const dashboardPath = role === 'admin' ? '/admin-dashboard' : role === 'doctor' ? '/doctor-dashboard' : role === 'patient' ? '/patient-dashboard' : '/auth/login';

    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar fixed min-h-screen w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
                <div className="bg-white dark:bg-black h-full">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4">
                        <NavLink to={dashboardPath} className="flex items-center space-x-3">
                            <img className="flex-none" src="/assets/images/logo-p2w.png" alt="logo" style={{ width: '200px', height: '200px' }} />
                        </NavLink>
                        <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-500/10" onClick={() => dispatch(toggleSidebar())}>
                            <IconCaretsDown className="rotate-90" />
                        </button>
                    </div>

                    <PerfectScrollbar className="h-[calc(100vh-80px)]">
                        <ul className="p-4 font-semibold space-y-0.5">
                            <li className="menu nav-item">
                                <NavLink to={dashboardPath} className="group">
                                    <div className="flex items-center">
                                        <IconMenuDashboard className="group-hover:!text-primary shrink-0" />
                                        <span className="pl-3">{t('Dashboard')}</span>
                                    </div>
                                </NavLink>
                            </li>

                            {role === 'admin' && (
                                <>
                                    <h2 className="py-3 px-7 font-extrabold bg-white-light/30 dark:bg-dark/10 uppercase">Administrator</h2>
                                    <li className="nav-item">
                                        <NavLink to="/admin/manage-patients" className="group">
                                            <div className="flex items-center">
                                                <IconMenuProduct className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Manage Patients')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/admin/manage-doctor" className="group">
                                            <div className="flex items-center">
                                                <IconPlus className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Manage Doctor')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/admin/assign-patient" className="group">
                                            <div className="flex items-center">
                                                <IconHeart className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Assign Patients')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/admin/appointments" className="group">
                                            <div className="flex items-center">
                                                <IconCalendar className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Appointments')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/admin/ai-insight" className="group">
                                            <div className="flex items-center">
                                                <IconBolt className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('AI Insight')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {role === 'doctor' && (
                                <>
                                    <h2 className="py-3 px-7 font-extrabold bg-white-light/30 dark:bg-dark/10 uppercase">Doctor</h2>
                                    <li className="nav-item">
                                        <NavLink to="/doctor/view-appointments" className="group">
                                            <div className="flex items-center">
                                                <IconMenuProductLocation className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('View Appointments')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/ent" className="group">
                                            <div className="flex items-center">
                                                <IconMenuPOS className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('ENT Health Log')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/obstetrics" className="group">
                                            <div className="flex items-center">
                                                <IconAirplay className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Obstetrics Health Log')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/reports" className="group">
                                            <div className="flex items-center">
                                                <IconAward className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Analytics & Reports')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/register" className="group">
                                            <div className="flex items-center">
                                                <IconPlus className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Register Health Logs')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/admin/care-plan" className="group">
                                            <div className="flex items-center">
                                                <IconNotes className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Care Plan')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {role === 'patient' && (
                                <>
                                    <h2 className="py-3 px-7 font-extrabold bg-white-light/30 dark:bg-dark/10 uppercase">Patient</h2>
                                    <li className="nav-item">
                                        <NavLink to="/patient/emergency-appointment" className="group">
                                            <div className="flex items-center">
                                                <IconMapPin className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Emergency Appointment')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/patient/create-appointment" className="group">
                                            <div className="flex items-center">
                                                <IconArchive className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('Create Appointment')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/patient/view-appointment" className="group">
                                            <div className="flex items-center">
                                                <IconNotes className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('My Appointments')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/patient/health-log" className="group">
                                            <div className="flex items-center">
                                                <IconHeart className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('View Health Log')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/patient/care-plan" className="group">
                                            <div className="flex items-center">
                                                <IconNotes className="group-hover:!text-primary shrink-0" />
                                                <span className="pl-3">{t('View Care Plan')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
