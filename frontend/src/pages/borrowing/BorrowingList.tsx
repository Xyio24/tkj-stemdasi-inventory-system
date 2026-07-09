import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBorrowings, deleteBorrowing } from '@/api/borrowing';
import type { Borrowing } from '@/api/borrowing';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export default function BorrowingList() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const isAdmin = user?.role === 'admin';
    const TERMINAL_STATUSES = ['returned', 'rejected', 'cancelled'];

    const { data, isLoading } = useQuery({
        queryKey: ['borrowings', page, status, search],
        queryFn: () => getBorrowings({ 
            page, 
            status: status || undefined,
            search: search || undefined
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteBorrowing,
        onSuccess: () => {
            toast.success('Data peminjaman berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['borrowings'] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err.response?.data?.message || 'Gagal menghapus data peminjaman'),
    });

    function handleDelete(borrowing: Borrowing) {
        if (confirm(`Hapus data peminjaman "${borrowing.code}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
            deleteMutation.mutate(borrowing.id);
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            rejected: 'bg-red-100 text-red-800',
            borrowing: 'bg-indigo-100 text-indigo-800',
            returning: 'bg-purple-100 text-purple-800',
            returned: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-neutral-100 text-neutral-800',
        };
        const labels: Record<string, string> = {
            pending: 'Menunggu Persetujuan',
            approved: 'Disetujui',
            rejected: 'Ditolak',
            borrowing: 'Sedang Dipinjam',
            returning: 'Proses Pengembalian',
            returned: 'Dikembalikan',
            overdue: 'Terlambat',
            cancelled: 'Dibatalkan',
        };
        return (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Peminjaman Barang</h1>
                {user?.role === 'siswa' && (
                    <Link
                        to="/dashboard/borrowings/create"
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 font-semibold text-sm active:scale-[0.97] transition-all duration-200 shadow-sm"
                    >
                        + Buat Peminjaman
                    </Link>
                )}
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
                <input
                    type="text"
                    placeholder="Cari kode atau keperluan..."
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50 flex-1 min-w-[200px]"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <select
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50 min-w-[200px]"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">Semua Status</option>
                    <option value="pending">Menunggu Persetujuan</option>
                    <option value="approved">Disetujui</option>
                    <option value="borrowing">Sedang Dipinjam</option>
                    <option value="returning">Proses Pengembalian</option>
                    <option value="returned">Selesai / Dikembalikan</option>
                    <option value="rejected">Ditolak</option>
                    <option value="cancelled">Dibatalkan</option>
                </select>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left">Kode</th>
                                {user?.role !== 'siswa' && <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left">Peminjam</th>}
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left">Tanggal Pinjam</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left">Tenggat Waktu</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-sm">
                                        <div className="py-20 text-center text-neutral-400">Memuat data...</div>
                                    </td>
                                </tr>
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-sm">
                                        <div className="py-20 text-center">
                                            <p className="text-neutral-400 text-sm">Belum ada data peminjaman.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((borrowing: Borrowing) => (
                                    <tr key={borrowing.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-semibold text-indigo-600">{borrowing.code}</div>
                                            <div className="text-xs text-neutral-400 truncate max-w-[200px] mt-0.5" title={borrowing.purpose}>{borrowing.purpose}</div>
                                        </td>
                                        {user?.role !== 'siswa' && (
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-medium text-neutral-900">{borrowing.user?.name}</div>
                                                <div className="text-xs text-neutral-400 mt-0.5">{borrowing.user?.email}</div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {new Date(borrowing.expected_return_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {getStatusBadge(borrowing.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    to={`/dashboard/borrowings/${borrowing.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-all duration-150 active:scale-[0.95]"
                                                >
                                                    Detail
                                                </Link>
                                                {isAdmin && TERMINAL_STATUSES.includes(borrowing.status) && (
                                                    <button
                                                        onClick={() => handleDelete(borrowing)}
                                                        disabled={deleteMutation.isPending}
                                                        className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-red-600 transition-all duration-150 active:scale-[0.95] disabled:opacity-40"
                                                        title="Hapus data peminjaman"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {data && data.meta?.last_page > 1 && (
                    <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-100">
                        <button
                            onClick={() => setPage((old) => Math.max(old - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 transition-all duration-150 active:scale-[0.97]"
                        >
                            ← Sebelumnya
                        </button>
                        <span className="text-sm text-neutral-500">Halaman {data.meta.current_page} dari {data.meta.last_page}</span>
                        <button
                            onClick={() => setPage((old) => (old < data.meta.last_page ? old + 1 : old))}
                            disabled={page === data.meta.last_page}
                            className="px-4 py-2 text-sm font-medium rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 transition-all duration-150 active:scale-[0.97]"
                        >
                            Berikutnya →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
