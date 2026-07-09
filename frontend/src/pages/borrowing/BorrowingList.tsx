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
            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Peminjaman Barang</h2>
                {user?.role === 'siswa' && (
                    <Link
                        to="/dashboard/borrowings/create"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                    >
                        + Buat Peminjaman
                    </Link>
                )}
            </div>

            <div className="flex gap-4 flex-wrap">
                <input
                    type="text"
                    placeholder="Cari kode atau keperluan..."
                    className="border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 flex-1 min-w-[200px] dark:bg-neutral-800"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <select
                    className="border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
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

            <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-sm">
                                <th className="p-4 font-semibold">Kode</th>
                                {user?.role !== 'siswa' && <th className="p-4 font-semibold">Peminjam</th>}
                                <th className="p-4 font-semibold">Tanggal Pinjam</th>
                                <th className="p-4 font-semibold">Tenggat Waktu</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-500">Loading...</td>
                                </tr>
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-500">Belum ada data peminjaman.</td>
                                </tr>
                            ) : (
                                data?.data?.map((borrowing: Borrowing) => (
                                    <tr key={borrowing.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-indigo-600 dark:text-indigo-400">{borrowing.code}</div>
                                            <div className="text-xs text-neutral-500 truncate max-w-[200px]" title={borrowing.purpose}>{borrowing.purpose}</div>
                                        </td>
                                        {user?.role !== 'siswa' && (
                                            <td className="p-4">
                                                <div className="font-medium">{borrowing.user?.name}</div>
                                                <div className="text-xs text-neutral-500">{borrowing.user?.email}</div>
                                            </td>
                                        )}
                                        <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                                            {new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="p-4 text-sm text-neutral-600 dark:text-neutral-400">
                                            {new Date(borrowing.expected_return_date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(borrowing.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link 
                                                    to={`/dashboard/borrowings/${borrowing.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                >
                                                    Detail
                                                </Link>
                                                {isAdmin && TERMINAL_STATUSES.includes(borrowing.status) && (
                                                    <button
                                                        onClick={() => handleDelete(borrowing)}
                                                        disabled={deleteMutation.isPending}
                                                        className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-40 transition-colors"
                                                        title="Hapus data peminjaman"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Hapus
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
                    <div className="flex justify-between items-center px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            onClick={() => setPage((old) => Math.max(old - 1, 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-neutral-600">Page {data.meta.current_page} of {data.meta.last_page}</span>
                        <button
                            onClick={() => setPage((old) => (old < data.meta.last_page ? old + 1 : old))}
                            disabled={page === data.meta.last_page}
                            className="px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white hover:bg-neutral-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
