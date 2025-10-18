import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

// Function to get initial state from localStorage
const getInitialState = (): AuthState => {
    try {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');

        if (token && userString) {
            const user: User = JSON.parse(userString);
            return {
                isAuthenticated: true,
                user,
                token,
            };
        }
    } catch (error) {
        console.error('Error reading auth state from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    return {
        isAuthenticated: false,
        user: null,
        token: null,
    };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(action.payload));
        },
        loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;

            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;

            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
    },
});

export const { setUser, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
