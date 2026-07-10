import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBorrowings, deleteBorrowing } from '@/api/borrowing';
import type { Borrowing } from '@/api/borrowing';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
    ClipboardList, Plus, Search, Trash2,
    ChevronLeft, ChevronRight, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
    pending:   { label: 'Menunggu',      badge: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
    approved:  { label: 'Disetujui',     badge: 'bg-blue-100/80   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400'   },
    rejected:  { label: 'Ditolak',       badge: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
    borrowing: { label: 'Dipinjam',      badge: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    returning: { label: 'Pengembalian',  badge: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    returned:  { label: 'Dikembalikan',  badge: 'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
    overdue:   { label: 'Terlambat',     badge: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
    cancelled: { label: 'Dibatalkan',    badge: 'bg-neutral-100   text-neutral-500 dark:bg-neutral-800  dark:text-neutral-400' },
};

// status filter tabs — urutan sesuai alur
const STATUS_TABS = [
    { value: '',          label: 'Semua'       },
    { value: 'pending',   label: 'Menunggu'    },
    { value: 'approved',  label: 'Disetujui'   },
    { value: 'borrowing', label: 'Dipinjam'    },
    { value: 'returning', label: 'Pengembalian'},
    { value: 'returned',  label: 'Selesai'     },
    { value: 'overdue',   label: 'Terlambat'   },
    { value: 'rejected',  label: 'Ditolak'     },
    { value: 'cancelled', label: 'Dibatalkan'  },
];

const TERMINAL = ['returned', 'rejected', 'cancelled'];

function formatDate(iso?: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
    return (
        <tr className="border-b border-border/30">
            {[1,2,3,4,5,6].map(i => (
                <td key={i} className="px-5 py-4">
                    <div className="skeleton h-4 rounded-full" style={{ width: `${50 + i * 10}%` }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BorrowingList() {
    const [page,   setPage]   = useState(1);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    const user        = useAuthStore(s => s.user);
    const queryClient = useQueryClient();
    const navigate    = useNavigate();

    const isSiswa = user?.role === 'siswa';
    const isAdmin = user?.role === 'admin';

    const { data, isLoading } = useQuery({
        queryKey: ['borrowings', page, status, search],
        queryFn: () => getBorrowings({ page, status: status || undefined, search: search || undefined }),
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

    function handleDelete(b: Borrowing) {
        if (confirm(`Hapus data peminjaman "${b.code}"?\nTindakan ini tidak dapat dibatalkan.`)) {
            deleteMutation.mutate(b.id);
        }
    }

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Peminjaman Barang</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {isSiswa ? 'Riwayat dan status peminjaman kamu' : 'Kelola seluruh transaksi peminjaman'}
                    </p>
                </div>
                {isSiswa && (
                    <Link
                        to="/dashboard/borrowings/create"
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-[0_1px_3px_oklch(0_0_0/0.15)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.95] transition-all duration-200 ease-spring flex-shrink-0 animate-fade-up delay-75"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Peminjaman
                    </Link>
                )}
            </div>

            {/* ── Status Filter Tabs (scrollable) ── */}
            <div className="animate-fade-up delay-75 overflow-x-auto pb-1">
                <div className="flex gap-1.5 w-max">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => { setStatus(tab.value); setPage(1); }}
                            className={[
                                'px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-spring',
                                status === tab.value
                                    ? 'bg-primary text-primary-foreground shadow-glow-blue-sm scale-[1.02]'
                                    : 'bg-accent/60 text-muted-foreground hover:bg-accent hover:text-foreground',
                            ].join(' ')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Search bar ── */}
            <div className="glass-card px-5 py-3.5 animate-fade-up delay-100">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Cari kode atau keperluan..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="input-ios pl-10"
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-150">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Kode / Keperluan</th>
                                {!isSiswa && (
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden sm:table-cell">Peminjam</th>
                                )}
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden md:table-cell">Tgl Pinjam</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden md:table-cell">Tenggat</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Status</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={isSiswa ? 5 : 6} className="px-5 py-20">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-spring-in">
                                            <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center">
                                                <ClipboardList className="w-7 h-7 opacity-40" />
                                            </div>
                                            <p className="text-sm">
                                                {status
                                                    ? `Tidak ada peminjaman dengan status "${STATUS_CONFIG[status]?.label ?? status}".`
                                                    : 'Belum ada data peminjaman.'}
                                            </p>
                                            {isSiswa && !status && (
                                                <Link
                                                    to="/dashboard/borrowings/create"
                                                    className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:gap-2 transition-all duration-150"
                                                >
                                                    Buat peminjaman pertama <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((b: Borrowing, i: number) => {
                                    const st = STATUS_CONFIG[b.status] ?? { label: b.status, badge: '' };
                                    return (
                                        <tr
                                            key={b.id}
                                            className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 cursor-pointer group animate-fade-up"
                                            style={{ animationDelay: `${i * 25}ms` }}
                                            onClick={() => navigate(`/dashboard/borrowings/${b.id}`)}
                                        >
                                            {/* Code / Purpose */}
                                            <td className="px-5 py-3.5">
                                                <div className="font-mono text-xs font-semibold text-primary">{b.code}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                                                    {b.purpose}
                                                </div>
                                            </td>

                                            {/* Peminjam */}
                                            {!isSiswa && (
                                                <td className="px-5 py-3.5 hidden sm:table-cell">
                                                    <div className="font-medium text-foreground text-sm">{b.user?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{b.user?.email}</div>
                                                </td>
                                            )}

                                            {/* Dates */}
                                            <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
                                                {formatDate(b.borrow_date)}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">
                                                {formatDate(b.expected_return_date)}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5">
                                                <span className={['badge-pill text-[10px]', st.badge].join(' ')}>
                                                    {st.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        to={`/dashboard/borrowings/${b.id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/8 dark:bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/15 transition-all duration-150 active:scale-[0.95] opacity-0 group-hover:opacity-100"
                                                    >
                                                        Detail <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                    {isAdmin && TERMINAL.includes(b.status) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => handleDelete(b)}
                                                            disabled={deleteMutation.isPending}
                                                            className="text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15 opacity-0 group-hover:opacity-100 transition-all duration-150"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data?.meta && data.meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                            Hal. <span className="font-semibold text-foreground">{data.meta.current_page}</span> dari{' '}
                            <span className="font-semibold text-foreground">{data.meta.last_page}</span>
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon-sm" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon-sm" onClick={() => setPage(p => p < data.meta.last_page ? p + 1 : p)} disabled={page === data.meta.last_page}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
