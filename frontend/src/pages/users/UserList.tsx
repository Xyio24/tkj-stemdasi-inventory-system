import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, updateUser, toggleUserStatus } from '@/api/users';
import type { User } from '@/api/users';
import { getClasses, getAcademicYears } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Search, Users, ShieldAlert } from 'lucide-react';

const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    guru:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    siswa: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
                            <div className="space-y-1.5">
                                <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                <div className="h-2.5 w-36 bg-neutral-200 dark:bg-neutral-800 rounded" />
                            </div>
                        </div>
                    </td>
                    <td className="px-5 py-3.5"><div className="h-5 w-14 bg-neutral-200 dark:bg-neutral-800 rounded-full" /></td>
                    <td className="px-5 py-3.5"><div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="px-5 py-3.5"><div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                    <td className="px-5 py-3.5"><div className="h-5 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-full" /></td>
                    <td className="px-5 py-3.5"><div className="h-7 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-lg" /></td>
                </tr>
            ))}
        </>
    );
}

// ─── User Table ───────────────────────────────────────────────────────────────

function UserTable({
    users,
    isLoading,
    classesData,
    updateMutation,
    toggleMutation,
    currentUserId,
    showClassCol = true,
}: {
    users: User[];
    isLoading: boolean;
    classesData: any;
    updateMutation: any;
    toggleMutation: any;
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
                        <TableSkeleton />
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

                            return (
                                <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    {/* User info */}
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-indigo-700 dark:text-indigo-400">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                    {user.name}
                                                    {isSelf && <span className="ml-1.5 text-[10px] text-neutral-400">(Kamu)</span>}
                                                </div>
                                                <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role dropdown */}
                                    <td className="px-5 py-3.5">
                                        <select
                                            value={user.role}
                                            disabled={isSelf || updateMutation.isPending}
                                            onChange={e => updateMutation.mutate({ id: user.id, data: { role: e.target.value } })}
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
                                                    onChange={e => updateMutation.mutate({
                                                        id: user.id,
                                                        data: { class_id: e.target.value ? Number(e.target.value) : null },
                                                    })}
                                                    className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
                                                >
                                                    <option value="">— Belum —</option>
                                                    {classesData?.data?.map((c: any) => (
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
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${user.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>

                                    {/* Action */}
                                    <td className="px-5 py-3.5 text-right">
                                        <button
                                            onClick={() => toggleMutation.mutate(user.id)}
                                            disabled={isSelf || toggleMutation.isPending}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                                user.is_active
                                                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20'
                                                    : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20'
                                            }`}
                                        >
                                            {user.is_active ? 'Blokir' : 'Aktifkan'}
                                        </button>
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

export default function UserList() {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | number>('general');
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(state => state.user);

    // Ambil semua user sekaligus (tanpa pagination per tab, lebih simple)
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

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Data pengguna berhasil diperbarui');
        },
        onError: () => toast.error('Gagal memperbarui data pengguna'),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: number) => toggleUserStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Status pengguna berhasil diubah');
        },
        onError: () => toast.error('Gagal mengubah status pengguna'),
    });

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

    const allUsers: User[] = data?.data ?? [];
    const activeYears: AcademicYear[] = (yearsData?.data ?? []).filter(y => y.is_active);

    // "Umum": user tanpa kelas (siswa belum dikategorikan) + semua guru & admin
    const generalUsers = allUsers.filter(u =>
        u.role !== 'siswa' || !u.student_class?.id
    );

    // Untuk setiap angkatan aktif: siswa yang punya kelas di angkatan tsb
    const usersByYear = activeYears.map(year => {
        const yearUsers = allUsers.filter(u =>
            u.role === 'siswa' &&
            u.student_class?.academic_year?.id === year.id
        );
        return { year, users: yearUsers };
    });

    // Tab angkatan hanya muncul jika ada siswa di angkatan tersebut
    const visibleYearTabs = usersByYear.filter(t => t.users.length > 0);

    // Users yang ditampilkan sesuai tab aktif
    const displayUsers =
        activeTab === 'general'
            ? generalUsers
            : (usersByYear.find(t => t.year.id === activeTab)?.users ?? []);

    const isGeneralTab = activeTab === 'general';

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Manajemen Pengguna</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Kelola akun dan role pengguna sistem</p>
                </div>
                {/* Search */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, email, NIS/NIP..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-0 overflow-x-auto">
                    {/* Tab Umum */}
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === 'general'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                    >
                        Umum
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            activeTab === 'general'
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                        }`}>
                            {isLoading ? '…' : generalUsers.length}
                        </span>
                    </button>

                    {/* Tab per angkatan aktif */}
                    {usersByYear.map(({ year, users }) => (
                        <button
                            key={year.id}
                            onClick={() => setActiveTab(year.id)}
                            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === year.id
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        >
                            Angkatan {year.name}
                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                activeTab === year.id
                                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                                    : users.length > 0
                                        ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                                        : 'bg-neutral-50 text-neutral-300 dark:bg-neutral-900'
                            }`}>
                                {isLoading ? '…' : users.length}
                            </span>
                        </button>
                    ))}

                    {/* Hint jika belum ada angkatan aktif */}
                    {!isLoading && activeYears.length === 0 && (
                        <span className="px-4 py-2.5 text-xs text-neutral-400 italic self-center">
                            (Aktifkan angkatan di Master Data untuk melihat tab per angkatan)
                        </span>
                    )}
                </div>
            </div>

            {/* Keterangan tab aktif */}
            {activeTab !== 'general' && visibleYearTabs.length === 0 && !isLoading && (
                <p className="text-xs text-neutral-400 text-center py-2">
                    Belum ada siswa yang dikategorikan ke angkatan ini.
                </p>
            )}

            {/* Tabel */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                {data?.meta && (
                    <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
                        Menampilkan <span className="font-semibold text-neutral-700 dark:text-neutral-300">{displayUsers.length}</span>
                        {' '}dari <span className="font-semibold text-neutral-700 dark:text-neutral-300">{allUsers.length}</span> pengguna
                    </div>
                )}

                <UserTable
                    users={displayUsers}
                    isLoading={isLoading}
                    classesData={classesData}
                    updateMutation={updateMutation}
                    toggleMutation={toggleMutation}
                    currentUserId={currentUser?.id ?? 0}
                    showClassCol={isGeneralTab}
                />
            </div>
        </div>
    );
}
