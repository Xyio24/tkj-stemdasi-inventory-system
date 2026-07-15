import api from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BorrowingReportItem {
    id: number;
    code: string;
    user: { id: number; name: string; nis_nip?: string } | null;
    status: string;
    status_label: string;
    purpose: string;
    borrow_date: string;
    expected_return_date: string;
    items_count: number;
    items: { name: string; quantity: number }[];
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
}

export interface ReturnReportItem {
    id: number;
    code: string;
    user: { id: number; name: string; nis_nip?: string } | null;
    borrow_date: string;
    expected_return_date: string;
    return_approved_at: string | null;
    return_approved_by: string | null;
    return_notes: string | null;
    items: {
        name: string;
        quantity: number;
        returned_quantity: number;
        condition_in: string;
        condition_label: string;
    }[];
    created_at: string;
}

export interface InventoryReportItem {
    id: number;
    name: string;
    category: { id: number; name: string } | null;
    brand: string | null;
    model: string | null;
    stock: number;
    stock_total: number;
    stock_minimum: number;
    condition: string;
    condition_label: string;
    location: string | null;
    is_available: boolean;
    created_at: string;
}

export interface ReportMeta {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}

export interface BorrowingReportParams {
    date_from?: string;
    date_to?: string;
    status?: string;
    per_page?: number;
    page?: number;
}

export interface ReturnReportParams {
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
}

export interface InventoryReportParams {
    category_id?: number;
    condition?: string;
    per_page?: number;
    page?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getBorrowingReport(params?: BorrowingReportParams): Promise<{
    success: boolean;
    data: BorrowingReportItem[];
    meta: ReportMeta;
}> {
    const res = await api.get('/reports/borrowings', { params });
    return res.data;
}

export async function getReturnReport(params?: ReturnReportParams): Promise<{
    success: boolean;
    data: ReturnReportItem[];
    meta: ReportMeta;
}> {
    const res = await api.get('/reports/returns', { params });
    return res.data;
}

export async function getInventoryReport(params?: InventoryReportParams): Promise<{
    success: boolean;
    data: InventoryReportItem[];
    categories: { id: number; name: string }[];
    meta: ReportMeta;
}> {
    const res = await api.get('/reports/inventory', { params });
    return res.data;
}

// ─── Export helpers (download file) ──────────────────────────────────────────

/**
 * Download file via axios (dengan Authorization header) lalu trigger browser download.
 * Lebih aman dari URL-based download karena token tidak terekspos di URL.
 */
async function triggerDownload(
    path: string,
    params: Record<string, string | number | undefined>,
    filename: string,
): Promise<void> {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
            cleanParams[key] = String(val);
        }
    });

    const res = await api.get(path, {
        params: cleanParams,
        responseType: 'blob',
    });

    const blob = new Blob([res.data], {
        type: res.headers['content-type'] ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportBorrowingReport(params?: Omit<BorrowingReportParams, 'per_page' | 'page'>): Promise<void> {
    return triggerDownload(
        '/reports/borrowings/export',
        params as Record<string, string | number | undefined>,
        `laporan-peminjaman-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
}

export function exportReturnReport(params?: Omit<ReturnReportParams, 'per_page' | 'page'>): Promise<void> {
    return triggerDownload(
        '/reports/returns/export',
        params as Record<string, string | number | undefined>,
        `laporan-pengembalian-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
}

export function exportInventoryReport(params?: Omit<InventoryReportParams, 'per_page' | 'page'>): Promise<void> {
    return triggerDownload(
        '/reports/inventory/export',
        params as Record<string, string | number | undefined>,
        `laporan-inventaris-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
}
