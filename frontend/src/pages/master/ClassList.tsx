import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClasses, createClass, deleteClass, getAcademicYears } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';

/**
 * Generate nama kelas otomatis: "{nama_angkatan} TKJ {nomor}"
 * Contoh: angkatan "17 (2024)" + nomor 1 → "17 (2024) TKJ 1"
 */
function buildClassName(yearName: string, number: number): string {
    return `${yearName} TKJ ${number}`;
}

export default function ClassList() {
    const [academicYearId, setAcademicYearId] = useState<number | ''>('');
    const [classNumber, setClassNumber] = useState<number | ''>('');
    const [filterYearId, setFilterYearId] = useState<number | ''>('');
    const queryClient = useQueryClient();

    const { data: yearsData } = useQuery({
        queryKey: ['academic-years'],
        queryFn: getAcademicYears,
    });

    const { data: classes, isLoading } = useQuery({
        queryKey: ['classes', filterYearId],
        queryFn: () => getClasses(filterYearId ? { academic_year_id: filterYearId as number } : undefined),
    });

    const years: AcademicYear[] = yearsData?.data ?? [];
    const selectedYear = years.find(y => y.id === academicYearId);

    // Preview nama otomatis
    const previewName =
        selectedYear && classNumber !== ''
            ? buildClassName(selectedYear.name, classNumber as number)
            : '';

    const createMutation = useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success('Kelas berhasil ditambahkan');
            setClassNumber('');
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.message || 'Gagal menambahkan Kelas'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            toast.success('Kelas berhasil dihapus');
        },
        onError: (err: any) =>
            toast.error(err.response?.data?.message || 'Gagal menghapus Kelas'),
    });

    function handleAdd() {
        if (!academicYearId || classNumber === '' || !selectedYear) return;
        createMutation.mutate({
            name: buildClassName(selectedYear.name, classNumber as number),
            academic_year_id: academicYearId as number,
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Master Kelas</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Filter:</span>
                    <select
                        value={filterYearId}
                        onChange={e => setFilterYearId(e.target.value ? Number(e.target.value) : '')}
                        className="border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-1.5 text-sm dark:bg-neutral-800"
                    >
                        <option value="">Semua Angkatan</option>
                        {years.map(y => (
                            <option key={y.id} value={y.id}>
                                {y.name}{y.is_active ? ' (Aktif)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Form tambah */}
            <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
                <h3 className="text-lg font-medium mb-4">Tambah Kelas Baru</h3>
                <div className="flex gap-4 items-end flex-wrap">
                    {/* Pilih angkatan */}
                    <div className="w-48">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Angkatan
                        </label>
                        <select
                            value={academicYearId}
                            onChange={e => setAcademicYearId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                        >
                            <option value="">Pilih Angkatan</option>
                            {years.map(y => (
                                <option key={y.id} value={y.id}>{y.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nomor kelas */}
                    <div className="w-28">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            No. Kelas
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={9}
                            value={classNumber}
                            onChange={e => setClassNumber(e.target.value ? Number(e.target.value) : '')}
                            placeholder="1"
                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                        />
                    </div>

                    {/* Preview nama otomatis */}
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Nama Kelas <span className="font-normal text-neutral-400">(otomatis)</span>
                        </label>
                        <div className={`w-full border rounded-md px-3 py-2 text-sm h-[42px] flex items-center ${
                            previewName
                                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-400 italic'
                        }`}>
                            {previewName || 'Pilih angkatan & nomor dulu…'}
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={!previewName || createMutation.isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 h-[42px]"
                    >
                        {createMutation.isPending ? 'Menyimpan...' : 'Tambah'}
                    </button>
                </div>
            </div>

            {/* Tabel */}
            <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                    <thead className="bg-neutral-50 dark:bg-neutral-950">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Angkatan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama Kelas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-neutral-500">Loading...</td>
                            </tr>
                        ) : classes?.data?.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-neutral-400 text-sm">
                                    Tidak ada data kelas.
                                </td>
                            </tr>
                        ) : (
                            classes?.data?.map(c => (
                                <tr key={c.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-neutral-500">
                                        {c.academic_year?.name}
                                        {c.academic_year?.is_active && (
                                            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-semibold rounded-full">
                                                Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{c.name}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => {
                                                if (confirm(`Hapus kelas "${c.name}"?`)) {
                                                    deleteMutation.mutate(c.id);
                                                }
                                            }}
                                            disabled={deleteMutation.isPending}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 text-sm font-medium disabled:opacity-40"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
