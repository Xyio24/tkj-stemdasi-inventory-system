import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Search, RefreshCw, Filter } from 'lucide-react';
import {
    getBorrowingReport,
    exportBorrowingReport,
    type BorrowingReportItem,
    type BorrowingReportParams,
} from '@/api/report';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'returning', label: 'Pengembalian' },
    { value: 'returned', label: 'Dikembalikan' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_BADGE: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    approved:  'bg-blue-100 text-blue-800',
    rejected:  'bg-red-100 text-red-800',
    returning: 'bg-purple-100 text-purple-800',
    returned:  'bg-green-100 text-green-800',
    cancelled: 'bg-neutral-100 text-neutral-600',
};

function formatDate(d?: string | null): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
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

function ReportRow({ row, index }: { row: BorrowingReportItem; index: number }) {
    const [open, setOpen] = useState(false);
    const badgeCls = STATUS_BADGE[row.status] ?? 'bg-neutral-100 text-neutral-600';

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
                <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeCls}`}>
                        {row.status_label}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-neutral-500">{row.items_count} item</td>
            </tr>
            {open && (
                <tr className="bg-neutral-50 dark:bg-neutral-900/50">
                    <td colSpan={7} className="px-8 pb-4 pt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tujuan Peminjaman</p>
                                <p>{row.purpose}</p>
                            </div>
                            <div>
                                <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Barang Dipinjam</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {row.items.map((item, i) => (
                                        <li key={i}>{item.name} — {item.quantity} pcs</li>
                                    ))}
                                </ul>
                            </div>
                            {row.approved_by && (
                                <div>
                                    <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">Disetujui Oleh</p>
                                    <p>{row.approved_by} · {row.approved_at}</p>
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

export default function BorrowingReportPage() {
    const [filters, setFilters] = useState<BorrowingReportParams>({ per_page: 15, page: 1 });
    const [draft, setDraft] = useState({ date_from: '', date_to: '', status: '' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['report-borrowings', filters],
        queryFn: () => getBorrowingReport(filters),
    });

    function applyFilters() {
        setFilters(prev => ({
            ...prev,
            page: 1,
            date_from: draft.date_from || undefined,
            date_to: draft.date_to || undefined,
            status: draft.status || undefined,
        }));
    }

    function resetFilters() {
        setDraft({ date_from: '', date_to: '', status: '' });
        setFilters({ per_page: 15, page: 1 });
    }

    function handleExport() {
        exportBorrowingReport({
            date_from: filters.date_from,
            date_to: filters.date_to,
            status: filters.status,
        });
    }

    const rows = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold">Laporan Peminjaman</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Riwayat seluruh transaksi peminjaman barang</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                        <label className="block text-xs text-neutral-500 mb-1">Dari Tanggal</label>
                        <input
                            type="date"
                            value={draft.date_from}
                            onChange={e => setDraft(p => ({ ...p, date_from: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={draft.date_to}
                            onChange={e => setDraft(p => ({ ...p, date_to: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-neutral-500 mb-1">Status</label>
                        <select
                            value={draft.status}
                            onChange={e => setDraft(p => ({ ...p, status: e.target.value }))}
                            className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
                        Total: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{meta.total}</span> peminjaman
                    </div>
                )}

                {isLoading ? (
                    <div className="p-4"><TableSkeleton /></div>
                ) : isError ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="text-red-500 text-sm">Gagal memuat data laporan.</p>
                        <button
                            onClick={() => refetch()}
                            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400 text-sm">
                        Tidak ada data peminjaman yang sesuai filter.
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
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-right">Barang</th>
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
