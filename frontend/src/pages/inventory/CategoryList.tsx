import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/inventory';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Tag, Pencil, Trash2, Plus, X, Check, FolderOpen } from 'lucide-react';
import { Button, ButtonSpinner } from '@/components/ui/button';

export default function CategoryList() {
    const [name,        setName]        = useState('');
    const [description, setDescription] = useState('');
    const [editingId,   setEditingId]   = useState<number | null>(null);
    const [showForm,    setShowForm]    = useState(false);

    const queryClient = useQueryClient();
    const user        = useAuthStore(state => state.user);
    const canManage   = user?.role === 'guru' || user?.role === 'admin';

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
        // Scroll to form
        setTimeout(() => document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
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

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Kategori Inventaris</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {canManage ? 'Kelola kategori barang inventaris' : 'Daftar kategori barang inventaris'}
                    </p>
                </div>
                {canManage && !showForm && (
                    <Button onClick={() => setShowForm(true)} className="gap-2 flex-shrink-0 animate-fade-up delay-75">
                        <Plus className="w-4 h-4" />
                        Tambah Kategori
                    </Button>
                )}
            </div>

            {/* ── Inline Form ── */}
            {canManage && showForm && (
                <div
                    id="category-form"
                    className="glass-card px-5 py-5 animate-spring-in"
                >
                    {/* Form header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                <Tag className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm text-foreground">
                                {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                            </h3>
                        </div>
                        <button
                            onClick={resetForm}
                            className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.93]"
                            aria-label="Tutup form"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Nama Kategori <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Contoh: Perangkat Jaringan"
                                className="input-ios"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Deskripsi
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Deskripsi opsional"
                                className="input-ios"
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={resetForm}>
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!name.trim() || isMutating}
                            loading={isMutating}
                            className="gap-1.5"
                        >
                            {!isMutating && <Check className="w-3.5 h-3.5" />}
                            {isMutating ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah'}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="glass rounded-3xl animate-fade-up delay-100">

                {/* Table meta */}
                {data?.data && (
                    <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            Total <span className="font-semibold text-foreground">{data.data.length}</span> kategori
                        </p>
                    </div>
                )}

                {/* overflow-x untuk horizontal scroll mobile */}
                <div className="overflow-x-auto rounded-b-3xl">
                    <table className="w-full text-sm min-w-[480px]">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Nama Kategori</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden sm:table-cell">Slug</th>
                                <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left hidden md:table-cell">Deskripsi</th>
                                {canManage && (
                                    <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/30" style={{ animationDelay: `${i * 50}ms` }}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="skeleton w-8 h-8 rounded-xl flex-shrink-0" />
                                                <div className="skeleton h-4 w-28 rounded-full" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 hidden sm:table-cell"><div className="skeleton h-3 w-24 rounded-full" /></td>
                                        <td className="px-5 py-4 hidden md:table-cell"><div className="skeleton h-3 w-40 rounded-full" /></td>
                                        {canManage && <td className="px-5 py-4" />}
                                    </tr>
                                ))
                            ) : data?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 4 : 3} className="px-5 py-20">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-spring-in">
                                            <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center">
                                                <FolderOpen className="w-7 h-7 opacity-40" />
                                            </div>
                                            <p className="text-sm">Belum ada kategori.</p>
                                            {canManage && (
                                                <Button size="sm" variant="outline" onClick={() => setShowForm(true)} className="gap-1.5 mt-1">
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Tambah Sekarang
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data?.data?.map((cat: any, i: number) => (
                                    <tr
                                        key={cat.id}
                                        className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 animate-fade-up group"
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        {/* Name */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                                                    <Tag className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="font-semibold text-foreground">{cat.name}</span>
                                            </div>
                                        </td>

                                        {/* Slug */}
                                        <td className="px-5 py-3.5 hidden sm:table-cell">
                                            <span className="font-mono text-xs text-muted-foreground bg-accent/60 px-2 py-1 rounded-lg">
                                                {cat.slug}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">
                                            {cat.description || <span className="text-muted-foreground/40">—</span>}
                                        </td>

                                        {/* Actions — always visible on mobile, hover-reveal on desktop */}
                                        {canManage && (
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex justify-center gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleEdit(cat)}
                                                        className="text-primary hover:bg-primary/8 dark:hover:bg-primary/15 hover:text-primary  transition-all duration-150"
                                                        aria-label={`Edit ${cat.name}`}
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => {
                                                            if (confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
                                                                deleteMutation.mutate(cat.id);
                                                            }
                                                        }}
                                                        disabled={deleteMutation.isPending}
                                                        className="text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15 hover:text-destructive  transition-all duration-150 disabled:opacity-30"
                                                        aria-label={`Hapus ${cat.name}`}
                                                        title="Hapus"
                                                    >
                                                        {deleteMutation.isPending ? (
                                                            <ButtonSpinner className="w-3.5 h-3.5 text-destructive" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </Button>
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
