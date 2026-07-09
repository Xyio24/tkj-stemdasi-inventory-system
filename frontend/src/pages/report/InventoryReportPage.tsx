import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, RefreshCw, Filter, Search, Package } from 'lucide-react';
import {
    getInventoryReport,
    exportInventoryReport,
    type InventoryReportItem,
    type InventoryReportParams,
} from '@/api/report';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS = [
    { value: '', label: 'Semua Kondisi' },
    { value: 'baik', label: 'Baik' },
    { value: 'rusak_ringan', label: 'Rusak Ringan' },
    { value: 'rusak_berat', label: 'Rusak Berat' },
];

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100 text-green-800',
    rusak_ringan: 'bg-yellow-100 text-yellow-800',
    rusak_berat:  'bg-red-100 text-red-800',
};

function StockBar({ stock, total }: { stock: number; total: number }) {
    const pct = total > 0 ? Math.round((stock / total) * 100) : 0;
    const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-neutral-500 whitespace-nowrap">{stock}/{total}</span>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3 px-1 py-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
        </div>
    );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function ReportRow({ row, index }: { row: InventoryReportItem; index: number }) {
    const conditionBadge = CONDITION_BADGE[row.condition] ?? 'bg-neutral-100 text-neutral-600';
    const isLowStock = row.stock <= row.stock_minimum;

    return (
        <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
            <td className="px-4 py-3 text-sm text-neutral-500 text-center">{index}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{row.name}</div>
                        {(row.brand || row.model) && (
                            <div className="text-xs text-neutral-400">
                                {[row.brand, row.model].filter(Boolean).join(' · ')}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-500">{row.category?.name ?? '-'}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <StockBar stock={row.stock} total={row.stock_total} />
                    {isLowStock && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap">
                            Menipis
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${conditionBadge}`}>
                    {row.condition_label}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-500">{row.location ?? '-'}</td>
            <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.is_available ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-500'}`}>
                    {row.is_available ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
        </tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryReportPage() {
    const [filters, setFilters] = useState<InventoryReportParams>({ per_page: 15, page: 1 });
    const [draft, setDraft] = useState({ category_id: '', condition: '' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['report-inventory', filters],
        queryFn: () => getInventoryReport(filters),
    });

    function applyFilters() {
        setFilters(prev => ({
            ...prev,
            page: 1,
            category_id: draft.category_id ? Number(draft.category_id) : undefined,
            condition: draft.condition || undefined,
        }));
    }

    function resetFilters() {
        setDraft({ category_id: '', condition: '' });
        setFilters({ per_page: 15, page: 1 });
    }

    function handleExport() {
        exportInventoryReport({
            category_id: draft.category_id ? Number(draft.category_id) : undefined,
            condition: draft.condition || undefined,
        });
    }

    const rows = data?.data ?? [];
    const meta = data?.meta;
    const categories = data?.categories ?? [];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Laporan Inventaris</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Daftar seluruh barang inventaris beserta kondisi stok</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                >
                    <FileDown className="w-4 h-4" />
                    Export Excel
                </button>
            </div>

            {/* Filter Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Filter</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Kategori</label>
                        <select
                            value={draft.category_id}
                            onChange={e => setDraft(p => ({ ...p, category_id: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Kondisi</label>
                        <select
                            value={draft.condition}
                            onChange={e => setDraft(p => ({ ...p, condition: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            {CONDITION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="sm:col-span-2 flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Terapkan
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-3 py-2 text-sm text-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            title="Reset filter"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                {meta && (
                    <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
                        Total: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{meta.total}</span> barang
                    </div>
                )}

                {isLoading ? (
                    <div className="p-4"><TableSkeleton /></div>
                ) : isError ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="text-red-500 text-sm">Gagal memuat data laporan.</p>
                        <button
                            onClick={() => refetch()}
                            className="text-sm px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400 text-sm">
                        Tidak ada barang yang sesuai filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                                    <th className="px-4 py-3 text-center w-10">No</th>
                                    <th className="px-4 py-3 text-left">Nama Barang</th>
                                    <th className="px-4 py-3 text-left">Kategori</th>
                                    <th className="px-4 py-3 text-left">Stok</th>
                                    <th className="px-4 py-3 text-left">Kondisi</th>
                                    <th className="px-4 py-3 text-left">Lokasi</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {rows.map((row, idx) => (
                                    <ReportRow
                                        key={row.id}
                                        row={row}
                                        index={(meta ? (meta.current_page - 1) * meta.per_page : 0) + idx + 1}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">
                            Halaman {meta.current_page} dari {meta.last_page}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) - 1 }))}
                                disabled={meta.current_page === 1}
                                className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) + 1 }))}
                                disabled={meta.current_page === meta.last_page}
                                className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
