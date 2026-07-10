import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, createClass, deleteClass, getAcademicYears } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';
import { GraduationCap, Plus, Trash2, FolderOpen } from 'lucide-react';
import { Button, ButtonSpinner } from '@/components/ui/button';

function buildClassName(yearName: string, number: number): string {
    return `${yearName} TKJ ${number}`;
}

export default function ClassList() {
    const [academicYearId, setAcademicYearId] = useState<number | ''>('');
    const [classNumber,    setClassNumber]    = useState<number | ''>('');
    const [filterYearId,   setFilterYearId]   = useState<number | ''>('');
    const queryClient = useQueryClient();

    const { data: yearsData } = useQuery({ queryKey: ['academic-years'], queryFn: getAcademicYears });
    const { data: classes, isLoading } = useQuery({
        queryKey: ['classes', filterYearId],
        queryFn:  () => getClasses(filterYearId ? { academic_year_id: filterYearId as number } : undefined),
    });

    const years: AcademicYear[] = yearsData?.data ?? [];
    const selectedYear = years.find(y => y.id === academicYearId);
    const previewName  = selectedYear && classNumber !== '' ? buildClassName(selectedYear.name, classNumber as number) : '';

    const createMutation = useMutation({
        mutationFn: createClass,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); toast.success('Kelas berhasil ditambahkan'); setClassNumber(''); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menambahkan kelas'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClass,
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classes'] }); toast.success('Kelas berhasil dihapus'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus kelas'),
    });

    function handleAdd() {
        if (!academicYearId || classNumber === '' || !selectedYear) return;
        createMutation.mutate({ name: buildClassName(selectedYear.name, classNumber as number), academic_year_id: academicYearId as number });
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Kelas</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Kelola daftar kelas per angkatan</p>
                </div>
                <div className="flex items-center gap-2 animate-fade-up delay-75">
                    <span className="text-xs text-muted-foreground">Filter:</span>
                    <select value={filterYearId} onChange={e => setFilterYearId(e.target.value ? Number(e.target.value) : '')} className="input-ios py-1.5 text-xs appearance-none cursor-pointer w-40">
                        <option value="">Semua Angkatan</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}{y.is_active ? ' ✓' : ''}</option>)}
                    </select>
                </div>
            </div>

            {/* Form tambah */}
            <div className="glass-card px-5 py-5 animate-fade-up delay-75">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Tambah Kelas Baru</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Angkatan</label>
                        <select value={academicYearId} onChange={e => setAcademicYearId(e.target.value ? Number(e.target.value) : '')} className="input-ios appearance-none cursor-pointer">
                            <option value="">Pilih Angkatan</option>
                            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">No. Kelas</label>
                        <input type="number" min={1} max={9} value={classNumber} onChange={e => setClassNumber(e.target.value ? Number(e.target.value) : '')} placeholder="1" className="input-ios" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Nama Kelas (otomatis)</label>
                        <div className={['w-full rounded-2xl px-4 py-2.5 text-sm h-[42px] flex items-center border transition-all duration-200', previewName ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 text-primary font-semibold' : 'border-border/60 bg-accent/30 text-muted-foreground italic'].join(' ')}>
                            {previewName || 'Pilih angkatan & nomor…'}
                        </div>
                    </div>
                    <Button onClick={handleAdd} disabled={!previewName || createMutation.isPending} loading={createMutation.isPending} className="gap-1.5 h-[42px]">
                        <Plus className="w-3.5 h-3.5" /> Tambah
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/50">
                            <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Angkatan</th>
                            <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Nama Kelas</th>
                            <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Aksi</th>
                        </tr></thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/30">
                                        <td className="px-5 py-4"><div className="skeleton h-4 w-24 rounded-full" /></td>
                                        <td className="px-5 py-4"><div className="skeleton h-4 w-36 rounded-full" /></td>
                                        <td className="px-5 py-4" />
                                    </tr>
                                ))
                            ) : classes?.data?.length === 0 ? (
                                <tr><td colSpan={3} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FolderOpen className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">Tidak ada data kelas.</p>
                                    </div>
                                </td></tr>
                            ) : classes?.data?.map((c, i) => (
                                <tr key={c.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 group animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">{c.academic_year?.name}</span>
                                            {c.academic_year?.is_active && (
                                                <span className="badge-pill text-[9px] bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400">Aktif</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                                                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="font-semibold text-foreground">{c.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <Button variant="ghost" size="icon-sm" onClick={() => confirm(`Hapus kelas "${c.name}"?`) && deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending} className="text-destructive hover:bg-destructive/8 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                            {deleteMutation.isPending ? <ButtonSpinner className="w-3.5 h-3.5 text-destructive" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
