import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, deleteItem, getCategories } from '@/api/inventory';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Pencil, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const STORAGE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace('/api', '/storage');

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100 text-green-700',
    rusak_ringan: 'bg-yellow-100 text-yellow-700',
    rusak_berat:  'bg-red-100 text-red-700',
};

const CONDITION_LABEL: Record<string, string> = {
    baik:         'Baik',
    rusak_ringan: 'Rusak Ringan',
    rusak_berat:  'Rusak Berat',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse">
            <div className="aspect-video bg-neutral-200 dark:bg-neutral-800" />
            <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                <div className="h-3 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItemList() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const canManage = user?.role === 'guru' || user?.role === 'admin';

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['items', page, search, categoryId, condition],
        queryFn: () => getItems({
            page,
            search: search || undefined,
            category_id: categoryId ? Number(categoryId) : undefined,
            condition: condition || undefined,
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] });
            toast.success('Barang berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus barang. Mungkin masih ada peminjaman aktif.'),
    });

    function handleDelete(id: number, name: string) {
        if (confirm(`Yakin ingin menghapus "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Inventaris Barang</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {canManage ? 'Kelola seluruh barang inventaris TKJ' : 'Daftar barang inventaris TKJ'}
                    </p>
                </div>
                {canManage && (
                    <Link
                        to="/dashboard/items/create"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Barang
                    </Link>
                )}
            </div>

            {/* Filter bar */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative sm:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, merek, seri..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={e => { setCategoryId(e.target.value); setPage(1); }}
                        className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Kategori</option>
                        {categoriesData?.data?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={condition}
                        onChange={e => { setCondition(e.target.value); setPage(1); }}
                        className="text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Semua Kondisi</option>
                        <option value="baik">Baik</option>
                        <option value="rusak_ringan">Rusak Ringan</option>
                        <option value="rusak_berat">Rusak Berat</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                ) : data?.data?.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-neutral-400">
                        <Package className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Tidak ada barang yang ditemukan.</p>
                    </div>
                ) : (
                    data?.data?.map((item: any) => {
                        const conditionKey = typeof item.condition === 'string' ? item.condition : item.condition?.value ?? '';
                        const badgeCls = CONDITION_BADGE[conditionKey] ?? 'bg-neutral-100 text-neutral-600';
                        const conditionLabel = CONDITION_LABEL[conditionKey] ?? conditionKey;

                        return (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group"
                            >
                                {/* Image */}
                                <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img
                                            src={`${STORAGE_URL}/${item.image}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-neutral-300 dark:text-neutral-700">
                                            <Package className="w-8 h-8" />
                                        </div>
                                    )}
                                    {/* Stock badge */}
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shadow-sm ${item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.stock > 0 ? `Stok: ${item.stock}` : 'Habis'}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col gap-1">
                                    <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                                        {item.category?.name ?? '-'}
                                    </span>
                                    <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
                                        {item.name}
                                    </h3>
                                    {(item.brand || item.model) && (
                                        <p className="text-xs text-neutral-400">
                                            {[item.brand, item.model].filter(Boolean).join(' · ')}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800">
                                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badgeCls}`}>
                                            {conditionLabel}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            {item.stock}/{item.stock_total} unit
                                        </span>
                                    </div>
                                </div>

                                {/* Footer actions — guru/admin only */}
                                {canManage && (
                                    <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex justify-end gap-2">
                                        <Link
                                            to={`/dashboard/items/${item.id}/edit`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-40"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Hapus
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {data?.meta && data.meta.last_page > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-3 text-sm shadow-sm">
                    <span className="text-neutral-500">
                        Halaman {data.meta.current_page} dari {data.meta.last_page}
                        <span className="hidden sm:inline"> · {data.meta.total} barang</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPage(p => (p < data.meta.last_page ? p + 1 : p))}
                            disabled={page === data.meta.last_page}
                            className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
