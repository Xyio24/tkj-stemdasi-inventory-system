import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, deleteItem, getCategories } from '@/api/inventory';
import type { Item } from '@/api/inventory';
import { getStockConditions } from '@/api/stockCondition';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import AdjustConditionModal from '@/components/inventory/AdjustConditionModal';

const STORAGE_URL = (import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage').replace(/\/+$/, '');

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
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden animate-pulse shadow-sm">
            <div className="aspect-video bg-neutral-200" />
            <div className="p-4 space-y-2">
                <div className="h-3 w-16 bg-neutral-200 rounded-full" />
                <div className="h-4 w-3/4 bg-neutral-200 rounded-full" />
                <div className="h-3 w-1/2 bg-neutral-200 rounded-full" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItemList() {
    const [activeTab, setActiveTab] = useState<'items' | 'stock-conditions'>('items');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [condition, setCondition] = useState('');
    // Stock conditions tab state
    const [scPage, setScPage] = useState(1);
    const [scSearch, setScSearch] = useState('');
    const [scHasDamage, setScHasDamage] = useState(false);
    const [adjustItem, setAdjustItem] = useState<Item | null>(null);

    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const canManage = user?.role === 'guru' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

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

    const { data: scData, isLoading: scLoading } = useQuery({
        queryKey: ['stock-conditions', scPage, scSearch, scHasDamage],
        queryFn: () => getStockConditions({
            page: scPage,
            search: scSearch || undefined,
            has_damage: scHasDamage || undefined,
        }),
        enabled: activeTab === 'stock-conditions',
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
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inventaris Barang</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {canManage ? 'Kelola seluruh barang inventaris TKJ' : 'Daftar barang inventaris TKJ'}
                    </p>
                </div>
                {canManage && activeTab === 'items' && (
                    <Link
                        to="/dashboard/items/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 ease-out active:scale-[0.97] shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Barang
                    </Link>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('items')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'items' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                >
                    Semua Barang
                </button>
                {canManage && (
                    <button
                        onClick={() => setActiveTab('stock-conditions')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stock-conditions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                    >
                        Kondisi Stok
                    </button>
                )}
            </div>

            {/* ── Tab: Semua Barang ─────────────────────────────────────────── */}
            {activeTab === 'items' && (<>
            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative sm:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, merek, seri..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-9 pr-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={e => { setCategoryId(e.target.value); setPage(1); }}
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
                    >
                        <option value="">Semua Kategori</option>
                        {categoriesData?.data?.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={condition}
                        onChange={e => { setCondition(e.target.value); setPage(1); }}
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
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
                    <div className="col-span-full py-16 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
                            <Package className="w-8 h-8 text-neutral-400" />
                        </div>
                        <p className="text-sm text-neutral-400">Tidak ada barang yang ditemukan.</p>
                    </div>
                ) : (
                    data?.data?.map((item: any) => {
                        const conditionKey = typeof item.condition === 'string' ? item.condition : item.condition?.value ?? '';
                        const badgeCls = CONDITION_BADGE[conditionKey] ?? 'bg-neutral-100 text-neutral-600';
                        const conditionLabel = CONDITION_LABEL[conditionKey] ?? conditionKey;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                                {/* Image */}
                                <div className="aspect-video bg-neutral-100 relative overflow-hidden flex-shrink-0">
                                    {item.image ? (
                                        <img
                                            src={`${STORAGE_URL}/${item.image}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-neutral-300">
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
                                    <span className="text-[11px] font-medium text-indigo-600">
                                        {item.category?.name ?? '-'}
                                    </span>
                                    <h3 className="font-semibold text-sm text-neutral-900 leading-snug line-clamp-2">
                                        {item.name}
                                    </h3>
                                    {(item.brand || item.model) && (
                                        <p className="text-xs text-neutral-400">
                                            {[item.brand, item.model].filter(Boolean).join(' · ')}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-neutral-100">
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeCls}`}>
                                            {conditionLabel}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            {item.stock}/{item.stock_total} unit
                                        </span>
                                    </div>
                                </div>

                                {/* Footer actions — guru/admin only */}
                                {canManage && (
                                    <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-2">
                                        <Link
                                            to={`/dashboard/items/${item.id}/edit`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 ease-out active:scale-[0.97]"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            disabled={deleteMutation.isPending}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-40"
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
                <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-2xl px-6 py-4 text-sm shadow-sm">
                    <span className="text-neutral-500">
                        Halaman {data.meta.current_page} dari {data.meta.last_page}
                        <span className="hidden sm:inline"> · {data.meta.total} barang</span>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 border border-neutral-200 rounded-xl text-sm disabled:opacity-40 hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]"
                        >
                            ← Prev
                        </button>
                        <button
                            onClick={() => setPage(p => (p < data.meta.last_page ? p + 1 : p))}
                            disabled={page === data.meta.last_page}
                            className="px-3 py-1.5 border border-neutral-200 rounded-xl text-sm disabled:opacity-40 hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
            </>)}

            {/* ── Tab: Kondisi Stok ─────────────────────────────────────────── */}
            {activeTab === 'stock-conditions' && (<>
            {/* Filter bar */}
            <div className="bg-white rounded-2xl border border-neutral-200 px-6 py-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, merek..."
                            value={scSearch}
                            onChange={e => { setScSearch(e.target.value); setScPage(1); }}
                            className="w-full pl-9 pr-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={scHasDamage}
                            onChange={e => { setScHasDamage(e.target.checked); setScPage(1); }}
                            className="rounded accent-indigo-600"
                        />
                        <span className="text-neutral-600">Hanya yang ada kerusakan / hilang</span>
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Barang</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Total Stok</th>
                                <th className="px-6 py-3 text-xs font-semibold text-green-700 uppercase tracking-wider text-center">Baik</th>
                                <th className="px-6 py-3 text-xs font-semibold text-yellow-700 uppercase tracking-wider text-center">Rusak Ringan</th>
                                <th className="px-6 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider text-center">Rusak Berat</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Hilang</th>
                                <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Kondisi</th>
                                {isAdmin && <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {scLoading ? (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-neutral-400">Loading...</td></tr>
                            ) : scData?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-4">
                                        <div className="py-16 text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-neutral-100 mx-auto mb-4 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-neutral-400" />
                                            </div>
                                            <p className="text-sm text-neutral-400">Tidak ada data.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : scData?.data?.map((item: Item) => {
                                const conditionKey = typeof item.condition === 'string' ? item.condition : (item.condition as { value: string })?.value ?? '';
                                const BADGE: Record<string, string> = {
                                    baik: 'bg-green-100 text-green-700',
                                    rusak_ringan: 'bg-yellow-100 text-yellow-700',
                                    rusak_berat: 'bg-red-100 text-red-700',
                                };
                                const LABEL: Record<string, string> = {
                                    baik: 'Baik',
                                    rusak_ringan: 'Rusak Ringan',
                                    rusak_berat: 'Rusak Berat',
                                };
                                const hasDamage = item.stock_rusak_ringan > 0 || item.stock_rusak_berat > 0 || item.stock_hilang > 0;
                                return (
                                    <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                {hasDamage && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                                                <div>
                                                    <div className="font-medium text-neutral-900">{item.name}</div>
                                                    {(item.brand || item.model) && (
                                                        <div className="text-xs text-neutral-400">{[item.brand, item.model].filter(Boolean).join(' · ')}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center font-semibold">{item.stock}</td>
                                        <td className="px-6 py-4 text-sm text-center text-green-700 font-medium">{item.stock_baik}</td>
                                        <td className="px-6 py-4 text-sm text-center text-yellow-700 font-medium">{item.stock_rusak_ringan}</td>
                                        <td className="px-6 py-4 text-sm text-center text-red-700 font-medium">{item.stock_rusak_berat}</td>
                                        <td className="px-6 py-4 text-sm text-center text-neutral-500 font-medium">{item.stock_hilang}</td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[conditionKey] ?? 'bg-neutral-100 text-neutral-600'}`}>
                                                {LABEL[conditionKey] ?? conditionKey}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-sm text-right">
                                                <button
                                                    onClick={() => setAdjustItem(item)}
                                                    className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all duration-150 active:scale-[0.95]"
                                                    title="Koreksi Kondisi"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {scData?.meta && scData.meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 text-sm">
                        <span className="text-neutral-500">
                            Halaman {scData.meta.current_page} dari {scData.meta.last_page} · {scData.meta.total} barang
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setScPage(p => Math.max(p - 1, 1))} disabled={scPage === 1} className="px-3 py-1.5 border border-neutral-200 rounded-xl disabled:opacity-40 hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]">← Prev</button>
                            <button onClick={() => setScPage(p => p < scData.meta.last_page ? p + 1 : p)} disabled={scPage === scData.meta.last_page} className="px-3 py-1.5 border border-neutral-200 rounded-xl disabled:opacity-40 hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]">Next →</button>
                        </div>
                    </div>
                )}
            </div>
            </>)}

            {/* Adjust Condition Modal */}
            {adjustItem && (
                <AdjustConditionModal
                    item={adjustItem}
                    isOpen={!!adjustItem}
                    onClose={() => setAdjustItem(null)}
                />
            )}
        </div>
    );
}
