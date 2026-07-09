import api from '@/lib/axios';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    is_active: boolean;
    nis_nip?: string;
    phone?: string;
    student_class?: {
        id: number;
        name: string;
        academic_year_id: number;
        academic_year?: { id: number; name: string; is_active: boolean };
    };
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

export const getUsers = async (params?: { page?: number; search?: string; role?: string }) => {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
};

export const updateUser = async (id: number, data: { role?: string; nis_nip?: string; phone?: string; class_id?: number | null }) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
};

export const toggleUserStatus = async (id: number) => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
};

export const deleteUser = async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};
