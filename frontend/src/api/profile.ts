import api from '@/lib/axios';
import type { User } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileResponse {
    success: boolean;
    message: string;
    data: User & { avatar_url: string | null };
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getProfile = async (): Promise<ProfileResponse> => {
    const response = await api.get('/profile');
    return response.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<ProfileResponse> => {
    const response = await api.patch('/profile', data);
    return response.data;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { success: boolean; message: string; data: { avatar_url: string } };
};

export const deleteAvatar = async () => {
    const response = await api.delete('/profile/avatar');
    return response.data as { success: boolean; message: string };
};
