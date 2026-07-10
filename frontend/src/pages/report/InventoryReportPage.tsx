import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Search, RefreshCw, Filter, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInventoryReport, exportInventoryReport, type InventoryReportItem, type InventoryReportParams } from '@/api/report';
import { Button } from '@/components/ui/button';

const CONDITION_OPTIONS = [
    { value: '', label: 'Semua Kondisi' }, { value: 'baik', label: 'Baik' },
    { value: 'rusak_ringan', label: 'Rusak Ringan' }, { value: 'rusak_berat', label: 'Rusak Berat' },
];

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    rusak_ringan: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    rusak_berat:  'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

function StockBar({ stock, total }: { stock: number; total: number }) {
    const pct   = total > 0 ? Math.round((stock / total) * 100) : 0;
    const color = pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2 min-w-[90px]">
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div className={['h-full rounded-full transition-all duration-500', color].join(' ')} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">{stock}/{total}</span>
        </div>
    );
}

function Skeleton() {
    return <>{Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="border-b border-border/30">
            {[40,100,70,80,60,60,50].map((w, j) => (
                <td key={j} className="px-5 py-4"><div className="skeleton h-3.5 rounded-full" style={{ width: w + '%' }} /></td>
            ))}
        </tr>
    ))}</>;
}

function ReportRow({ row, index }: { row: InventoryReportItem; index: number }) {
    const isLow = row.stock <= row.stock_minimum;
    return (
        <tr className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150">
            <td className="px-5 py-3.5 text-xs text-muted-foreground text-center">{index}</td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                        {(row.brand || row.model) && <p className="text-xs text-muted-foreground">{[row.brand, row.model].filter(Boolean).join(' · ')}</p>}
                    </div>
                </div>
            </td>
            <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell">{row.category?.name ?? '-'}</td>
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                    <StockBar stock={row.stock} total={row.stock_total} />
                    {isLow && <span className="badge-pill text-[9px] bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">Menipis</span>}
                </div>
            </td>
            <td className="px-5 py-3.5 hidden md:table-cell">
                <span className={['badge-pill text-[10px]', CONDITION_BADGE[row.condition] ?? ''].join(' ')}>{row.condition_label}</span>
            </td>
            <td className="px-5 py-3.5 text-sm text-muted-foreground hidden lg:table-cell">{row.location ?? '-'}</td>
            <td className="px-5 py-3.5 text-right">
                <span className={['badge-pill text-[10px]', row.is_available ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'].join(' ')}>
                    {row.is_available ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
        </tr>
    );
}

export default function InventoryReportPage() {
    const [filters, setFilters] = useState<InventoryReportParams>({ per_page: 15, page: 1 });
    const [draft, setDraft] = useState({ category_id: '', condition: '' });
    const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['report-inventory', filters], queryFn: () => getInventoryReport(filters) });

    function apply() { setFilters(p => ({ ...p, page: 1, category_id: draft.category_id ? Number(draft.category_id) : undefined, condition: draft.condition || undefined })); }
    function reset() { setDraft({ category_id: '', condition: '' }); setFilters({ per_page: 15, page: 1 }); }

    const rows       = data?.data ?? [];
    const meta       = data?.meta;
    const categories = data?.categories ?? [];

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Inventaris</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Daftar seluruh barang beserta kondisi stok</p>
                </div>
                <Button onClick={() => exportInventoryReport({ category_id: draft.category_id ? Number(draft.category_id) : undefined, condition: draft.condition || undefined })} className="gap-2 flex-shrink-0 bg-sky-600 hover:bg-sky-700">
                    <FileDown className="w-4 h-4" /> Export Excel
                </Button>
            </div>

            <div className="glass-card px-5 py-4 animate-fade-up delay-75">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Filter</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Kategori</label>
                        <select value={draft.category_id} onChange={e => setDraft(p => ({ ...p, category_id: e.target.value }))} className="input-ios appearance-none cursor-pointer">
                            <option value="">Semua Kategori</option>
                            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Kondisi</label>
                        <select value={draft.condition} onChange={e => setDraft(p => ({ ...p, condition: e.target.value }))} className="input-ios appearance-none cursor-pointer">
                            {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select></div>
                    <div className="sm:col-span-2 flex items-end gap-2">
                        <Button onClick={apply} className="flex-1 gap-1.5 bg-sky-600 hover:bg-sky-700"><Search className="w-3.5 h-3.5" /> Terapkan</Button>
                        <Button variant="outline" size="icon" onClick={reset} title="Reset"><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-150">
                {meta && <div className="px-5 py-3.5 border-b border-border/40"><p className="text-xs text-muted-foreground">Total <span className="font-semibold text-foreground">{meta.total}</span> barang</p></div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/50">
                            {['No','Nama Barang','Kategori','Stok','Kondisi','Lokasi','Status'].map((h, i) => (
                                <th key={h} className={['px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest', i === 0 ? 'text-center w-10' : i === 6 ? 'text-right' : 'text-left', i === 2 ? 'hidden sm:table-cell' : i === 4 ? 'hidden md:table-cell' : i === 5 ? 'hidden lg:table-cell' : ''].join(' ')}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {isLoading ? <Skeleton /> : isError ? (
                                <tr><td colSpan={7} className="px-5 py-12 text-center"><div className="space-y-3"><p className="text-sm text-destructive">Gagal memuat data.</p><Button size="sm" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /> Coba Lagi</Button></div></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><Package className="w-8 h-8 opacity-30" /><p className="text-sm">Tidak ada data yang sesuai filter.</p></div></td></tr>
                            ) : rows.map((row, idx) => <ReportRow key={row.id} row={row} index={(meta ? (meta.current_page - 1) * meta.per_page : 0) + idx + 1} />)}
                        </tbody>
                    </table>
                </div>
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">Hal. {meta.current_page} dari {meta.last_page}</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon-sm" onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) - 1 }))} disabled={meta.current_page === 1}><ChevronLeft className="w-4 h-4" /></Button>
                            <Button variant="outline" size="icon-sm" onClick={() => setFilters(p => ({ ...p, page: (p.page ?? 1) + 1 }))} disabled={meta.current_page === meta.last_page}><ChevronRight className="w-4 h-4" /></Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
