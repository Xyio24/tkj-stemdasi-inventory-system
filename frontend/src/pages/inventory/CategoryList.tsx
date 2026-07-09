import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/inventory';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Tag, Pencil, Trash2, Plus, X, Check } from 'lucide-react';

export default function CategoryList() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const canManage = user?.role === 'guru' || user?.role === 'admin';

    const { data, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Kategori berhasil ditambahkan');
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menambahkan kategori'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Kategori berhasil diperbarui');
            resetForm();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal memperbarui kategori'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Kategori berhasil dihapus');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Gagal menghapus kategori'),
    });

    function resetForm() {
        setName('');
        setDescription('');
        setEditingId(null);
        setShowForm(false);
    }

    function handleEdit(cat: any) {
        setEditingId(cat.id);
        setName(cat.name);
        setDescription(cat.description ?? '');
        setShowForm(true);
    }

    function handleSubmit() {
        if (!name.trim()) return;
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: { name, description } });
        } else {
            createMutation.mutate({ name, description });
        }
    }

    const isMutating = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Kategori Inventaris</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {canManage ? 'Kelola kategori barang inventaris' : 'Daftar kategori barang inventaris'}
                    </p>
                </div>
                {canManage && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Kategori
                    </button>
                )}
            </div>

            {/* Form — guru/admin only */}
            {canManage && showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                            {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                                Nama Kategori <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Contoh: Perangkat Jaringan"
                                className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                                Deskripsi
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Deskripsi opsional"
                                className="w-full text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!name.trim() || isMutating}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            {isMutating ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah'}
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                {data?.data && (
                    <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 text-sm text-neutral-500">
                        Total: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{data.data.length}</span> kategori
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">
                                <th className="px-5 py-3 text-left font-medium">Nama Kategori</th>
                                <th className="px-5 py-3 text-left font-medium">Slug</th>
                                <th className="px-5 py-3 text-left font-medium">Deskripsi</th>
                                {canManage && (
                                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-5 py-3.5"><div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                                        <td className="px-5 py-3.5"><div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                                        <td className="px-5 py-3.5"><div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" /></td>
                                        {canManage && <td className="px-5 py-3.5" />}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 4 : 3} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-neutral-400">
                                            <Tag className="w-8 h-8 opacity-30" />
                                            <span className="text-sm">Belum ada kategori.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((cat: any) => (
                                    <tr key={cat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                                    <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-neutral-400">{cat.slug}</td>
                                        <td className="px-5 py-3.5 text-neutral-500 text-sm">
                                            {cat.description ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                                        </td>
                                        {canManage && (
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleEdit(cat)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
                                                                deleteMutation.mutate(cat.id);
                                                            }
                                                        }}
                                                        disabled={deleteMutation.isPending}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-40"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        )}
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
