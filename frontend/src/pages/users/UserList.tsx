import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    updateUser,
    approveUser,
    rejectUser,
    blockUser,
    unblockUser,
} from '@/api/users';
import type { User } from '@/api/users';
import { getClasses, getAcademicYears } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Search, Users, ShieldAlert, Clock, CheckCircle, XCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import GeneratedAvatar from '@/components/common/GeneratedAvatar';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    guru:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    siswa: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

const STATUS_BADGE: Record<string, string> = {
    active:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    blocked: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABEL: Record<string, string> = {
    active:  'Aktif',
    pending: 'Menunggu',
    blocked: 'Diblokir',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ cols = 6 }: { cols?: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                            <div className="space-y-1.5">
                                <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                <div className="h-2.5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded" />
                            </div>
                        </div>
                    </td>
                    {Array.from({ length: cols - 1 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                            <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ─── Avatar Cell ──────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: User }) {
    if (user.avatar_type === 'upload' && user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full shrink-0 object-cover"
            />
        );
    }
    return <GeneratedAvatar name={user.name} email={user.email} size={32} />;
}


// ─── Pending Table ────────────────────────────────────────────────────────────

function PendingTable({
    users,
    isLoading,
    approveMutation,
    rejectMutation,
}: {
    users: User[];
    isLoading: boolean;
    approveMutation: ReturnType<typeof useMutation>;
    rejectMutation: ReturnType<typeof useMutation<unknown, unknown, { id: number; reason: string }>>;
}) {
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    function submitReject(userId: number) {
        if (rejectReason.trim().length < 10) {
            toast.error('Alasan penolakan minimal 10 karakter.');
            return;
        }
        rejectMutation.mutate(
            { id: userId, reason: rejectReason.trim() },
            {
                onSuccess: () => {
                    setRejectId(null);
                    setRejectReason('');
                },
            }
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                        <th className="px-5 py-3 text-left font-medium">Pendaftar</th>
                        <th className="px-5 py-3 text-left font-medium">Kelas</th>
                        <th className="px-5 py-3 text-left font-medium">No. Absen</th>
                        <th className="px-5 py-3 text-left font-medium">Tgl. Daftar</th>
                        <th className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {isLoading ? (
                        <TableSkeleton cols={5} />
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-5 py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-neutral-400">
                                    <Clock className="w-8 h-8 opacity-30" />
                                    <span className="text-sm">Tidak ada akun yang menunggu persetujuan.</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <>
                                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    {/* User info */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} />
                                            <div className="min-w-0">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{user.name}</div>
                                                <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Kelas */}
                                    <td className="px-5 py-3.5 text-neutral-500 text-sm">
                                        {user.student_class ? (
                                            <span>
                                                {user.student_class.name}
                                                {user.student_class.academic_year && (
                                                    <span className="text-xs text-neutral-400 ml-1">
                                                        ({user.student_class.academic_year.name})
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-300 dark:text-neutral-600">—</span>
                                        )}
                                    </td>

                                    {/* No. Absen */}
                                    <td className="px-5 py-3.5 text-neutral-500 font-mono text-xs">
                                        {user.absen_number ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                                    </td>

                                    {/* Tgl daftar */}
                                    <td className="px-5 py-3.5 text-neutral-400 text-xs">
                                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                    </td>

                                    {/* Aksi */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => approveMutation.mutate(user.id)}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-950/20 dark:hover:bg-green-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Setujui
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRejectId(rejectId === user.id ? null : user.id);
                                                    setRejectReason('');
                                                }}
                                                disabled={approveMutation.isPending || rejectMutation.isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Tolak
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Inline reject form */}
                                {rejectId === user.id && (
                                    <tr key={`reject-${user.id}`} className="bg-red-50 dark:bg-red-950/10">
                                        <td colSpan={5} className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder="Alasan penolakan (min. 10 karakter)..."
                                                    className="flex-1 px-3 py-1.5 text-sm border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-red-400/30"
                                                />
                                                <button
                                                    onClick={() => submitReject(user.id)}
                                                    disabled={rejectMutation.isPending}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
                                                >
                                                    {rejectMutation.isPending ? 'Menolak...' : 'Kirim'}
                                                </button>
                                                <button
                                                    onClick={() => { setRejectId(null); setRejectReason(''); }}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}


// ─── Active/All Users Table ───────────────────────────────────────────────────

function ActiveTable({
    users,
    isLoading,
    classesData,
    updateMutation,
    blockMutation,
    unblockMutation,
    currentUserId,
    showClassCol = true,
}: {
    users: User[];
    isLoading: boolean;
    classesData: { data: { id: number; name: string }[] } | undefined;
    updateMutation: ReturnType<typeof useMutation<unknown, unknown, { id: number; data: Record<string, unknown> }>>;
    blockMutation: ReturnType<typeof useMutation<unknown, unknown, number>>;
    unblockMutation: ReturnType<typeof useMutation<unknown, unknown, number>>;
    currentUserId: number;
    showClassCol?: boolean;
}) {
    const colSpan = showClassCol ? 6 : 5;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                        <th className="px-5 py-3 text-left font-medium">Pengguna</th>
                        <th className="px-5 py-3 text-left font-medium">Role</th>
                        {showClassCol && <th className="px-5 py-3 text-left font-medium">Kelas</th>}
                        <th className="px-5 py-3 text-left font-medium">NIS / NIP</th>
                        <th className="px-5 py-3 text-left font-medium">Status</th>
                        <th className="px-5 py-3 text-right font-medium">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {isLoading ? (
                        <TableSkeleton cols={colSpan} />
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={colSpan} className="px-5 py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-neutral-400">
                                    <Users className="w-8 h-8 opacity-30" />
                                    <span className="text-sm">Tidak ada pengguna di sini.</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => {
                            const isSelf = user.id === currentUserId;
                            const roleBadge = ROLE_BADGE[user.role] ?? ROLE_BADGE.siswa;
                            const statusBadge = STATUS_BADGE[user.status] ?? STATUS_BADGE.active;

                            return (
                                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    {/* User info */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={user} />
                                            <div className="min-w-0">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                    {user.name}
                                                    {isSelf && <span className="ml-1.5 text-[10px] text-neutral-400">(Kamu)</span>}
                                                </div>
                                                <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="px-5 py-3.5">
                                        <select
                                            value={user.role}
                                            disabled={isSelf || updateMutation.isPending}
                                            onChange={(e) =>
                                                updateMutation.mutate({ id: user.id, data: { role: e.target.value } })
                                            }
                                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${roleBadge}`}
                                        >
                                            <option value="siswa">Siswa</option>
                                            <option value="guru">Guru</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>

                                    {/* Kelas */}
                                    {showClassCol && (
                                        <td className="px-5 py-3.5 text-neutral-500 text-sm">
                                            {user.role === 'siswa' ? (
                                                <select
                                                    value={user.student_class?.id ?? ''}
                                                    disabled={updateMutation.isPending}
                                                    onChange={(e) =>
                                                        updateMutation.mutate({
                                                            id: user.id,
                                                            data: { class_id: e.target.value ? Number(e.target.value) : null },
                                                        })
                                                    }
                                                    className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
                                                >
                                                    <option value="">— Belum —</option>
                                                    {classesData?.data?.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-neutral-400">—</span>
                                            )}
                                        </td>
                                    )}

                                    {/* NIS/NIP */}
                                    <td className="px-5 py-3.5 text-neutral-500 font-mono text-xs">
                                        {user.nis_nip ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge}`}>
                                            {STATUS_LABEL[user.status] ?? '—'}
                                        </span>
                                    </td>

                                    {/* Aksi */}
                                    <td className="px-5 py-3.5 text-right">
                                        {user.status === 'blocked' ? (
                                            <button
                                                onClick={() => unblockMutation.mutate(user.id)}
                                                disabled={isSelf || unblockMutation.isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                Aktifkan
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => blockMutation.mutate(user.id)}
                                                disabled={isSelf || blockMutation.isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <ShieldOff className="w-3.5 h-3.5" />
                                                Blokir
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = 'pending' | 'general' | number;

export default function UserList() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);

    // ── Queries ───────────────────────────────────────────────────────────────

    const { data, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: () => getUsers({ search: search || undefined, per_page: 200 }),
    });

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: () => getClasses(),
    });

    const { data: yearsData } = useQuery({
        queryKey: ['academic-years'],
        queryFn: getAcademicYears,
    });

    // ── Mutations ─────────────────────────────────────────────────────────────

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
            updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Data pengguna berhasil diperbarui.');
        },
        onError: () => toast.error('Gagal memperbarui data pengguna.'),
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => approveUser(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Akun berhasil disetujui.');
            // Pindah ke tab general setelah approve
            const approved = data?.data.find((u) => u.id === id);
            if (approved) setActiveTab('general');
        },
        onError: () => toast.error('Gagal menyetujui akun.'),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) =>
            rejectUser(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Pendaftaran berhasil ditolak.');
        },
        onError: () => toast.error('Gagal menolak pendaftaran.'),
    });

    const blockMutation = useMutation({
        mutationFn: (id: number) => blockUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Akun berhasil diblokir.');
        },
        onError: () => toast.error('Gagal memblokir akun.'),
    });

    const unblockMutation = useMutation({
        mutationFn: (id: number) => unblockUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Akun berhasil diaktifkan kembali.');
        },
        onError: () => toast.error('Gagal mengaktifkan akun.'),
    });

    // ── Guard ─────────────────────────────────────────────────────────────────

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Akses Ditolak</h2>
                <p className="text-sm text-neutral-500 mt-1">Halaman ini hanya dapat diakses oleh Admin.</p>
            </div>
        );
    }

    // ── Derived data ──────────────────────────────────────────────────────────

    const allUsers: User[] = data?.data ?? [];
    const activeYears: AcademicYear[] = (yearsData?.data ?? []).filter((y) => y.is_active);

    const pendingUsers  = allUsers.filter((u) => u.status === 'pending');
    const generalUsers  = allUsers.filter(
        (u) => u.status !== 'pending' && (u.role !== 'siswa' || !u.student_class?.id)
    );
    const usersByYear   = activeYears.map((year) => ({
        year,
        users: allUsers.filter(
            (u) =>
                u.status !== 'pending' &&
                u.role === 'siswa' &&
                u.student_class?.academic_year?.id === year.id
        ),
    }));

    const displayUsers: User[] =
        activeTab === 'pending'
            ? pendingUsers
            : activeTab === 'general'
            ? generalUsers
            : (usersByYear.find((t) => t.year.id === activeTab)?.users ?? []);

    // ── Tab helper ────────────────────────────────────────────────────────────

    function tabClass(tab: TabType) {
        const isActive = activeTab === tab;
        return `px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            isActive
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
        }`;
    }

    function badgeClass(tab: TabType) {
        const isActive = activeTab === tab;
        return `ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
            isActive
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
        }`;
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Kelola akun dan role pengguna sistem
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, email, NIS/NIP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-0 overflow-x-auto">
                    {/* Tab Menunggu Persetujuan */}
                    <button onClick={() => setActiveTab('pending')} className={tabClass('pending')}>
                        Menunggu Persetujuan
                        {pendingUsers.length > 0 && (
                            <span className={`${badgeClass('pending')} ${activeTab !== 'pending' ? '!bg-yellow-100 !text-yellow-700 dark:!bg-yellow-900/30 dark:!text-yellow-400' : ''}`}>
                                {isLoading ? '…' : pendingUsers.length}
                            </span>
                        )}
                    </button>

                    {/* Tab Umum */}
                    <button onClick={() => setActiveTab('general')} className={tabClass('general')}>
                        Umum
                        <span className={badgeClass('general')}>
                            {isLoading ? '…' : generalUsers.length}
                        </span>
                    </button>

                    {/* Tab per angkatan aktif */}
                    {usersByYear.map(({ year, users: yUsers }) => (
                        <button key={year.id} onClick={() => setActiveTab(year.id)} className={tabClass(year.id)}>
                            {year.name}
                            <span className={badgeClass(year.id)}>
                                {isLoading ? '…' : yUsers.length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
                    Menampilkan{' '}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {displayUsers.length}
                    </span>{' '}
                    pengguna
                </div>

                {activeTab === 'pending' ? (
                    <PendingTable
                        users={pendingUsers}
                        isLoading={isLoading}
                        approveMutation={approveMutation}
                        rejectMutation={rejectMutation}
                    />
                ) : (
                    <ActiveTable
                        users={displayUsers}
                        isLoading={isLoading}
                        classesData={classesData}
                        updateMutation={updateMutation}
                        blockMutation={blockMutation}
                        unblockMutation={unblockMutation}
                        currentUserId={currentUser?.id ?? 0}
                        showClassCol={activeTab === 'general'}
                    />
                )}
            </div>
        </div>
    );
}
