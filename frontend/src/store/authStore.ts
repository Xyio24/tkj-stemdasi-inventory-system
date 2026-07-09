import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    is_active: boolean;
}

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (token: string, user: User) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            
            setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
            
            updateUser: (user) => set({ user }),
            
            logout: () => set({ token: null, user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // key in localStorage
        }
    )
);
