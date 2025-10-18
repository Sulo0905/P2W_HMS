import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import AuthenticateRoute from './AuthenticateRoute';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    const wrappedElement = route.protected ? <AuthenticateRoute element={route.element} allowedRoles={route.roles} /> : route.element;

    return {
        ...route,
        element: route.layout === 'blank' ? <BlankLayout>{wrappedElement}</BlankLayout> : <DefaultLayout>{wrappedElement}</DefaultLayout>,
    };
});

const router = createBrowserRouter(finalRoutes);
export default router;
