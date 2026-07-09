import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, deleteItem, getCategories } from '@/api/inventory';
import type { Item } from '@/api/inventory';
import { getStockConditions } from '@/api/stockCondition';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import AdjustConditionModal from '@/components/inventory/AdjustConditionModal';
import { Button } from '@/components/ui/button';

const STORAGE_URL = (import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage').replace(/\/+$/, '');

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    rusak_ringan: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    rusak_berat:  'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

const CONDITION_LABEL: Record<string, string> = {
    baik:         'Baik',
    rusak_ringan: 'Rusak Ringan',
    rusak_berat:  'Rusak Berat',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="glass-card overflow-hidden">
            <div className="aspect-video skeleton" />
            <div className="p-4 space-y-2.5">
                <div className="skeleton h-3 w-16 rounded-full" />
                <div className="skeleton h-4 w-3/4 rounded-full" />
                <div className="skeleton h-3 w-1/2 rounded-full" />
                <div className="skeleton h-8 w-full rounded-2xl mt-3" />
            </div>
        </div>
    );
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, canManage, isAdmin, onDelete }: {
    item: any;
    canManage: boolean;
    isAdmin: boolean;
    onDelete: (id: number, name: string) => void;
}) {
    const conditionKey   = typeof item.condition === 'string' ? item.condition : item.condition?.value ?? '';
    const badgeCls       = CONDITION_BADGE[conditionKey] ?? 'bg-muted text-muted-foreground';
    const conditionLabel = CONDITION_LABEL[conditionKey] ?? conditionKey;
    const isLowStock     = item.stock <= item.stock_minimum && item.stock > 0;
    const isOutOfStock   = item.stock === 0;

    return (
        <div className={[
            'glass-card overflow-hidden flex flex-col group',
            'hover:shadow-float hover:-translate-y-1 transition-all duration-300 ease-spring',
            'animate-fade-up',
        ].join(' ')}>
            {/* Image */}
            <div className="relative aspect-video bg-accent overflow-hidden flex-shrink-0">
                {item.image ? (
                    <img
                        src={`${STORAGE_URL}/${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-spring"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30">
                        <Package className="w-10 h-10" />
                    </div>
                )}

                {/* Stock overlay badge */}
                <div className="absolute top-2 left-2">
                    <span className={[
                        'badge-pill text-[10px] shadow-float-sm',
                        isOutOfStock
                            ? 'bg-red-100/90    text-red-700    dark:bg-red-900/60    dark:text-red-300'
                            : isLowStock
                            ? 'bg-amber-100/90  text-amber-700  dark:bg-amber-900/60  dark:text-amber-300'
                            : 'bg-green-100/90  text-green-700  dark:bg-green-900/60  dark:text-green-300',
                    ].join(' ')}>
                        {isOutOfStock ? 'Habis' : `Stok: ${item.stock}`}
                    </span>
                </div>

                {/* Low stock warning icon */}
                {isLowStock && !isOutOfStock && (
                    <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-amber-100/90 dark:bg-amber-900/60 flex items-center justify-center">
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wide truncate">
                    {item.category?.name ?? '—'}
                </span>
                <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                    {item.name}
                </h3>
                {(item.brand || item.model) && (
                    <p className="text-xs text-muted-foreground truncate">
                        {[item.brand, item.model].filter(Boolean).join(' · ')}
                    </p>
                )}

                {/* Divider + meta row */}
                <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className={['badge-pill text-[10px]', badgeCls].join(' ')}>
                        {conditionLabel}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                        {item.stock}/{item.stock_total} unit
                    </span>
                </div>
            </div>

            {/* Footer actions */}
            {canManage && (
                <div className="px-3 pb-3 pt-0 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                        <Link to={`/dashboard/items/${item.id}/edit`}>
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                        </Link>
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDelete(item.id, item.name)}
                            className="text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15 hover:text-destructive flex-shrink-0"
                            aria-label={`Hapus ${item.name}`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ meta, page, setPage }: { meta: any; page: number; setPage: (p: number) => void }) {
    if (!meta || meta.last_page <= 1) return null;

    return (
        <div className="glass-card px-5 py-3.5 flex items-center justify-between text-sm animate-fade-up">
            <span className="text-muted-foreground text-xs">
                Halaman <span className="font-semibold text-foreground">{meta.current_page}</span> dari{' '}
                <span className="font-semibold text-foreground">{meta.last_page}</span>
                <span className="hidden sm:inline text-muted-foreground"> · {meta.total} barang</span>
            </span>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(Math.max(page - 1, 1))}
                    disabled={page === 1}
                    aria-label="Halaman sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPage(page < meta.last_page ? page + 1 : page)}
                    disabled={page === meta.last_page}
                    aria-label="Halaman berikutnya"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
    return (
        <div className="col-span-full py-20 flex flex-col items-center gap-3 text-muted-foreground animate-spring-in">
            <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm">{message}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ItemList() {
    const [activeTab,   setActiveTab]   = useState<'items' | 'stock-conditions'>('items');
    const [page,        setPage]        = useState(1);
    const [search,      setSearch]      = useState('');
    const [categoryId,  setCategoryId]  = useState('');
    const [condition,   setCondition]   = useState('');
    const [scPage,      setScPage]      = useState(1);
    const [scSearch,    setScSearch]    = useState('');
    const [scHasDamage, setScHasDamage] = useState(false);
    const [adjustItem,  setAdjustItem]  = useState<Item | null>(null);

    const queryClient = useQueryClient();
    const user        = useAuthStore(state => state.user);
    const canManage   = user?.role === 'guru' || user?.role === 'admin';
    const isAdmin     = user?.role === 'admin';

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['items', page, search, categoryId, condition],
        queryFn: () => getItems({
            page,
            search:      search      || undefined,
            category_id: categoryId  ? Number(categoryId) : undefined,
            condition:   condition   || undefined,
        }),
    });

    const { data: scData, isLoading: scLoading } = useQuery({
        queryKey: ['stock-conditions', scPage, scSearch, scHasDamage],
        queryFn: () => getStockConditions({
            page:       scPage,
            search:     scSearch    || undefined,
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

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventaris Barang</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {canManage ? 'Kelola seluruh barang inventaris TKJ' : 'Daftar barang inventaris TKJ'}
                    </p>
                </div>
                {canManage && activeTab === 'items' && (
                    <Button asChild size="default" className="gap-2 flex-shrink-0">
                        <Link to="/dashboard/items/create">
                            <Plus className="w-4 h-4" />
                            Tambah Barang
                        </Link>
                    </Button>
                )}
            </div>

            {/* ── iOS Segmented Control ── */}
            {canManage && (
                <div className="segmented-control w-fit animate-fade-up delay-75">
                    {(['items', 'stock-conditions'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={['segmented-control-item', activeTab === tab ? 'active' : ''].join(' ')}
                        >
                            {tab === 'items' ? 'Semua Barang' : 'Kondisi Stok'}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Tab: Semua Barang                                               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'items' && (
                <>
                    {/* Filter bar */}
                    <div className="glass-card px-5 py-4 animate-fade-up delay-100">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, merek, seri..."
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    className="input-ios pl-10"
                                />
                            </div>

                            {/* Category filter */}
                            <select
                                value={categoryId}
                                onChange={e => { setCategoryId(e.target.value); setPage(1); }}
                                className="input-ios appearance-none cursor-pointer"
                            >
                                <option value="">Semua Kategori</option>
                                {categoriesData?.data?.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>

                            {/* Condition filter */}
                            <select
                                value={condition}
                                onChange={e => { setCondition(e.target.value); setPage(1); }}
                                className="input-ios appearance-none cursor-pointer"
                            >
                                <option value="">Semua Kondisi</option>
                                <option value="baik">Baik</option>
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                            </select>
                        </div>
                    </div>

                    {/* Card Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {isLoading
                            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                            : data?.data?.length === 0
                            ? <EmptyState message="Tidak ada barang yang ditemukan." />
                            : data?.data?.map((item: any, i: number) => (
                                <div key={item.id} style={{ animationDelay: `${(i % 8) * 40}ms` }}>
                                    <ItemCard
                                        item={item}
                                        canManage={canManage}
                                        isAdmin={isAdmin}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))
                        }
                    </div>

                    <Pagination meta={data?.meta} page={page} setPage={setPage} />
                </>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Tab: Kondisi Stok                                               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'stock-conditions' && (
                <>
                    {/* Filter bar */}
                    <div className="glass-card px-5 py-4 animate-fade-up delay-75">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, merek..."
                                    value={scSearch}
                                    onChange={e => { setScSearch(e.target.value); setScPage(1); }}
                                    className="input-ios pl-10"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-4 py-2.5 rounded-2xl hover:bg-accent transition-colors duration-150">
                                <input
                                    type="checkbox"
                                    checked={scHasDamage}
                                    onChange={e => { setScHasDamage(e.target.checked); setScPage(1); }}
                                    className="rounded accent-primary w-4 h-4"
                                />
                                <span className="text-foreground/70 font-medium">Ada kerusakan / hilang</span>
                            </label>
                        </div>
                    </div>

                    {/* Stock condition table */}
                    <div className="glass-card overflow-hidden animate-fade-up delay-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-left">Barang</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Total</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-green-600 dark:text-green-400  uppercase tracking-widest text-center">Baik</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-amber-600 dark:text-amber-400  uppercase tracking-widest text-center">Rusak ∙ R</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-red-600   dark:text-red-400    uppercase tracking-widest text-center">Rusak ∙ B</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Hilang</th>
                                        <th className="px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Kondisi</th>
                                        {isAdmin && <th className="px-4 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Aksi</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {scLoading ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 7} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                                Memuat...
                                            </td>
                                        </tr>
                                    ) : scData?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 7} className="px-5 py-16 text-center">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Package className="w-8 h-8 opacity-30" />
                                                    <p className="text-sm">Tidak ada data.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : scData?.data?.map((item: Item) => {
                                        const conditionKey   = typeof item.condition === 'string' ? item.condition : (item.condition as { value: string })?.value ?? '';
                                        const hasDamage      = item.stock_rusak_ringan > 0 || item.stock_rusak_berat > 0 || item.stock_hilang > 0;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150"
                                            >
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        {hasDamage && (
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                                                            {(item.brand || item.model) && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {[item.brand, item.model].filter(Boolean).join(' · ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-center font-bold text-foreground">{item.stock}</td>
                                                <td className="px-4 py-3.5 text-center font-semibold text-green-600 dark:text-green-400">{item.stock_baik}</td>
                                                <td className="px-4 py-3.5 text-center font-semibold text-amber-600 dark:text-amber-400">{item.stock_rusak_ringan}</td>
                                                <td className="px-4 py-3.5 text-center font-semibold text-red-600   dark:text-red-400">{item.stock_rusak_berat}</td>
                                                <td className="px-4 py-3.5 text-center font-semibold text-muted-foreground">{item.stock_hilang}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={['badge-pill text-[10px]', CONDITION_BADGE[conditionKey] ?? 'bg-muted text-muted-foreground'].join(' ')}>
                                                        {CONDITION_LABEL[conditionKey] ?? conditionKey}
                                                    </span>
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-4 py-3.5 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => setAdjustItem(item)}
                                                            title="Koreksi Kondisi"
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            <SlidersHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination inside table card */}
                        {scData?.meta && scData.meta.last_page > 1 && (
                            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40 text-sm">
                                <span className="text-xs text-muted-foreground">
                                    Halaman {scData.meta.current_page} dari {scData.meta.last_page} · {scData.meta.total} barang
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon-sm" onClick={() => setScPage(p => Math.max(p - 1, 1))} disabled={scPage === 1}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon-sm" onClick={() => setScPage(p => p < scData.meta.last_page ? p + 1 : p)} disabled={scPage === scData.meta.last_page}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

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
