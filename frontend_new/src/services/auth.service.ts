import axiosInstanceNoToken from './axiosInstanceNoToken';

const AUTH_URL = '/auth';

export const login = async (email: string, password: string) => {
    try {
        const response = await axiosInstanceNoToken.post(`${AUTH_URL}/login`, {
            email,
            password,
        });

        if (response.data?.token) {
            localStorage.setItem('token', response.data.token);
        }

        return response.data;
    } catch (error: any) {
        const message = error.response?.data?.message || 'Login failed. Please try again.';
        throw new Error(message);
    }
};
