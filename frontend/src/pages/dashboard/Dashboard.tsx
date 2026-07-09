import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{value.toLocaleString('id-ID')}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
            {note && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{note}</p>}
        </div>
    );
}

// ─── BarChart (pure CSS/SVG, no recharts) ────────────────────────────────────

function BorrowingsChart({ data }: { data: ChartData[] }) {
    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Peminjaman 7 Hari Terakhir</h3>
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
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Peminjaman Terbaru</h3>
                </div>
                <button
                    onClick={() => navigate('/dashboard/borrowings')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 transition-all duration-200 ease-out active:scale-[0.97]"
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
                            <tr className="bg-neutral-50 border-b border-neutral-100 dark:bg-neutral-800/50 dark:border-neutral-800">
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left dark:text-neutral-400">Kode</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left dark:text-neutral-400">Peminjam</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left dark:text-neutral-400">Tgl Pinjam</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-left dark:text-neutral-400">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right dark:text-neutral-400">Barang</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(b => {
                                const status = STATUS_MAP[b.status] ?? { label: b.status, cls: '' };
                                return (
                                    <tr
                                        key={b.id}
                                        onClick={() => navigate(`/dashboard/borrowings/${b.id}`)}
                                        className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors duration-150 cursor-pointer dark:border-neutral-800 dark:hover:bg-neutral-800/40"
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            {b.code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                                            {b.user?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500">
                                            {formatDate(b.borrow_date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${status.cls}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-neutral-500">
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
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Aktivitas Terbaru</h3>
            </div>

            {data.length === 0 ? (
                <div className="p-6 text-center text-sm text-neutral-400">Belum ada aktivitas.</div>
            ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.map((log, idx) => (
                        <li key={idx} className="px-6 py-3 flex gap-3">
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
    return <div className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl ${className}`} />;
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 7 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-28" />
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

    // Siswa: welcome view dengan shortcut ke fitur utama
    if (!isGuruOrAdmin) {
        return (
            <div className="space-y-6">
                {/* Welcome banner */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl px-8 py-10 text-white shadow-lg overflow-hidden relative">
                    {/* Decorative circles */}
                    <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
                    <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-white/5" />

                    <p className="relative text-sm font-medium text-indigo-200 mb-2">Selamat datang 👋</p>
                    <h2 className="relative text-2xl font-bold tracking-tight">{user?.name}</h2>
                    <p className="relative text-indigo-200 text-sm mt-2">
                        Sistem Inventaris & Peminjaman Lab TKJ — SMKN 2 Singosari
                    </p>
                </div>

                {/* Shortcut cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        to="/dashboard/borrowings/create"
                        className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:bg-neutral-900 dark:border-neutral-800"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
                            <ClipboardList className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Buat Peminjaman</p>
                        <p className="text-xs text-neutral-400 mt-1">Ajukan permohonan peminjaman barang</p>
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-4 group-hover:gap-2 transition-all duration-150">
                            Mulai <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>

                    <Link
                        to="/dashboard/borrowings"
                        className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:bg-neutral-900 dark:border-neutral-800"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-4">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Riwayat Peminjaman</p>
                        <p className="text-xs text-neutral-400 mt-1">Pantau status peminjaman aktif</p>
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-4 group-hover:gap-2 transition-all duration-150">
                            Lihat <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>

                    <Link
                        to="/dashboard/guide"
                        className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer dark:bg-neutral-900 dark:border-neutral-800"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
                            <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Panduan Pengguna</p>
                        <p className="text-xs text-neutral-400 mt-1">Cara pakai sistem step by step</p>
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-4 group-hover:gap-2 transition-all duration-150">
                            Baca <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
        return (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 px-6 py-8 shadow-sm text-center space-y-3">
                <p className="text-red-500 font-medium">Gagal memuat data dashboard.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 ease-out active:scale-[0.97]"
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
            icon: <Package className="w-6 h-6 text-blue-600" />,
            colorClass: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            label: 'Kategori',
            value: stats.total_categories,
            icon: <Tag className="w-6 h-6 text-violet-600" />,
            colorClass: 'bg-violet-100 dark:bg-violet-900/30',
        },
        {
            label: 'Total User',
            value: stats.total_users,
            icon: <Users className="w-6 h-6 text-cyan-600" />,
            colorClass: 'bg-cyan-100 dark:bg-cyan-900/30',
        },
        {
            label: 'Sedang Dipinjam',
            value: stats.active_borrowings,
            icon: <ClipboardList className="w-6 h-6 text-indigo-600" />,
            colorClass: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            label: 'Pending Approval',
            value: stats.pending_approvals,
            icon: <Clock className="w-6 h-6 text-yellow-600" />,
            colorClass: 'bg-yellow-100 dark:bg-yellow-900/30',
            note: 'Menunggu disetujui',
        },
        {
            label: 'Proses Kembali',
            value: stats.returning_count,
            icon: <RotateCcw className="w-6 h-6 text-purple-600" />,
            colorClass: 'bg-purple-100 dark:bg-purple-900/30',
        },
        {
            label: 'Stok Menipis',
            value: stats.items_low_stock,
            icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
            colorClass: 'bg-red-100 dark:bg-red-900/30',
            note: 'Di bawah stok minimum',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Dashboard</h1>
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
