import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { getUsers, updateUser, approveUser, rejectUser, blockUser, unblockUser, resetUserPassword, deletePendingUser } from '@/api/users';
import type { User } from '@/api/users';
import { getClasses, getAcademicYears } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Search, Users, ShieldAlert, Clock, CheckCircle, XCircle, ShieldOff, ShieldCheck, KeyRound, Copy, Check, Trash2 } from 'lucide-react';
import GeneratedAvatar from '@/components/common/GeneratedAvatar';
import { Button, ButtonSpinner } from '@/components/ui/button';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-red-100/80  text-red-700  dark:bg-red-900/30  dark:text-red-400',
    guru:  'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    siswa: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-400',
};

const STATUS_BADGE: Record<string, string> = {
    active:   'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending:  'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blocked:  'bg-red-100/80   text-red-700   dark:bg-red-900/30   dark:text-red-400',
    rejected: 'bg-neutral-100  text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400',
};

const STATUS_LABEL: Record<string, string> = {
    active: 'Aktif', pending: 'Menunggu', blocked: 'Diblokir', rejected: 'Ditolak',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton({ cols = 5 }: { cols?: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                    <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                            <div className="skeleton w-8 h-8 rounded-2xl flex-shrink-0" />
                            <div className="space-y-1.5">
                                <div className="skeleton h-3 w-28 rounded-full" />
                                <div className="skeleton h-2.5 w-36 rounded-full" />
                            </div>
                        </div>
                    </td>
                    {Array.from({ length: cols - 1 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                            <div className="skeleton h-5 w-16 rounded-full" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: User }) {
    if (user.avatar_type === 'upload' && user.avatar) {
        return <img src={user.avatar_url || (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_STORAGE_URL}/${user.avatar}`)} alt={user.name} className="w-8 h-8 rounded-2xl flex-shrink-0 object-cover ring-1 ring-border" />;
    }
    return <GeneratedAvatar name={user.name} email={user.email} size={32} />;
}

// ─── PendingTable ─────────────────────────────────────────────────────────────

function PendingTable({
    users, isLoading, approveMutation, rejectMutation, deleteMutation,
}: {
    users: User[];
    isLoading: boolean;
    approveMutation: UseMutationResult<any, any, number, any>;
    rejectMutation: UseMutationResult<any, any, { id: number; reason: string }, any>;
    deleteMutation: UseMutationResult<any, any, number, any>;
}) {
    const [rejectId, setRejectId]         = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    function submitReject(userId: number) {
        if (rejectReason.trim().length < 10) { toast.error('Alasan penolakan minimal 10 karakter.'); return; }
        rejectMutation.mutate({ id: userId, reason: rejectReason.trim() }, {
            onSuccess: () => { setRejectId(null); setRejectReason(''); },
        });
    }

    function handleDelete(user: User) {
        if (!confirm(`Hapus pendaftaran ${user.name}?\n\nAkun ini akan dihapus permanen dari database dan tidak dapat dipulihkan.`)) return;
        deleteMutation.mutate(user.id);
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/50">
                        {['Pendaftar', 'Kelas', 'No. Absen', 'Tgl. Daftar', 'Aksi'].map((h, i) => (
                            <th key={h} className={['px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest', i === 4 ? 'text-center' : 'text-left', i === 2 ? 'hidden sm:table-cell' : '', i === 3 ? 'hidden md:table-cell' : ''].join(' ')}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? <TableSkeleton cols={5} /> : users.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Clock className="w-8 h-8 opacity-30" />
                                <p className="text-sm">Tidak ada akun yang menunggu persetujuan.</p>
                            </div>
                        </td></tr>
                    ) : users.map((user, i) => (
                        <>
                            <tr key={user.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 group animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={user} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-muted-foreground">
                                    {user.student_class ? (
                                        <span>{user.student_class.name}{user.student_class.academic_year && <span className="text-xs text-muted-foreground/60 ml-1">({user.student_class.academic_year.name})</span>}</span>
                                    ) : <span className="text-muted-foreground/40">—</span>}
                                </td>
                                <td className="px-5 py-3.5 hidden sm:table-cell font-mono text-xs text-muted-foreground">
                                    {user.absen_number ?? <span className="text-muted-foreground/40">—</span>}
                                </td>
                                <td className="px-5 py-3.5 hidden md:table-cell text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button size="sm" onClick={() => approveMutation.mutate(user.id)} disabled={(approveMutation.isPending as boolean) || (rejectMutation.isPending as boolean) || (deleteMutation.isPending as boolean)} className="gap-1 text-green-700 bg-green-100/80 hover:bg-green-200/80 border border-green-200/60 dark:text-green-400 dark:bg-green-900/20 dark:border-green-700/30">
                                            <CheckCircle className="w-3.5 h-3.5" /> Setujui
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setRejectId(rejectId === user.id ? null : user.id); setRejectReason(''); }} disabled={(approveMutation.isPending as boolean) || (rejectMutation.isPending as boolean) || (deleteMutation.isPending as boolean)} className="gap-1 text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15">
                                            <XCircle className="w-3.5 h-3.5" /> Tolak
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(user)} disabled={(approveMutation.isPending as boolean) || (rejectMutation.isPending as boolean) || (deleteMutation.isPending as boolean)} className="gap-1 text-destructive/70 hover:text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15" title="Hapus permanen">
                                            {(deleteMutation.isPending as boolean) ? <ButtonSpinner className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                            {rejectId === user.id && (
                                <tr key={`reject-${user.id}`} className="border-b border-border/30 bg-destructive/4 dark:bg-destructive/8 animate-fade-in">
                                    <td colSpan={5} className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <input type="text" autoFocus value={rejectReason} onChange={e => setRejectReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitReject(user.id)} placeholder="Alasan penolakan (min. 10 karakter)..." className="input-ios flex-1" />
                                            <Button size="sm" variant="destructive" onClick={() => submitReject(user.id)} disabled={rejectMutation.isPending as boolean} loading={rejectMutation.isPending as boolean}>Kirim</Button>
                                            <Button size="sm" variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Batal</Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── ResetPasswordModal ───────────────────────────────────────────────────────

function ResetPasswordModal({ userName, newPassword, onClose }: {
    userName: string;
    newPassword: string;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(newPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-spring-in">
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-foreground">Password Berhasil Direset</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Sampaikan password baru ini kepada <span className="font-semibold text-foreground">{userName}</span>. Password hanya ditampilkan sekali.
                    </p>
                </div>

                <div className="px-6 pb-2">
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-3 border border-border/40">
                        <span className="font-mono text-sm font-bold text-foreground flex-1 tracking-wider select-all">
                            {newPassword}
                        </span>
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                            title="Salin password"
                        >
                            {copied
                                ? <Check className="w-4 h-4 text-green-500" />
                                : <Copy className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 text-center">
                        ⚠ Tutup jendela ini setelah mencatat password
                    </p>
                </div>

                <div className="px-6 pb-5 pt-3">
                    <Button className="w-full" onClick={onClose}>Sudah Dicatat, Tutup</Button>
                </div>
            </div>
        </div>
    );
}

// ─── ActiveTable ──────────────────────────────────────────────────────────────

function ActiveTable({
    users, isLoading, classesData, updateMutation, blockMutation, unblockMutation, currentUserId, showClassCol = true,
}: {
    users: User[];
    isLoading: boolean;
    classesData: { data: { id: number; name: string }[] } | undefined;
    updateMutation: UseMutationResult<any, any, { id: number; data: Record<string, unknown> }, any>;
    blockMutation: UseMutationResult<any, any, number, any>;
    unblockMutation: UseMutationResult<any, any, number, any>;
    currentUserId: number;
    showClassCol?: boolean;
}) {
    const [resetResult, setResetResult] = useState<{ userName: string; newPassword: string } | null>(null);

    const resetPasswordMutation = useMutation({
        mutationFn: (id: number) => resetUserPassword(id),
        onSuccess: (data, id) => {
            const user = users.find(u => u.id === id);
            setResetResult({ userName: user?.name ?? 'User', newPassword: data.new_password });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message ?? 'Gagal mereset password.');
        },
    });
    const colSpan = showClassCol ? 5 : 4;
    const headers = showClassCol
        ? ['Pengguna', 'Role', 'Kelas', 'Status', 'Aksi']
        : ['Pengguna', 'Role', 'Status', 'Aksi'];

    return (
        <>
        {resetResult && (
            <ResetPasswordModal
                userName={resetResult.userName}
                newPassword={resetResult.newPassword}
                onClose={() => setResetResult(null)}
            />
        )}
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/50">
                        {headers.map((h, i) => (
                            <th key={h} className={['px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest', h === 'Aksi' ? 'text-center' : 'text-left'].join(' ')}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? <TableSkeleton cols={colSpan} /> : users.length === 0 ? (
                        <tr><td colSpan={colSpan} className="px-5 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Users className="w-8 h-8 opacity-30" />
                                <p className="text-sm">Tidak ada pengguna di sini.</p>
                            </div>
                        </td></tr>
                    ) : users.map((user, i) => {
                        const isSelf = user.id === currentUserId;
                        return (
                            <tr key={user.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 group animate-fade-up" style={{ animationDelay: `${i * 20}ms` }}>
                                {/* Pengguna */}
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <UserAvatar user={user} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {user.name}
                                                {isSelf && <span className="ml-1.5 badge-pill text-[9px] bg-primary/10 text-primary dark:bg-primary/20">Kamu</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                {/* Role */}
                                <td className="px-5 py-3.5">
                                    <select
                                        value={user.role}
                                        disabled={isSelf || (updateMutation.isPending as boolean)}
                                        onChange={e => updateMutation.mutate({ id: user.id, data: { role: e.target.value } })}
                                        className={['badge-pill cursor-pointer border-0 outline-none appearance-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-150', ROLE_BADGE[user.role] ?? ROLE_BADGE.siswa].join(' ')}
                                    >
                                        <option value="siswa">Siswa</option>
                                        <option value="guru">Guru</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                {/* Kelas */}
                                {showClassCol && (
                                    <td className="px-5 py-3.5">
                                        {user.role === 'siswa' ? (
                                            <select
                                                value={user.student_class?.id ?? ''}
                                                disabled={updateMutation.isPending as boolean}
                                                onChange={e => updateMutation.mutate({ id: user.id, data: { class_id: e.target.value ? Number(e.target.value) : null } })}
                                                className="input-ios py-1.5 text-xs appearance-none cursor-pointer w-36"
                                            >
                                                <option value="">— Belum —</option>
                                                {classesData?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        ) : <span className="text-muted-foreground/40 text-sm">—</span>}
                                    </td>
                                )}
                                {/* Status */}
                                <td className="px-5 py-3.5">
                                    <span className={['badge-pill', STATUS_BADGE[user.status] ?? STATUS_BADGE.active].join(' ')}>
                                        {STATUS_LABEL[user.status] ?? '—'}
                                    </span>
                                </td>
                                {/* Aksi — always visible on mobile, hover-reveal on sm+ */}
                                <td className="px-5 py-3.5 text-center">
                                    <div className="flex justify-center items-center gap-1">
                                    {user.status === 'blocked' ? (
                                        <Button variant="ghost" size="sm" onClick={() => unblockMutation.mutate(user.id)} disabled={isSelf || (unblockMutation.isPending as boolean)} className="gap-1.5 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20  transition-all duration-150">
                                            {unblockMutation.isPending ? <ButtonSpinner className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />} Aktifkan
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="sm" onClick={() => blockMutation.mutate(user.id)} disabled={isSelf || (blockMutation.isPending as boolean)} className="gap-1.5 text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15  transition-all duration-150">
                                            {blockMutation.isPending ? <ButtonSpinner className="w-3.5 h-3.5 text-destructive" /> : <ShieldOff className="w-3.5 h-3.5" />} Blokir
                                        </Button>
                                    )}
                                    {/* Reset Password — hanya tampil jika bukan diri sendiri */}
                                    {!isSelf && (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            title="Reset Password"
                                            disabled={resetPasswordMutation.isPending}
                                            onClick={() => {
                                                if (confirm(`Reset password ${user.name}?\nPassword baru akan dibuat otomatis.`)) {
                                                    resetPasswordMutation.mutate(user.id);
                                                }
                                            }}
                                            className="text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-all duration-150"
                                        >
                                            {resetPasswordMutation.isPending
                                                ? <ButtonSpinner className="w-3.5 h-3.5" />
                                                : <KeyRound className="w-3.5 h-3.5" />}
                                        </Button>
                                    )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = 'pending' | 'general' | number;

export default function UserList() {
    const [search, setSearch]       = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(state => state.user);

    const { data, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn:  () => getUsers({ search: search || undefined, per_page: 200 }),
    });
    const { data: classesData } = useQuery({ queryKey: ['classes'],         queryFn: () => getClasses() });
    const { data: yearsData }   = useQuery({ queryKey: ['academic-years'],  queryFn: getAcademicYears });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => updateUser(id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Data pengguna berhasil diperbarui.'); },
        onError: () => toast.error('Gagal memperbarui data pengguna.'),
    });
    const approveMutation = useMutation({
        mutationFn: (id: number) => approveUser(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Akun berhasil disetujui.');
            if (data?.data.find(u => u.id === id)) setActiveTab('general');
        },
        onError: () => toast.error('Gagal menyetujui akun.'),
    });
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectUser(id, reason),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Pendaftaran berhasil ditolak.'); },
        onError: () => toast.error('Gagal menolak pendaftaran.'),
    });
    const deletePendingMutation = useMutation({
        mutationFn: (id: number) => deletePendingUser(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Pendaftaran berhasil dihapus.'); },
        onError: () => toast.error('Gagal menghapus pendaftaran.'),
    });
    const blockMutation = useMutation({
        mutationFn: (id: number) => blockUser(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Akun berhasil diblokir.'); },
        onError: () => toast.error('Gagal memblokir akun.'),
    });
    const unblockMutation = useMutation({
        mutationFn: (id: number) => unblockUser(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Akun berhasil diaktifkan kembali.'); },
        onError: () => toast.error('Gagal mengaktifkan akun.'),
    });

    if (currentUser?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up">
                <div className="w-14 h-14 rounded-3xl bg-destructive/10 dark:bg-destructive/20 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="font-bold text-foreground text-lg">Akses Ditolak</h2>
                <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya dapat diakses oleh Admin.</p>
            </div>
        );
    }

    const allUsers: User[]            = data?.data ?? [];
    const activeYears: AcademicYear[] = (yearsData?.data ?? []).filter(y => y.is_active);
    const pendingUsers  = allUsers.filter(u => u.status === 'pending');
    const generalUsers  = allUsers.filter(u => u.status !== 'pending' && (u.role !== 'siswa' || !u.student_class?.id));
    const usersByYear   = activeYears.map(year => ({
        year,
        users: allUsers.filter(u => u.status !== 'pending' && u.role === 'siswa' && u.student_class?.academic_year?.id === year.id),
    }));
    const displayUsers: User[] =
        activeTab === 'pending'  ? pendingUsers :
        activeTab === 'general'  ? generalUsers :
        (usersByYear.find(t => t.year.id === activeTab)?.users ?? []);

    function tabCls(tab: TabType) {
        const on = activeTab === tab;
        return ['px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-all duration-200', on ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'].join(' ');
    }
    function tabBadge(count: number, tab: TabType, urgent = false) {
        const on = activeTab === tab;
        return (
            <span className={['ml-1.5 badge-pill text-[10px]', urgent && !on ? 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : on ? 'bg-primary/15 text-primary dark:bg-primary/25' : 'bg-muted text-muted-foreground'].join(' ')}>
                {isLoading ? '…' : count}
            </span>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Kelola akun dan role pengguna sistem</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
                    <input type="text" placeholder="Cari nama, email, NIS/NIP..." value={search} onChange={e => setSearch(e.target.value)} className="input-ios pl-10" />
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border/60 animate-fade-up delay-75">
                <div className="flex gap-0 overflow-x-auto">
                    <button onClick={() => setActiveTab('pending')} className={tabCls('pending')}>
                        Menunggu Persetujuan {tabBadge(pendingUsers.length, 'pending', pendingUsers.length > 0)}
                    </button>
                    <button onClick={() => setActiveTab('general')} className={tabCls('general')}>
                        Umum {tabBadge(generalUsers.length, 'general')}
                    </button>
                    {usersByYear.map(({ year, users: yUsers }) => (
                        <button key={year.id} onClick={() => setActiveTab(year.id)} className={tabCls(year.id)}>
                            {year.name} {tabBadge(yUsers.length, year.id)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-100">
                <div className="px-5 py-3.5 border-b border-border/40">
                    <p className="text-xs text-muted-foreground">
                        Menampilkan <span className="font-semibold text-foreground">{displayUsers.length}</span> pengguna
                    </p>
                </div>
                {activeTab === 'pending' ? (
                    <PendingTable users={pendingUsers} isLoading={isLoading} approveMutation={approveMutation} rejectMutation={rejectMutation} deleteMutation={deletePendingMutation} />
                ) : (
                    <ActiveTable users={displayUsers} isLoading={isLoading} classesData={classesData} updateMutation={updateMutation} blockMutation={blockMutation} unblockMutation={unblockMutation} currentUserId={currentUser?.id ?? 0} showClassCol={activeTab === 'general'} />
                )}
            </div>
        </div>
    );
}

