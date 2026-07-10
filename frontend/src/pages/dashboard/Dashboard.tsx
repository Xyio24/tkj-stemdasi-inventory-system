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
    BookOpen,
    RefreshCw,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Menunggu',     cls: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
    approved:  { label: 'Disetujui',    cls: 'bg-blue-100/80   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400'   },
    rejected:  { label: 'Ditolak',      cls: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
    borrowing: { label: 'Dipinjam',     cls: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    returning: { label: 'Pengembalian', cls: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    returned:  { label: 'Dikembalikan', cls: 'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
    overdue:   { label: 'Terlambat',    cls: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
    cancelled: { label: 'Dibatalkan',   cls: 'bg-neutral-100   text-neutral-500 dark:bg-neutral-800  dark:text-neutral-400' },
};

function formatDate(iso?: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelativeTime(iso: string): string {
    const diff  = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    if (mins < 1)  return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
    return <div className={['skeleton', className].filter(Boolean).join(' ')} />;
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-28 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 3 }).map((_, i) => <Sk key={i} className="h-24 rounded-3xl" />)}
            </div>
            <Sk className="h-52 rounded-3xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Sk className="lg:col-span-2 h-64 rounded-3xl" />
                <Sk className="h-64 rounded-3xl" />
            </div>
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
    label:       string;
    value:       number;
    icon:        React.ReactNode;
    iconBg:      string;      // bg + text color classes for icon badge
    note?:       string;
    delay?:      string;
    alert?:      boolean;     // red glow for alerts
    wide?:       boolean;     // full-width horizontal layout
}

function StatCard({ label, value, icon, iconBg, note, delay, alert, wide }: StatCardProps) {
    if (wide) {
        return (
            <div className={[
                'glass-card relative overflow-hidden px-5 py-4 group',
                'flex items-center gap-4',
                'hover:shadow-float hover:-translate-y-0.5 transition-all duration-300 ease-spring',
                'animate-fade-up',
                delay ?? '',
                alert && value > 0 ? 'ring-2 ring-red-400/30 dark:ring-red-500/20' : '',
            ].filter(Boolean).join(' ')}>
                {/* Icon */}
                <div className={[
                    'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                    'transition-transform duration-300 ease-spring group-hover:scale-110',
                    iconBg,
                ].join(' ')}>
                    {icon}
                </div>

                {/* Value + label side by side */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-foreground tabular-nums leading-none tracking-tight">
                            {value.toLocaleString('id-ID')}
                        </p>
                        {alert && value > 0 && (
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse-glow flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-xs font-semibold text-foreground/55 uppercase tracking-wide leading-none">
                        {label}
                    </p>
                </div>

                {note && (
                    <p className="ml-auto text-[11px] text-muted-foreground/60 font-medium flex-shrink-0 hidden sm:block">
                        {note}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={[
            'glass-card relative overflow-hidden p-4 group',
            'hover:shadow-float hover:-translate-y-0.5 transition-all duration-300 ease-spring',
            'animate-fade-up',
            delay ?? '',
            alert && value > 0 ? 'ring-2 ring-red-400/30 dark:ring-red-500/20' : '',
        ].filter(Boolean).join(' ')}>

            {/* Icon + Value row */}
            <div className="flex items-center gap-3">
                {/* iOS-style icon badge */}
                <div className={[
                    'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                    'transition-transform duration-300 ease-spring group-hover:scale-110',
                    iconBg,
                ].join(' ')}>
                    {icon}
                </div>

                {/* Value + alert dot */}
                <div className="flex items-center gap-2 min-w-0">
                    <p className="text-2xl font-bold text-foreground tabular-nums leading-none tracking-tight">
                        {value.toLocaleString('id-ID')}
                    </p>
                    {alert && value > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse-glow flex-shrink-0" />
                    )}
                </div>
            </div>

            {/* Label + note */}
            <div className="mt-3">
                <p className="text-xs font-semibold text-foreground/55 leading-snug uppercase tracking-wide">
                    {label}
                </p>
                {note && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium">{note}</p>
                )}
            </div>
        </div>
    );
}

// ─── BorrowingsChart ──────────────────────────────────────────────────────────

function BorrowingsChart({ data }: { data: ChartData[] }) {
    const max = Math.max(...data.map(d => d.count), 1);
    const isEmpty = data.every(d => d.count === 0);

    return (
        <div className="glass-card p-6 animate-fade-up delay-300">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-foreground">Peminjaman 7 Hari Terakhir</h3>
                    <p className="text-xs text-muted-foreground">Frekuensi pengajuan harian</p>
                </div>
            </div>

            {isEmpty ? (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Belum ada peminjaman dalam 7 hari terakhir.</p>
                </div>
            ) : (
                <div
                    className="flex items-end gap-1.5 h-36"
                    aria-label="Grafik peminjaman 7 hari terakhir"
                    role="img"
                >
                    {data.map((d, i) => {
                        const heightPct = max > 0 ? (d.count / max) * 100 : 0;
                        const label = new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' });
                        const isMax = d.count === max && max > 0;

                        return (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group/bar">
                                {/* Count label */}
                                <span className={[
                                    'text-[10px] font-semibold transition-all duration-200',
                                    d.count > 0
                                        ? 'text-primary opacity-80 group-hover/bar:opacity-100'
                                        : 'opacity-0',
                                ].join(' ')}>
                                    {d.count}
                                </span>

                                {/* Bar */}
                                <div className="w-full flex items-end" style={{ height: '88px' }}>
                                    <div
                                        className={[
                                            'w-full rounded-t-xl transition-all duration-500 ease-spring',
                                            isMax
                                                ? 'bg-primary shadow-glow-blue-sm'
                                                : 'bg-primary/40 dark:bg-primary/30 group-hover/bar:bg-primary/70',
                                            // Stagger animation via inline style delay
                                        ].join(' ')}
                                        style={{
                                            height: d.count > 0 ? `${Math.max(heightPct, 6)}%` : '2px',
                                            opacity: d.count > 0 ? 1 : 0.2,
                                            animationDelay: `${i * 60}ms`,
                                        }}
                                        title={`${d.date}: ${d.count} peminjaman`}
                                    />
                                </div>

                                {/* Day label */}
                                <span className="text-[9px] font-medium text-muted-foreground/70 leading-none uppercase tracking-wide">
                                    {label}
                                </span>
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
        <div className="glass-card overflow-hidden animate-fade-up delay-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/30 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Peminjaman Terbaru</h3>
                </div>
                <button
                    onClick={() => navigate('/dashboard/borrowings')}
                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:gap-1.5 transition-all duration-200 active:scale-[0.96] px-2.5 py-1.5 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/15"
                >
                    Lihat semua <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {data.length === 0 ? (
                <div className="px-5 py-10 text-center">
                    <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada data peminjaman.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Kode</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Peminjam</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden sm:table-cell">Tgl Pinjam</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Status</th>
                                <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Item</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((b) => {
                                const status = STATUS_MAP[b.status] ?? { label: b.status, cls: '' };
                                return (
                                    <tr
                                        key={b.id}
                                        onClick={() => navigate(`/dashboard/borrowings/${b.id}`)}
                                        className="border-b border-border/30 hover:bg-accent/50 transition-colors duration-150 cursor-pointer group/row"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-xs font-semibold text-primary">
                                                {b.code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-foreground/80 font-medium">
                                            {b.user?.name ?? '-'}
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                                            {formatDate(b.borrow_date)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={['badge-pill', status.cls].join(' ')}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-muted-foreground font-medium">
                                            {b.items_count}
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

// Dot color map by activity description keywords
function getActivityDot(description: string): string {
    const d = description.toLowerCase();
    if (d.includes('kembalikan') || d.includes('kembali'))   return 'bg-green-400';
    if (d.includes('tolak') || d.includes('ditolak'))        return 'bg-red-400';
    if (d.includes('setujui') || d.includes('disetujui'))    return 'bg-blue-400';
    if (d.includes('pinjam'))                                return 'bg-indigo-400';
    if (d.includes('tambah') || d.includes('buat'))          return 'bg-violet-400';
    return 'bg-primary/60';
}

function ActivityFeed({ data }: { data: RecentActivity[] }) {
    return (
        <div className="glass-card overflow-hidden animate-fade-up delay-300">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/50">
                <div className="w-8 h-8 rounded-xl bg-green-100/80 dark:bg-green-900/30 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Aktivitas Terbaru</h3>
            </div>

            {data.length === 0 ? (
                <div className="px-5 py-10 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
                </div>
            ) : (
                <ul className="divide-y divide-border/30">
                    {data.map((log, idx) => (
                        <li key={idx} className="px-5 py-3.5 flex gap-3 hover:bg-accent/30 transition-colors duration-150">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center flex-shrink-0 pt-1.5">
                                <div className={['w-2 h-2 rounded-full flex-shrink-0', getActivityDot(log.description)].join(' ')} />
                                {idx < data.length - 1 && (
                                    <div className="w-px flex-1 bg-border/40 mt-1.5 min-h-[16px]" />
                                )}
                            </div>
                            {/* Content */}
                            <div className="min-w-0 flex-1 pb-0.5">
                                <p className="text-sm text-foreground/80 leading-snug">{log.description}</p>
                                <p className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">
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

// ─── Student Welcome ──────────────────────────────────────────────────────────

function StudentWelcome({ name }: { name: string }) {
    return (
        <div className="space-y-5 animate-fade-up">
            {/* Hero banner */}
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-10 text-white shadow-glow-blue animate-spring-in">
                {/* Glass orb decorations */}
                <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/8 pointer-events-none animate-float" style={{ animationDuration: '6s' }} />
                <div className="absolute -right-4 bottom-0 w-36 h-36 rounded-full bg-white/5 pointer-events-none animate-float" style={{ animationDuration: '8s', animationDelay: '-3s' }} />
                <div className="absolute left-1/2 top-0 w-64 h-64 rounded-full bg-white/4 pointer-events-none -translate-x-1/4 -translate-y-1/2 animate-float" style={{ animationDuration: '10s', animationDelay: '-5s' }} />

                <p className="relative text-sm font-medium text-white/70 mb-1.5 animate-fade-up">Selamat datang 👋</p>
                <h2 className="relative text-2xl font-bold tracking-tight leading-tight animate-fade-up delay-75">{name}</h2>
                <p className="relative text-white/60 text-sm mt-2 leading-relaxed animate-fade-up delay-150">
                    Sistem Inventaris &amp; Peminjaman Lab TKJ<br />SMKN 2 Singosari
                </p>
            </div>

            {/* Shortcut cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    {
                        to: '/dashboard/borrowings/create',
                        icon: <ClipboardList className="w-5 h-5" />,
                        iconBg: 'bg-primary/10 dark:bg-primary/20 text-primary',
                        title: 'Buat Peminjaman',
                        desc:  'Ajukan permohonan peminjaman barang',
                        delay: 'delay-100',
                    },
                    {
                        to: '/dashboard/borrowings',
                        icon: <Clock className="w-5 h-5" />,
                        iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                        title: 'Riwayat Peminjaman',
                        desc:  'Pantau status peminjaman aktif',
                        delay: 'delay-150',
                    },
                    {
                        to: '/dashboard/guide',
                        icon: <BookOpen className="w-5 h-5" />,
                        iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                        title: 'Panduan Pengguna',
                        desc:  'Cara pakai sistem step by step',
                        delay: 'delay-200',
                    },
                ].map((card) => (
                    <Link
                        key={card.to}
                        to={card.to}
                        className={[
                            'glass-card p-5 flex flex-col gap-3 group',
                            'hover:shadow-float hover:-translate-y-1',
                            'transition-all duration-300 ease-spring',
                            'animate-fade-up',
                            card.delay,
                        ].join(' ')}
                    >
                        <div className={['w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ease-spring group-hover:scale-110', card.iconBg].join(' ')}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-foreground">{card.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.desc}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-auto group-hover:gap-1.5 transition-all duration-150">
                            Buka <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const user           = useAuthStore(state => state.user);
    const isGuruOrAdmin  = user?.role === 'guru' || user?.role === 'admin';

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn:  getDashboard,
        enabled:  isGuruOrAdmin,
        staleTime: 60_000,
    });

    if (!isGuruOrAdmin) {
        return <StudentWelcome name={user?.name ?? 'Pengguna'} />;
    }

    if (isLoading) return <DashboardSkeleton />;

    if (isError) {
        return (
            <div className="glass-card px-6 py-10 text-center space-y-4 animate-spring-in">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                <p className="font-semibold text-foreground">Gagal memuat data dashboard.</p>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-2xl font-semibold hover:brightness-110 active:scale-[0.96] transition-all duration-200 shadow-glow-blue-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Coba Lagi
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { stats, recent_borrowings, recent_activity, borrowings_chart } = data;

    const topCards: StatCardProps[] = [
        {
            label:   'Total Barang',
            value:   stats.total_items,
            icon:    <Package    className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
            iconBg:  'bg-blue-100/80 dark:bg-blue-500/20',
        },
        {
            label:   'Kategori',
            value:   stats.total_categories,
            icon:    <Tag         className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
            iconBg:  'bg-violet-100/80 dark:bg-violet-500/20',
        },
        {
            label:   'Total Pengguna',
            value:   stats.total_users,
            icon:    <Users       className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />,
            iconBg:  'bg-cyan-100/80 dark:bg-cyan-500/20',
        },
        {
            label:   'Sedang Dipinjam',
            value:   stats.active_borrowings,
            icon:    <ClipboardList className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
            iconBg:  'bg-indigo-100/80 dark:bg-indigo-500/20',
        },
    ];

    const alertCards: StatCardProps[] = [
        {
            label:   'Persetujuan',
            value:   stats.pending_approvals,
            icon:    <Clock         className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
            iconBg:  'bg-amber-100/80 dark:bg-amber-500/20',
            alert:   stats.pending_approvals > 0,
        },
        {
            label:   'Proses Kembali',
            value:   stats.returning_count,
            icon:    <RotateCcw     className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
            iconBg:  'bg-violet-100/80 dark:bg-violet-500/20',
        },
        {
            label:   'Stok Menipis',
            value:   stats.items_low_stock,
            icon:    <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />,
            iconBg:  'bg-red-100/80 dark:bg-red-500/20',
            alert:   stats.items_low_stock > 0,
        },
    ];

    return (
        <div className="space-y-5">

            {/* ── Page Header ── */}
            <div className="animate-fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Ringkasan sistem inventaris &amp; peminjaman TKJ
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.95]"
                    title="Refresh"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                </button>
            </div>

            {/* ── Stat cards — 6 kotak (2 baris × 3 kolom mobile, 1 baris × 6 kolom lg) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {topCards.map((card, i) => (
                    <StatCard key={card.label} {...card} delay={`delay-${[0, 75, 150, 200, 100, 175][i]}`} />
                ))}
                {alertCards.slice(0, 2).map((card, i) => (
                    <StatCard key={card.label} {...card} delay={`delay-${[100, 175][i]}`} />
                ))}
            </div>

            {/* ── Wide alert card — Stok Menipis ── */}
            <div>
                <StatCard {...alertCards[2]} delay="delay-250" wide />
            </div>

            {/* ── Chart ── */}
            <BorrowingsChart data={borrowings_chart} />

            {/* ── Recent Borrowings + Activity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <RecentBorrowingsTable data={recent_borrowings} />
                </div>
                <ActivityFeed data={recent_activity} />
            </div>
        </div>
    );
}
