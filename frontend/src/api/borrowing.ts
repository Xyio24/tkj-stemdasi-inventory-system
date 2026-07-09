import api from '@/lib/axios';

// Types
export interface BorrowingItemPayload {
    item_id: number;
    quantity: number;
}

export interface CreateBorrowingPayload {
    purpose: string;
    borrow_date: string;
    expected_return_date: string;
    notes?: string;
    items: BorrowingItemPayload[];
}

export interface BorrowingItemDetail {
    id: number;
    name: string;
    slug: string;
    brand?: string;
    model?: string;
    image?: string;
    quantity: number;
    returned_quantity: number;
    item_condition_out?: string;
    item_condition_in?: string;
    borrowing_item_id: number;
    notes?: string;
}

export interface BorrowingPhoto {
    id: number;
    type: 'borrow' | 'return';
    path: string;
    url?: string;
    original_name?: string;
    uploaded_at: string;
    created_at: string;
}

export interface BorrowingUser {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

export interface Borrowing {
    id: number;
    code: string;
    status: string;
    purpose?: string;
    notes?: string;
    borrow_date: string;
    expected_return_date: string;
    approved_at?: string;
    rejected_at?: string;
    rejection_reason?: string;
    returned_at?: string;
    return_approved_at?: string;
    return_notes?: string;
    created_at: string;
    updated_at: string;
    user?: BorrowingUser;
    approved_by?: { id: number; name: string; role: string };
    return_approved_by?: { id: number; name: string; role: string };
    items?: BorrowingItemDetail[];
    photos?: BorrowingPhoto[];
}

export interface ApproveReturnItemPayload {
    borrowing_item_id: number;
    returned_quantity: number;
    item_condition_in: string;
}

// --- API calls ---

export const getBorrowings = async (params?: { page?: number; per_page?: number; status?: string; search?: string }) => {
    const response = await api.get('/borrowings', { params });
    return response.data;
};

export const getBorrowingById = async (id: number) => {
    const response = await api.get<{ success: boolean; data: Borrowing }>(`/borrowings/${id}`);
    return response.data;
};

export const createBorrowing = async (data: CreateBorrowingPayload) => {
    const response = await api.post('/borrowings', data);
    return response.data;
};

export const cancelBorrowing = async (id: number) => {
    const response = await api.patch(`/borrowings/${id}/cancel`);
    return response.data;
};

export const uploadBorrowingPhoto = async (id: number, data: FormData) => {
    const response = await api.post(`/borrowings/${id}/photos`, data, {
        headers: { 'Content-Type': undefined },
    });
    return response.data;
};

// Admin actions
export const approveBorrowing = async (id: number, notes?: string) => {
    const response = await api.patch(`/admin/borrowings/${id}/approve`, { notes });
    return response.data;
};

export const rejectBorrowing = async (id: number, rejection_reason: string) => {
    const response = await api.patch(`/admin/borrowings/${id}/reject`, { rejection_reason });
    return response.data;
};

export const approveReturn = async (id: number, data: { return_notes?: string; items: ApproveReturnItemPayload[] }) => {
    const response = await api.patch(`/admin/borrowings/${id}/approve-return`, data);
    return response.data;
};

export const deleteBorrowing = async (id: number) => {
    const response = await api.delete(`/borrowings/${id}`);
    return response.data;
};
