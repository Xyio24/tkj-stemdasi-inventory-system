import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'siswa' | 'guru' | 'admin';
    avatar: string | null;
    avatar_type: 'generated' | 'upload';
    google_id: string | null;
    status: 'pending' | 'active' | 'blocked';
    is_active: boolean;
    absen_number: number | null;
    nis_nip: string | null;
    phone: string | null;
    class_id: number | null;
    approved_at: string | null;
    registration_notes: string | null;
    created_at: string;
    updated_at: string;
    student_class: {
        id: number;
        name: string;
        academic_year_id: number;
        academic_year?: { id: number; name: string; is_active: boolean };
    } | null;
}

export interface UserListResponse {
    success: boolean;
    data: User[];
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getUsers = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    status?: 'pending' | 'active' | 'blocked';
}) => {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateUser = async (
    id: number,
    data: {
        role?: string;
        nis_nip?: string | null;
        phone?: string | null;
        class_id?: number | null;
        absen_number?: number | null;
    }
) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
};

// ─── Approval ─────────────────────────────────────────────────────────────────

export const approveUser = async (id: number) => {
    const response = await api.patch(`/users/${id}/approve`);
    return response.data as { success: boolean; message: string };
};

export const rejectUser = async (id: number, rejectionReason: string) => {
    const response = await api.patch(`/users/${id}/reject`, {
        rejection_reason: rejectionReason,
    });
    return response.data as { success: boolean; message: string };
};

// ─── Block / Unblock ──────────────────────────────────────────────────────────

export const blockUser = async (id: number) => {
    const response = await api.patch(`/users/${id}/block`);
    return response.data as { success: boolean; message: string };
};

export const unblockUser = async (id: number) => {
    const response = await api.patch(`/users/${id}/unblock`);
    return response.data as { success: boolean; message: string };
};

// ─── Deprecated ───────────────────────────────────────────────────────────────

/** @deprecated Gunakan blockUser / unblockUser */
export const toggleUserStatus = async (id: number) => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
};

export const deleteUser = async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetUserPassword = async (id: number) => {
    const response = await api.post<{
        success: boolean;
        message: string;
        new_password: string;
    }>(`/users/${id}/reset-password`);
    return response.data;
};

// ─── Delete Pending ───────────────────────────────────────────────────────────

export const deletePendingUser = async (id: number) => {
    const response = await api.delete<{
        success: boolean;
        message: string;
    }>(`/users/${id}/delete-pending`);
    return response.data;
};
