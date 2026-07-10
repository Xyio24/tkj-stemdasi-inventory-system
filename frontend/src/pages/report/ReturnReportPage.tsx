import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Search, RefreshCw, Filter, FileText, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getReturnReport, exportReturnReport, type ReturnReportItem, type ReturnReportParams } from '@/api/report';
import { Button } from '@/components/ui/button';

const CONDITION_BADGE: Record<string, string> = {
    baik:         'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    rusak_ringan: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
    rusak_berat:  'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400',
};

function fmtDate(d?: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d?: string | null) {
    if (!d) return '-';
    return new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Skeleton() {
    return <>{Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="border-b border-border/30">
            {[40,80,100,70,70,80,80].map((w, j) => (
                <td key={j} className="px-5 py-4"><div className="skeleton h-3.5 rounded-full" style={{ width: w + '%' }} /></td>
            ))}
        </tr>
    ))}</>;
}

function ReportRow({ row, index }: { row: ReturnReportItem; index: number }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <tr className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-150 cursor-pointer group" onClick={() => setOpen(o => !o)}>
                <td className="px-5 py-3.5 text-xs text-muted-foreground text-center">{index}</td>
                <td className="px-5 py-3.5"><span className="font-mono text-xs font-semibold text-primary">{row.code}</span></td>
                <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{row.user?.name ?? '-'}</p>
                    {row.user?.nis_nip && <p className="text-xs text-muted-foreground">{row.user.nis_nip}</p>}
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden sm:table-cell whitespace-nowrap">{fmtDate(row.borrow_date)}</td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell whitespace-nowrap">{fmtDate(row.expected_return_date)}</td>
                <td className="px-5 py-3.5 text-sm text-foreground/80 whitespace-nowrap">{fmtDateTime(row.return_approved_at)}</td>
                <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">{row.return_approved_by ?? '-'}</span>
                        <ChevronDown className={['w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')} />
                    </div>
                </td>
            </tr>
            {open && (
                <tr className="border-b border-border/20 bg-accent/20 animate-fade-in">
                    <td colSpan={7} className="px-8 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5">Detail Barang Dikembalikan</p>
                                <div className="space-y-1.5">
                                    {row.items.map((it, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <span className="text-foreground/80">{it.name} × {it.returned_quantity}</span>
                                            <span className={['badge-pill text-[10px]', CONDITION_BADGE[it.condition_in] ?? CONDITION_BADGE.baik].join(' ')}>{it.condition_label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {row.return_notes && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1.5">Catatan Pengembalian</p>
                                    <p className="text-foreground/80">{row.return_notes}</p>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function ReturnReportPage() {
    const [filters, setFilters] = useState<ReturnReportParams>({ per_page: 15, page: 1 });
    const [draft, setDraft] = useState({ date_from: '', date_to: '' });
    const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['report-returns', filters], queryFn: () => getReturnReport(filters) });

    function apply() { setFilters(p => ({ ...p, page: 1, date_from: draft.date_from || undefined, date_to: draft.date_to || undefined })); }
    function reset() { setDraft({ date_from: '', date_to: '' }); setFilters({ per_page: 15, page: 1 }); }

    const rows = data?.data ?? [];
    const meta = data?.meta;

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-up">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Pengembalian</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Riwayat seluruh barang yang telah dikembalikan</p>
                </div>
                <Button onClick={() => exportReturnReport({ date_from: filters.date_from, date_to: filters.date_to })} className="gap-2 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700">
                    <FileDown className="w-4 h-4" /> Export Excel
                </Button>
            </div>

            <div className="glass-card px-5 py-4 animate-fade-up delay-75">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Filter</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Dari Tgl Kembali</label>
                        <input type="date" value={draft.date_from} onChange={e => setDraft(p => ({ ...p, date_from: e.target.value }))} className="input-ios" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70">Sampai Tgl Kembali</label>
                        <input type="date" value={draft.date_to} onChange={e => setDraft(p => ({ ...p, date_to: e.target.value }))} className="input-ios" /></div>
                    <div className="sm:col-span-2 flex items-end gap-2">
                        <Button onClick={apply} className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"><Search className="w-3.5 h-3.5" /> Terapkan</Button>
                        <Button variant="outline" size="icon" onClick={reset} title="Reset"><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden animate-fade-up delay-150">
                {meta && <div className="px-5 py-3.5 border-b border-border/40"><p className="text-xs text-muted-foreground">Total <span className="font-semibold text-foreground">{meta.total}</span> pengembalian</p></div>}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/50">
                            {['No','Kode','Peminjam','Tgl Pinjam','Tenggat','Tgl Kembali','Dikonfirmasi'].map((h, i) => (
                                <th key={h} className={['px-5 py-3.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest', i === 0 ? 'text-center w-10' : i === 6 ? 'text-right' : 'text-left', i === 3 ? 'hidden sm:table-cell' : i === 4 ? 'hidden md:table-cell' : ''].join(' ')}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>
                            {isLoading ? <Skeleton /> : isError ? (
                                <tr><td colSpan={7} className="px-5 py-12 text-center"><div className="space-y-3"><p className="text-sm text-destructive">Gagal memuat data.</p><Button size="sm" onClick={() => refetch()}><RefreshCw className="w-3.5 h-3.5" /> Coba Lagi</Button></div></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="w-8 h-8 opacity-30" /><p className="text-sm">Tidak ada data yang sesuai filter.</p></div></td></tr>
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
