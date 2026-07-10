import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';
import { CalendarDays, Plus, Trash2, FolderOpen, CheckCircle2 } from 'lucide-react';
import { Button, ButtonSpinner } from '@/components/ui/button';

const MAX_ACTIVE = 3;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
    return (
        <>
            {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border/30">
                    <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <div className="skeleton w-7 h-7 rounded-xl flex-shrink-0" />
                            <div className="skeleton h-4 w-28 rounded-full" />
                        </div>
                    </td>
                    <td className="px-5 py-4">
                        <div className="skeleton h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-5 py-4 text-right">
                        <div className="skeleton h-7 w-24 rounded-xl ml-auto" />
                    </td>
                </tr>
            ))}
        </>
    );
}

// ─── Active Slot Indicator ─────────────────────────────────────────────────────

function ActiveSlotIndicator({ activeCount }: { activeCount: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                Slot Aktif
            </span>
            <div className="flex items-center gap-1 ml-1">
                {Array.from({ length: MAX_ACTIVE }).map((_, i) => (
                    <div
                        key={i}
                        className={[
                            'w-2 h-2 rounded-full transition-all duration-300',
                            i < activeCount
                                ? 'bg-green-500 shadow-[0_0_4px_oklch(0.60_0.20_145/0.5)]'
                                : 'bg-border',
                        ].join(' ')}
                        title={i < activeCount ? 'Slot terisi' : 'Slot kosong'}
                    />
                ))}
            </div>
            <span className="text-xs font-semibold text-foreground">
                {activeCount}/{MAX_ACTIVE}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AcademicYearList() {
    const [name, setName]         = useState('');
    const [isActive, setIsActive] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['academic-years'],
        queryFn: getAcademicYears,
    });

    const years: AcademicYear[] = data?.data ?? [];
    const activeCount = years.filter(y => y.is_active).length;
    const atMaxActive = activeCount >= MAX_ACTIVE;

    // ── Mutations ─────────────────────────────────────────────────────────────

    const createMutation = useMutation({
        mutationFn: createAcademicYear,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Angkatan berhasil ditambahkan');
            setName('');
            setIsActive(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan angkatan'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: { is_active: boolean } }) =>
            updateAcademicYear(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Status angkatan berhasil diperbarui');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui angkatan'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAcademicYear,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Angkatan berhasil dihapus');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus angkatan'),
    });

    function handleToggleActive(year: AcademicYear) {
        if (!year.is_active && atMaxActive) {
            toast.error(`Maksimal ${MAX_ACTIVE} angkatan aktif. Nonaktifkan salah satu terlebih dahulu.`);
            return;
        }
        updateMutation.mutate({ id: year.id, data: { is_active: !year.is_active } });
    }

    function handleCreate() {
        if (!name.trim()) return;
        createMutation.mutate({ name: name.trim(), is_active: isActive });
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Angkatan</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Kelola tahun ajaran & angkatan aktif</p>
                </div>
                <div className="glass-card px-4 py-2.5 animate-fade-up delay-75">
                    <ActiveSlotIndicator activeCount={activeCount} />
                </div>
            </div>

            {/* ── Form tambah ── */}
            <div className="glass-card px-5 py-5 animate-fade-up delay-75">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Tambah Angkatan Baru</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    {/* Nama */}
                    <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">
                            Nama Angkatan{' '}
                            <span className="normal-case font-normal text-muted-foreground/50">(contoh: 17 (2024))</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="17 (2024)"
                            className="input-ios"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Checkbox aktif */}
                        <label
                            className={[
                                'flex items-center gap-2 cursor-pointer select-none',
                                !isActive && atMaxActive ? 'opacity-40 cursor-not-allowed' : '',
                            ].join(' ')}
                        >
                            <div
                                className={[
                                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0',
                                    isActive
                                        ? 'bg-primary border-primary'
                                        : 'border-border bg-background',
                                    !isActive && atMaxActive ? 'cursor-not-allowed' : 'cursor-pointer',
                                ].join(' ')}
                                onClick={() => {
                                    if (!isActive && atMaxActive) return;
                                    setIsActive(a => !a);
                                }}
                            >
                                {isActive && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className="text-sm text-foreground/80 whitespace-nowrap">
                                Jadikan Aktif
                                {!isActive && atMaxActive && (
                                    <span className="ml-1 text-[10px] text-amber-500">(limit)</span>
                                )}
                            </span>
                        </label>

                        <Button
                            onClick={handleCreate}
                            disabled={!name.trim() || createMutation.isPending}
                            loading={createMutation.isPending}
                            className="gap-1.5 flex-shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5" /> Tambah
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Max active warning ── */}
            {atMaxActive && (
                <div className="animate-fade-up glass-card px-4 py-3 border border-amber-200/60 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-900/10">
                    <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                        ⚠ Batas maksimal <strong>{MAX_ACTIVE}</strong> angkatan aktif tercapai.
                        Nonaktifkan salah satu untuk mengaktifkan angkatan lain.
                    </p>
                </div>
            )}

            {/* ── Table ── */}
            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-100">
                {/* Table header info */}
                {!isLoading && years.length > 0 && (
                    <div className="px-5 py-3.5 border-b border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Total{' '}
                            <span className="font-semibold text-foreground">{years.length}</span>{' '}
                            angkatan,{' '}
                            <span className="font-semibold text-green-600 dark:text-green-400">{activeCount}</span>{' '}
                            aktif
                        </p>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">
                                    Nama Angkatan
                                </th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">
                                    Status
                                </th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <Skeleton />
                            ) : years.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <FolderOpen className="w-8 h-8 opacity-30" />
                                            <p className="text-sm">Belum ada angkatan.</p>
                                            <p className="text-xs opacity-60">Tambahkan angkatan pertama di form di atas.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                years.map((year, i) => (
                                    <tr
                                        key={year.id}
                                        className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 group animate-fade-up"
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        {/* Nama */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={[
                                                    'w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110',
                                                    year.is_active
                                                        ? 'bg-green-100 dark:bg-green-900/30'
                                                        : 'bg-accent/60',
                                                ].join(' ')}>
                                                    <CalendarDays className={[
                                                        'w-3.5 h-3.5',
                                                        year.is_active
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-muted-foreground/50',
                                                    ].join(' ')} />
                                                </div>
                                                <span className="font-semibold text-foreground">{year.name}</span>
                                            </div>
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-5 py-3.5">
                                            <span className={[
                                                'badge-pill',
                                                year.is_active
                                                    ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400',
                                            ].join(' ')}>
                                                {year.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                {/* Toggle aktif */}
                                                <Button
                                                    variant="glass-primary"
                                                    size="sm"
                                                    onClick={() => handleToggleActive(year)}
                                                    disabled={updateMutation.isPending || (!year.is_active && atMaxActive)}
                                                    className={[
                                                        ' transition-all duration-150',
                                                        !year.is_active && atMaxActive ? '!opacity-30 cursor-not-allowed' : '',
                                                    ].join(' ')}
                                                >
                                                    {updateMutation.isPending
                                                        ? <ButtonSpinner className="w-3 h-3" />
                                                        : year.is_active ? 'Nonaktifkan' : 'Aktifkan'
                                                    }
                                                </Button>

                                                {/* Hapus */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => {
                                                        if (confirm(`Hapus angkatan "${year.name}"?`)) {
                                                            deleteMutation.mutate(year.id);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15  transition-all duration-150"
                                                >
                                                    {deleteMutation.isPending
                                                        ? <ButtonSpinner className="w-3.5 h-3.5 text-destructive" />
                                                        : <Trash2 className="w-3.5 h-3.5" />
                                                    }
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
