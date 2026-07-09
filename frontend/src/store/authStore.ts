import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginWithPassword as apiLoginWithPassword } from '@/api/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentClass {
    id: number;
    name: string;
    academic_year_id: number;
    academic_year?: {
        id: number;
        name: string;
        is_active: boolean;
    };
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'siswa' | 'guru' | 'admin';
    avatar: string | null;
    avatar_type: 'generated' | 'upload';
    google_id: string | null;
    status: 'pending' | 'active' | 'blocked';
    absen_number: number | null;
    nis_nip: string | null;
    phone: string | null;
    is_active: boolean;
    class_id: number | null;
    student_class: StudentClass | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;

    setAuth: (token: string, user: User) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
    loginWithPassword: (email: string, password: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,

            setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

            updateUser: (partial) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...partial } : null,
                })),

            logout: () => set({ token: null, user: null, isAuthenticated: false }),

            /**
             * Login dengan email + password.
             * Melempar error agar komponen bisa handle pesan spesifik (pending/blocked/salah).
             */
            loginWithPassword: async (email, password) => {
                const data = await apiLoginWithPassword(email, password);
                set({ token: data.data.token, user: data.data.user, isAuthenticated: true });
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
