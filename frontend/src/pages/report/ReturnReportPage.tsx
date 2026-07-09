import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, RefreshCw, Filter, Search } from 'lucide-react';
import {
    getReturnReport,
    exportReturnReport,
    type ReturnReportItem,
    type ReturnReportParams,
} from '@/api/report';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100 text-green-800',
    rusak_ringan: 'bg-yellow-100 text-yellow-800',
    rusak_berat:  'bg-red-100 text-red-800',
};

function formatDate(d?: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d?: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="space-y-3 px-1 py-2">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            ))}
        </div>
    );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function ReportRow({ row, index }: { row: ReturnReportItem; index: number }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <tr
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <td className="px-4 py-3 text-sm text-neutral-500 text-center">{index}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                    {row.code}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                    <div>{row.user?.name ?? '-'}</div>
                    {row.user?.nis_nip && (
                        <div className="text-xs text-neutral-400">{row.user.nis_nip}</div>
                    )}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(row.borrow_date)}</td>
                <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(row.expected_return_date)}</td>
                <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                    {formatDateTime(row.return_approved_at)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">{row.return_approved_by ?? '-'}</td>
            </tr>
            {open && (
                <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                    <td colSpan={7} className="px-8 pb-4 pt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Detail Barang Dikembalikan</p>
                                <div className="space-y-1.5">
                                    {row.items.map((item, i) => {
                                        const badgeCls = CONDITION_BADGE[item.condition_in] ?? 'bg-neutral-100 text-neutral-600';
                                        return (
                                            <div key={i} className="flex items-center justify-between">
                                                <span>{item.name} × {item.returned_quantity}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
                                                    {item.condition_label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {row.return_notes && (
                                <div>
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Catatan Pengembalian</p>
                                    <p>{row.return_notes}</p>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReturnReportPage() {
    const [filters, setFilters] = useState<ReturnReportParams>({ per_page: 15, page: 1 });
    const [draft, setDraft] = useState({ date_from: '', date_to: '' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['report-returns', filters],
        queryFn: () => getReturnReport(filters),
    });

    function applyFilters() {
        setFilters(prev => ({
            ...prev,
            page: 1,
            date_from: draft.date_from || undefined,
            date_to: draft.date_to || undefined,
        }));
    }

    function resetFilters() {
        setDraft({ date_from: '', date_to: '' });
        setFilters({ per_page: 15, page: 1 });
    }

    function handleExport() {
        exportReturnReport({
            date_from: filters.date_from,
            date_to: filters.date_to,
        });
    }

    const rows = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Laporan Pengembalian</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Riwayat seluruh barang yang telah dikembalikan</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                        <label className="block text-xs text-neutral-500 mb-1">Dari Tanggal Kembali</label>
                        <input
                            type="date"
                            value={draft.date_from}
                            onChange={e => setDraft(p => ({ ...p, date_from: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Sampai Tanggal Kembali</label>
                        <input
                            type="date"
                            value={draft.date_to}
                            onChange={e => setDraft(p => ({ ...p, date_to: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-2 flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                        Total: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{meta.total}</span> pengembalian
                    </div>
                )}

                {isLoading ? (
                    <div className="p-4"><TableSkeleton /></div>
                ) : isError ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="text-red-500 text-sm">Gagal memuat data laporan.</p>
                        <button
                            onClick={() => refetch()}
                            className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400 text-sm">
                        Tidak ada data pengembalian yang sesuai filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                                    <th className="px-4 py-3 text-center w-10">No</th>
                                    <th className="px-4 py-3 text-left">Kode</th>
                                    <th className="px-4 py-3 text-left">Peminjam</th>
                                    <th className="px-4 py-3 text-left">Tgl Pinjam</th>
                                    <th className="px-4 py-3 text-left">Tgl Rencana Kembali</th>
                                    <th className="px-4 py-3 text-left">Tgl Kembali (Aktual)</th>
                                    <th className="px-4 py-3 text-left">Dikonfirmasi Oleh</th>
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
