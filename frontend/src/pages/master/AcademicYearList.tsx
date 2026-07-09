import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAcademicYears, createAcademicYear, updateAcademicYear, deleteAcademicYear } from '@/api/masterData';
import type { AcademicYear } from '@/api/masterData';
import { toast } from 'sonner';

const MAX_ACTIVE = 3;

export default function AcademicYearList() {
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['academic-years'],
        queryFn: getAcademicYears,
    });

    const years: AcademicYear[] = data?.data ?? [];
    const activeCount = years.filter(y => y.is_active).length;
    const atMaxActive = activeCount >= MAX_ACTIVE;

    const createMutation = useMutation({
        mutationFn: createAcademicYear,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Angkatan berhasil ditambahkan');
            setName('');
            setIsActive(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan Angkatan'),
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
        onError: (err: any) =>
            toast.error(err.response?.data?.message || 'Gagal menghapus Angkatan'),
    });

    function handleToggleActive(year: AcademicYear) {
        if (!year.is_active && atMaxActive) {
            toast.error(`Maksimal ${MAX_ACTIVE} angkatan aktif. Nonaktifkan salah satu terlebih dahulu.`);
            return;
        }
        updateMutation.mutate({ id: year.id, data: { is_active: !year.is_active } });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Angkatan</h2>
                {/* Indikator slot aktif */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-500">Aktif:</span>
                    {Array.from({ length: MAX_ACTIVE }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full border ${
                                i < activeCount
                                    ? 'bg-green-500 border-green-600'
                                    : 'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
                            }`}
                            title={i < activeCount ? 'Slot aktif terisi' : 'Slot kosong'}
                        />
                    ))}
                    <span className="text-xs text-neutral-500 ml-1">{activeCount}/{MAX_ACTIVE}</span>
                </div>
            </div>

            {/* Form tambah */}
            <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
                <h3 className="text-lg font-medium mb-4">Tambah Angkatan Baru</h3>
                <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Nama Angkatan <span className="text-neutral-400 font-normal">(contoh: 17 (2024))</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="17 (2024)"
                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                        />
                    </div>
                    <div className="flex items-center h-10 gap-2">
                        <input
                            type="checkbox"
                            checked={isActive}
                            disabled={!isActive && atMaxActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 disabled:opacity-40"
                            id="is_active_new"
                        />
                        <label
                            htmlFor="is_active_new"
                            className={`text-sm select-none ${!isActive && atMaxActive ? 'text-neutral-400 cursor-not-allowed' : 'text-neutral-900 dark:text-neutral-100'}`}
                        >
                            Jadikan Aktif
                            {!isActive && atMaxActive && (
                                <span className="ml-1 text-xs text-orange-500">(limit {MAX_ACTIVE})</span>
                            )}
                        </label>
                    </div>
                    <button
                        onClick={() => createMutation.mutate({ name, is_active: isActive })}
                        disabled={!name.trim() || createMutation.isPending}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama Angkatan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {isLoading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-neutral-500">Loading...</td>
                            </tr>
                        ) : years.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-neutral-400 text-sm">
                                    Belum ada angkatan. Tambahkan angkatan pertama.
                                </td>
                            </tr>
                        ) : (
                            years.map((year) => (
                                <tr key={year.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium">{year.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            year.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                        }`}>
                                            {year.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 space-x-3">
                                        <button
                                            onClick={() => handleToggleActive(year)}
                                            disabled={updateMutation.isPending}
                                            className={`text-sm font-medium disabled:opacity-40 ${
                                                year.is_active
                                                    ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400'
                                                    : atMaxActive
                                                        ? 'text-neutral-400 cursor-not-allowed'
                                                        : 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-400'
                                            }`}
                                        >
                                            {year.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Hapus angkatan "${year.name}"?`)) {
                                                    deleteMutation.mutate(year.id);
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

            {atMaxActive && (
                <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                    ⚠ Batas maksimal {MAX_ACTIVE} angkatan aktif tercapai. Nonaktifkan salah satu untuk mengaktifkan angkatan lain.
                </p>
            )}
        </div>
    );
}
