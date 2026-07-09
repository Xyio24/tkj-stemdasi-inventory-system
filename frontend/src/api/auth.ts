import api from '@/lib/axios';
import type { User } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    class_id: number;
    absen_number: number;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        token_type: string;
        user: User;
    };
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const loginWithGoogle = async (token: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/google', { token });
    return response.data;
};

// ─── Email + Password ─────────────────────────────────────────────────────────

export const loginWithPassword = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const registerUser = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data as { success: boolean; message: string };
};

// ─── Google Binding ───────────────────────────────────────────────────────────

export const bindGoogle = async (token: string) => {
    const response = await api.post('/auth/bind-google', { token });
    return response.data as { success: boolean; message: string };
};

export const unbindGoogle = async () => {
    const response = await api.delete('/auth/unbind-google');
    return response.data as { success: boolean; message: string };
};

// ─── Session ──────────────────────────────────────────────────────────────────

export const logout = async () => {
    const response = await api.post('/auth/logout');
    return response.data as { success: boolean; message: string };
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};
