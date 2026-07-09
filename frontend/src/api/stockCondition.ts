import api from '@/lib/axios';
import type { Item } from '@/api/inventory';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConditionKey = 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang';

export interface AdjustConditionPayload {
    from_condition: ConditionKey;
    to_condition: ConditionKey;
    quantity: number;
    notes?: string;
}

export interface StockConditionParams {
    page?: number;
    per_page?: number;
    search?: string;
    category_id?: number;
    has_damage?: boolean;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /api/items/stock-conditions
 * Daftar semua barang dengan breakdown stok per kondisi.
 */
export const getStockConditions = async (params?: StockConditionParams) => {
    const response = await api.get<{
        success: boolean;
        data: Item[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    }>('/items/stock-conditions', { params });
    return response.data;
};

/**
 * POST /api/items/{id}/adjust-condition
 * Pindahkan unit dari satu kondisi ke kondisi lain (koreksi stok).
 */
export const adjustItemCondition = async (itemId: number, data: AdjustConditionPayload) => {
    const response = await api.post<{
        success: boolean;
        message: string;
        data: Item;
    }>(`/items/${itemId}/adjust-condition`, data);
    return response.data;
};
