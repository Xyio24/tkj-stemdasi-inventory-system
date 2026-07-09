import api from '@/lib/axios';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

export interface ItemImage {
    id: number;
    item_id: number;
    path: string;
    order: number;
}

export interface Item {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description?: string;
    brand?: string;
    model?: string;
    stock: number;
    stock_total: number;
    stock_minimum: number;
    condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
    location?: string;
    is_available: boolean;
    image?: string;
    category?: Category;
    images?: ItemImage[];
}

// Categories
export const getCategories = async () => {
    const response = await api.get<{ success: boolean; data: Category[] }>('/categories');
    return response.data;
};

export const createCategory = async (data: { name: string; description?: string }) => {
    const response = await api.post('/categories', data);
    return response.data;
};

export const updateCategory = async (id: number, data: { name: string; description?: string }) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
};

// Items
export const getItems = async (params?: { page?: number; search?: string; category_id?: number; condition?: string; per_page?: number }) => {
    const response = await api.get('/items', { params });
    return response.data;
};

export const getItem = async (id: number) => {
    const response = await api.get<{ success: boolean; data: Item }>(`/items/${id}`);
    return response.data;
};

export const createItem = async (data: FormData) => {
    const response = await api.post('/items', data, {
        headers: { 'Content-Type': undefined },
    });
    return response.data;
};

export const updateItem = async (id: number, data: FormData) => {
    data.append('_method', 'PUT');
    const response = await api.post(`/items/${id}`, data, {
        headers: { 'Content-Type': undefined },
    });
    return response.data;
};

export const deleteItem = async (id: number) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
};

export const deleteItemImage = async (itemId: number, imageId: number) => {
    const response = await api.delete(`/items/${itemId}/images/${imageId}`);
    return response.data;
};
