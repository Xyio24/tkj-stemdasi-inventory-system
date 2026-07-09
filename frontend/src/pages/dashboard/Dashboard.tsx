import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '@/api/dashboard';
import { useAuthStore } from '@/store/authStore';
import type { ChartData, RecentBorrowing, RecentActivity } from '@/api/dashboard';
import {
    Package,
    Tag,
    Users,
    ClipboardList,
    Clock,
    AlertTriangle,
    RotateCcw,
    Activity,
    TrendingUp,
    ArrowRight,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Menunggu',      cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved:  { label: 'Disetujui',     cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    rejected:  { label: 'Ditolak',       cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    borrowing: { label: 'Dipinjam',      cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    returning: { label: 'Pengembalian',  cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    returned:  { label: 'Dikembalikan',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    overdue:   { label: 'Terlambat',     cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Dibatalkan',    cls: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
};

function formatDate(iso?: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
}

// ─── StatCard ────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    note?: string;
}

function StatCard({ label, value, icon, colorClass, note }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 flex items-start gap-4 shadow-sm">
            <div className={`flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
                <p className="text-2xl font-bold mt-0.5">{value.toLocaleString('id-ID')}</p>
                {note && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{note}</p>}
            </div>
        </div>
    );
}

// ─── BarChart (pure CSS/SVG, no recharts) ────────────────────────────────────

function BorrowingsChart({ data }: { data: ChartData[] }) {
    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm">Peminjaman 7 Hari Terakhir</h3>
            </div>

            {data.every(d => d.count === 0) ? (
                <div className="h-32 flex items-center justify-center text-sm text-neutral-400">
                    Belum ada peminjaman dalam 7 hari terakhir.
                </div>
            ) : (
                <div className="flex items-end gap-2 h-36" aria-label="Grafik peminjaman 7 hari terakhir">
                    {data.map(d => {
                        const heightPct = max > 0 ? (d.count / max) * 100 : 0;
                        const label = new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' });
                        return (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-xs text-neutral-500">{d.count > 0 ? d.count : ''}</span>
                                <div className="w-full flex items-end" style={{ height: '96px' }}>
                                    <div
                                        className="w-full rounded-t-md bg-indigo-500 dark:bg-indigo-600 transition-all duration-500"
                                        style={{ height: `${heightPct}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                                        title={`${d.date}: ${d.count} peminjaman`}
                                    />
                                </div>
                                <span className="text-[10px] text-neutral-400 leading-none">{label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── RecentBorrowingsTable ────────────────────────────────────────────────────

function RecentBorrowingsTable({ data }: { data: RecentBorrowing[] }) {
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm">Peminjaman Terbaru</h3>
                </div>
                <button
                    onClick={() => navigate('/dashboard/borrowings')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                    Lihat semua <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {data.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-400">Belum ada data peminjaman.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400">
                                <th className="text-left px-5 py-3 font-medium">Kode</th>
                                <th className="text-left px-5 py-3 font-medium">Peminjam</th>
                                <th className="text-left px-5 py-3 font-medium">Tgl Pinjam</th>
                                <th className="text-left px-5 py-3 font-medium">Status</th>
                                <th className="text-right px-5 py-3 font-medium">Barang</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {data.map(b => {
                                const status = STATUS_MAP[b.status] ?? { label: b.status, cls: '' };
                                return (
                                    <tr
                                        key={b.id}
                                        onClick={() => navigate(`/dashboard/borrowings/${b.id}`)}
                                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3 font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            {b.code}
                                        </td>
                                        <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">
                                            {b.user?.name ?? '-'}
                                        </td>
                                        <td className="px-5 py-3 text-neutral-500">
                                            {formatDate(b.borrow_date)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-neutral-500">
                                            {b.items_count} item
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

function ActivityFeed({ data }: { data: RecentActivity[] }) {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm">Aktivitas Terbaru</h3>
            </div>

            {data.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-400">Belum ada aktivitas.</div>
            ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.map((log, idx) => (
                        <li key={idx} className="px-5 py-3 flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                            <div className="min-w-0">
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug">{log.description}</p>
                                <p className="text-xs text-neutral-400 mt-0.5">
                                    {log.user?.name ?? 'Sistem'} · {formatRelativeTime(log.created_at)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg ${className}`} />;
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-24" />
                ))}
            </div>
            <SkeletonBlock className="h-48" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><SkeletonBlock className="h-64" /></div>
                <SkeletonBlock className="h-64" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const user = useAuthStore(state => state.user);
    const isGuruOrAdmin = user?.role === 'guru' || user?.role === 'admin';

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: getDashboard,
        enabled: isGuruOrAdmin,
        staleTime: 60_000,
    });

    // Siswa: simple welcome view (dashboard data is guru/admin only)
    if (!isGuruOrAdmin) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
                <h2 className="text-2xl font-semibold mb-2">Selamat Datang, {user?.name}!</h2>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Gunakan menu <strong>Peminjaman</strong> untuk mengajukan peminjaman barang inventaris TKJ.
                </p>
            </div>
        );
    }

    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm text-center space-y-3">
                <p className="text-red-500 font-medium">Gagal memuat data dashboard.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { stats, recent_borrowings, recent_activity, borrowings_chart } = data;

    const statCards: StatCardProps[] = [
        {
            label: 'Total Barang',
            value: stats.total_items,
            icon: <Package className="w-5 h-5 text-blue-600" />,
            colorClass: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'Kategori',
            value: stats.total_categories,
            icon: <Tag className="w-5 h-5 text-violet-600" />,
            colorClass: 'bg-violet-100 dark:bg-violet-900/30',
        },
        {
            label: 'Total User',
            value: stats.total_users,
            icon: <Users className="w-5 h-5 text-cyan-600" />,
            colorClass: 'bg-cyan-100 dark:bg-cyan-900/30',
        },
        {
            label: 'Sedang Dipinjam',
            value: stats.active_borrowings,
            icon: <ClipboardList className="w-5 h-5 text-indigo-600" />,
            colorClass: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            label: 'Pending Approval',
            value: stats.pending_approvals,
            icon: <Clock className="w-5 h-5 text-yellow-600" />,
            colorClass: 'bg-yellow-100 dark:bg-yellow-900/30',
            note: 'Menunggu disetujui',
        },
        {
            label: 'Proses Kembali',
            value: stats.returning_count,
            icon: <RotateCcw className="w-5 h-5 text-purple-600" />,
            colorClass: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            label: 'Stok Menipis',
            value: stats.items_low_stock,
            icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
            colorClass: 'bg-red-100 dark:bg-red-900/30',
            note: 'Di bawah stok minimum',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Ringkasan sistem inventaris & peminjaman TKJ
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {statCards.map(card => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            {/* Chart */}
            <BorrowingsChart data={borrowings_chart} />

            {/* Recent Borrowings + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentBorrowingsTable data={recent_borrowings} />
                </div>
                <ActivityFeed data={recent_activity} />
            </div>
        </div>
    );
}
