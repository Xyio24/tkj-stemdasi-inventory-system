import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBorrowingById,
    cancelBorrowing,
    approveBorrowing,
    rejectBorrowing,
    uploadBorrowingPhoto,
    approveReturn,
    deleteBorrowing,
} from '@/api/borrowing';
import type {
    BorrowingPhoto,
    BorrowingItemDetail,
    ApproveReturnItemPayload,
    ReturnConditionEntry,
} from '@/api/borrowing';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import {
    ArrowLeft, Plus, Trash2, Camera, CheckCircle2, XCircle,
    RotateCcw, Clock, Package, FileText, AlertTriangle,
    ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropModal from '@/components/common/ImageCropModal';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
    pending:   { label: 'Menunggu Persetujuan', badge: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',  dot: 'bg-amber-400'  },
    approved:  { label: 'Disetujui',            badge: 'bg-blue-100/80   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',   dot: 'bg-blue-400'   },
    rejected:  { label: 'Ditolak',              badge: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400',    dot: 'bg-red-400'    },
    borrowing: { label: 'Sedang Dipinjam',      badge: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', dot: 'bg-indigo-400' },
    returning: { label: 'Proses Pengembalian',  badge: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-400' },
    returned:  { label: 'Dikembalikan',         badge: 'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400',  dot: 'bg-green-400'  },
    overdue:   { label: 'Terlambat',            badge: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400',    dot: 'bg-red-500'    },
    cancelled: { label: 'Dibatalkan',           badge: 'bg-neutral-100   text-neutral-500 dark:bg-neutral-800  dark:text-neutral-400', dot: 'bg-neutral-400' },
};

const TERMINAL = ['returned', 'rejected', 'cancelled'];

function formatDate(iso?: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(iso?: string) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
            <div className="skeleton h-8 w-48 rounded-2xl" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-4">
                    <div className="skeleton h-52 rounded-3xl" />
                    <div className="skeleton h-40 rounded-3xl" />
                </div>
                <div className="space-y-4">
                    <div className="skeleton h-36 rounded-3xl" />
                    <div className="skeleton h-36 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
            <span className="text-sm font-semibold text-foreground">{value || '-'}</span>
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Section({
    title, icon, children, className,
}: {
    title: string; icon: React.ReactNode; children: React.ReactNode; className?: string;
}) {
    return (
        <div className={[
            'glass-card animate-fade-up',
            className,
        ].filter(Boolean).join(' ')}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40">
                <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            </div>
            <div className="px-5 py-4">
                {children}
            </div>
        </div>
    );
}

// ─── Photo Dropzone ───────────────────────────────────────────────────────────

function PhotoUploadArea({
    label, hint, accept, file, onChange,
}: {
    label: string; hint?: string; accept: string;
    file: File | null; onChange: (f: File | null) => void;
}) {
    return (
        <label className={[
            'relative flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 border-dashed cursor-pointer',
            'transition-all duration-200',
            file
                ? 'border-primary/40 bg-primary/5 dark:bg-primary/10'
                : 'border-border/60 hover:border-primary/40 hover:bg-accent/20',
        ].join(' ')}>
            <input
                type="file"
                accept={accept}
                className="sr-only"
                onChange={e => onChange(e.target.files?.[0] ?? null)}
            />
            <div className={['w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200', file ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'].join(' ')}>
                <Camera className="w-5 h-5" />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                {file
                    ? <p className="text-xs text-primary mt-0.5 truncate max-w-[180px]">{file.name}</p>
                    : <p className="text-xs text-muted-foreground mt-0.5">{hint ?? 'Klik untuk pilih foto'}</p>
                }
            </div>
        </label>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function BorrowingDetail() {
    const { id }      = useParams<{ id: string }>();
    const navigate    = useNavigate();
    const queryClient = useQueryClient();
    const user        = useAuthStore(s => s.user);

    const [notes,            setNotes]           = useState('');
    const [rejectionReason,  setRejectionReason] = useState('');
    const [isRejecting,      setIsRejecting]     = useState(false);
    const [returnNotes,      setReturnNotes]     = useState('');
    const [returnItems,      setReturnItems]     = useState<ApproveReturnItemPayload[]>([]);
    const [photoFile,        setPhotoFile]       = useState<File | null>(null);
    const [cropSrc,          setCropSrc]         = useState<string | null>(null);
    const [pendingPhotoType, setPendingPhotoType] = useState<'borrow' | 'return' | null>(null);

    const { data: response, isLoading } = useQuery({
        queryKey: ['borrowings', id],
        queryFn:  () => getBorrowingById(Number(id)),
        enabled:  !!id,
    });

    const borrowing = response?.data;

    useEffect(() => {
        if (borrowing?.items) {
            setReturnItems(
                borrowing.items.map((item: BorrowingItemDetail) => ({
                    borrowing_item_id: item.borrowing_item_id,
                    return_conditions: [],
                }))
            );
        }
    }, [borrowing]);

    // ── Mutations ──
    const cancelMutation = useMutation({
        mutationFn: () => cancelBorrowing(Number(id)),
        onSuccess: () => { toast.success('Peminjaman dibatalkan'); queryClient.invalidateQueries({ queryKey: ['borrowings', id] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal membatalkan'),
    });

    const approveMutation = useMutation({
        mutationFn: () => approveBorrowing(Number(id), notes),
        onSuccess: () => { toast.success('Peminjaman disetujui'); queryClient.invalidateQueries({ queryKey: ['borrowings', id] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menyetujui'),
    });

    const rejectMutation = useMutation({
        mutationFn: () => rejectBorrowing(Number(id), rejectionReason),
        onSuccess: () => { toast.success('Peminjaman ditolak'); setIsRejecting(false); queryClient.invalidateQueries({ queryKey: ['borrowings', id] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menolak'),
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: (fd: FormData) => uploadBorrowingPhoto(Number(id), fd),
        onSuccess: () => { toast.success('Foto berhasil diunggah'); setPhotoFile(null); queryClient.invalidateQueries({ queryKey: ['borrowings', id] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengunggah foto'),
    });

    const approveReturnMutation = useMutation({
        mutationFn: () => {
            const payloadItems = returnItems.map(ri => {
                const orig = borrowing?.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === ri.borrowing_item_id);
                const isConsumable = orig?.type === 'consumable';
                const defaultCond = isConsumable ? 'terpakai' : (orig?.item_condition_out || 'baik');
                
                const otherSum = ri.return_conditions.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
                const defaultQty = Math.max(0, (orig?.quantity ?? 0) - otherSum);

                const conditions = [...ri.return_conditions];
                if (defaultQty > 0) {
                    conditions.unshift({ condition: defaultCond as ReturnConditionEntry['condition'], quantity: defaultQty });
                }

                return {
                    borrowing_item_id: ri.borrowing_item_id,
                    return_conditions: conditions.filter(c => Number(c.quantity) > 0)
                };
            });
            return approveReturn(Number(id), { return_notes: returnNotes, items: payloadItems });
        },
        onSuccess: () => { toast.success('Pengembalian dikonfirmasi'); queryClient.invalidateQueries({ queryKey: ['borrowings', id] }); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal mengonfirmasi'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteBorrowing(Number(id)),
        onSuccess: () => { toast.success('Data peminjaman dihapus'); navigate('/dashboard/borrowings'); },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Gagal menghapus'),
    });

    if (isLoading) return <DetailSkeleton />;
    if (!borrowing) return (
        <div className="glass-card px-6 py-10 text-center animate-spring-in max-w-md mx-auto mt-10">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="font-semibold text-foreground">Peminjaman tidak ditemukan</p>
            <button onClick={() => navigate('/dashboard/borrowings')} className="mt-4 text-sm text-primary hover:underline">
                ← Kembali ke daftar
            </button>
        </div>
    );

    const handleUpload = (e: React.FormEvent, type: 'borrow' | 'return') => {
        e.preventDefault();
        if (!photoFile) return;
        const fd = new FormData();
        fd.append('photo', photoFile);
        fd.append('type', type);
        uploadPhotoMutation.mutate(fd);
    };

    // Buka crop modal saat file dipilih, simpan type untuk dipakai setelah crop
    const handlePhotoSelect = (file: File | null, type: 'borrow' | 'return') => {
        if (!file) { setPhotoFile(null); return; }
        setPendingPhotoType(type);
        setCropSrc(URL.createObjectURL(file));
    };

    const handleCropConfirm = (croppedFile: File) => {
        setPhotoFile(croppedFile);
        setCropSrc(null);
    };

    const handleCropCancel = () => {
        setCropSrc(null);
        setPendingPhotoType(null);
    };

    const hasBorrowPhoto = borrowing?.photos?.some((p: BorrowingPhoto) => p.type === 'borrow');
    const hasReturnPhoto = borrowing?.photos?.some((p: BorrowingPhoto) => p.type === 'return');

    const isSiswa      = user?.role === 'siswa';
    const isGuruOrAdmin = user?.role === 'admin' || user?.role === 'guru';
    const isAdmin      = user?.role === 'admin';

    const st = STATUS_CONFIG[borrowing.status] ?? STATUS_CONFIG.pending;

    // ── Render ──
    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-20">

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-up">
                <button
                    onClick={() => navigate('/dashboard/borrowings')}
                    className="p-2 rounded-2xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.93] flex-shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Detail Peminjaman</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Dibuat: {formatDateTime(borrowing.created_at)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8 items-stretch">

                {/* ── Left: main info ── */}
                <div className="space-y-6 flex flex-col">

                    {/* Info utama */}
                    <Section title="Informasi Peminjaman" icon={<FileText className="w-4 h-4 text-primary" />} className="delay-75 flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow label="Kode Referensi" value={<span className="font-mono text-primary font-bold">{borrowing.code}</span>} />
                            <InfoRow label="Peminjam" value={borrowing.user?.name} />
                            <InfoRow label="Keperluan" value={borrowing.purpose} />
                            <InfoRow label="Waktu Pengajuan" value={formatDateTime(borrowing.created_at)} />
                        </div>

                        {/* Notes */}
                        {borrowing.notes && (
                            <div className="mt-5 p-3.5 bg-accent/40 rounded-2xl border border-border/40">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Catatan Peminjam</p>
                                <p className="text-sm font-semibold text-foreground">{borrowing.notes}</p>
                            </div>
                        )}

                        {/* Rejection reason */}
                        {borrowing.rejection_reason && (
                            <div className="mt-4 p-3.5 bg-red-50/60 dark:bg-red-900/15 rounded-2xl border border-red-200/50 dark:border-red-800/30">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 mb-1">Alasan Penolakan</p>
                                <p className="text-sm font-semibold text-red-700 dark:text-red-300">{borrowing.rejection_reason}</p>
                            </div>
                        )}
                    </Section>

                    {/* Daftar Barang */}
                    <Section title="Daftar Barang" icon={<Package className="w-4 h-4 text-primary" />} className="delay-100 flex-1">
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-border/50 text-[11px] uppercase tracking-widest text-muted-foreground/70">
                                        <th className="pb-3 px-2 font-bold">Nama Barang</th>
                                        <th className="pb-3 px-2 font-bold text-center">Jml</th>
                                        <th className="pb-3 px-2 font-bold text-center">Kondisi Awal</th>
                                        <th className="pb-3 px-2 font-bold text-right">Status Kembali</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {borrowing.items?.map((item: BorrowingItemDetail) => {
                                        const isConsumable = item.type === 'consumable';
                                        return (
                                            <tr key={item.id} className="hover:bg-accent/20 transition-colors">
                                                <td className="py-3.5 px-2">
                                                    <p className="font-semibold text-sm text-foreground leading-tight">{item.name}</p>
                                                    {(item.brand || item.model) && (
                                                        <p className="text-[11px] text-muted-foreground mt-0.5">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
                                                    )}
                                                    {isConsumable && (
                                                        <span className="inline-block mt-1.5 text-[9px] bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Consumable</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-2 text-center align-top">
                                                    <span className="badge-pill bg-primary/10 dark:bg-primary/20 text-primary font-semibold text-xs whitespace-nowrap">
                                                        {item.quantity} unit
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-2 text-center align-top">
                                                    <span className="text-xs font-medium capitalize text-muted-foreground">
                                                        {isConsumable ? 'Terpakai' : (item.item_condition_out || 'Baik').replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-2 text-right align-top">
                                                    {borrowing.status === 'returned' ? (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Dikembalikan ({item.returned_quantity || item.quantity})</span>
                                                            {!isConsumable && item.item_condition_in && (
                                                                <span className="text-[10px] font-medium text-muted-foreground capitalize">({item.item_condition_in.replace('_', ' ')})</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* Lampiran Foto */}
                    {borrowing.photos && borrowing.photos.length > 0 && (
                        <Section title="Lampiran Foto" icon={<ImageIcon className="w-4 h-4 text-primary" />} className="delay-150 flex-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {borrowing.photos.map((photo: BorrowingPhoto) => (
                                    <div key={photo.id} className="group relative flex flex-col gap-2.5">
                                        <a href={photo.url ?? photo.path} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square rounded-2xl overflow-hidden border border-border/40 shadow-sm hover:shadow-md transition-all">
                                            <img
                                                src={photo.url ?? photo.path}
                                                alt={`Bukti ${photo.type}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </a>
                                        <div className="flex flex-col px-1">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                                                {photo.type === 'borrow' ? 'Pengambilan' : 'Pengembalian'}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                                {photo.uploaded_at ? formatDateTime(photo.uploaded_at) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                </div>

                {/* ── Right: action panels ── */}
                <div className="space-y-5 flex flex-col">
                    {/* Ringkasan & Status */}
                    <div className="glass-card animate-fade-up delay-75 flex flex-col">
                        <div className="px-5 py-4 border-b border-border/40 flex flex-col items-center justify-center text-center">
                            <span className={['badge-pill text-sm px-4 py-1.5 font-bold', st.badge].join(' ')}>{st.label}</span>
                        </div>
                        <div className="px-5 py-4 space-y-3.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Barang</span>
                                <span className="font-semibold text-sm text-foreground">{borrowing.items?.length || 0} Macam</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Total Unit</span>
                                <span className="font-semibold text-sm text-foreground">{borrowing.items?.reduce((a: any, b: any) => a + b.quantity, 0)} Unit</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Tgl Pinjam</span>
                                <span className="font-semibold text-sm text-foreground">{formatDate(borrowing.borrow_date)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Tenggat</span>
                                <span className="font-semibold text-sm text-foreground">{formatDate(borrowing.expected_return_date)}</span>
                            </div>
                        </div>
                    </div>


                    {/* Siswa: batalkan */}
                    {isSiswa && borrowing.status === 'pending' && (
                        <Section title="Aksi" icon={<Clock className="w-4 h-4 text-primary" />} className="delay-75">
                            <p className="text-xs text-muted-foreground mb-3">Pengajuan masih menunggu persetujuan. Kamu bisa membatalkannya.</p>
                            <Button
                                variant="destructive"
                                className="w-full"
                                loading={cancelMutation.isPending}
                                onClick={() => confirm('Batalkan pengajuan ini?') && cancelMutation.mutate()}
                            >
                                Batalkan Pengajuan
                            </Button>
                        </Section>
                    )}

                    {/* Siswa: upload selfie pengambilan */}
                    {isSiswa && borrowing.status === 'approved' && !hasBorrowPhoto && (
                        <Section title="Selfie Pengambilan" icon={<Camera className="w-4 h-4 text-primary" />} className="delay-100">
                            <p className="text-xs text-muted-foreground mb-3">Unggah foto selfie bersama barang sebagai bukti serah terima.</p>
                            <form onSubmit={e => handleUpload(e, 'borrow')} className="space-y-3">
                                <PhotoUploadArea
                                    label="Pilih Foto Selfie"
                                    hint="JPG, PNG, WebP — akan di-crop"
                                    accept="image/jpeg,image/png,image/webp"
                                    file={photoFile}
                                    onChange={f => handlePhotoSelect(f, 'borrow')}
                                />
                                <Button type="submit" className="w-full" disabled={!photoFile} loading={uploadPhotoMutation.isPending}>
                                    Unggah Foto Bukti
                                </Button>
                            </form>
                        </Section>
                    )}

                    {/* Siswa: upload selfie pengembalian */}
                    {isSiswa && borrowing.status === 'approved' && hasBorrowPhoto && !hasReturnPhoto && (
                        <Section title="Selfie Pengembalian" icon={<RotateCcw className="w-4 h-4 text-primary" />} className="delay-100">
                            <p className="text-xs text-muted-foreground mb-3">Barang sudah selesai dipakai? Unggah selfie untuk memulai proses pengembalian.</p>
                            <form onSubmit={e => handleUpload(e, 'return')} className="space-y-3">
                                <PhotoUploadArea
                                    label="Pilih Foto Selfie"
                                    hint="JPG, PNG, WebP — akan di-crop"
                                    accept="image/jpeg,image/png,image/webp"
                                    file={photoFile}
                                    onChange={f => handlePhotoSelect(f, 'return')}
                                />
                                <Button
                                    type="submit"
                                    className="w-full bg-violet-600 hover:bg-violet-700"
                                    disabled={!photoFile}
                                    loading={uploadPhotoMutation.isPending}
                                >
                                    Kembalikan Barang
                                </Button>
                            </form>
                        </Section>
                    )}

                    {/* Guru/Admin: approve / reject */}
                    {isGuruOrAdmin && borrowing.status === 'pending' && (
                        <Section title="Persetujuan" icon={<CheckCircle2 className="w-4 h-4 text-primary" />} className="delay-75">
                            {!isRejecting ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Catatan Persetujuan (Opsional)
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Harap dijaga dengan baik..."
                                            className="input-ios resize-none"
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        loading={approveMutation.isPending}
                                        onClick={() => approveMutation.mutate()}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Setujui Peminjaman
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/8"
                                        onClick={() => setIsRejecting(true)}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Tolak Pengajuan
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                                            Alasan Penolakan *
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            rows={3}
                                            placeholder="Minimal 10 karakter..."
                                            className="input-ios resize-none border-red-400/60 focus:border-red-500/60"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsRejecting(false)}>
                                            Batal
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                            loading={rejectMutation.isPending}
                                            disabled={rejectionReason.length < 10}
                                            onClick={() => rejectMutation.mutate()}
                                        >
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Section>
                    )}

                    {/* Guru/Admin: konfirmasi pengembalian */}
                    {isGuruOrAdmin && borrowing.status === 'returning' && (
                        <Section title="Konfirmasi Pengembalian" icon={<RotateCcw className="w-4 h-4 text-primary" />} className="delay-75">
                            <div className="space-y-3">
                                {returnItems.map((rItem, itemIdx) => {
                                    const orig = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === rItem.borrowing_item_id);
                                    const origQty = orig?.quantity ?? 0;
                                    const isConsumable = orig?.type === 'consumable';
                                    const defaultCondValue = isConsumable ? 'terpakai' : (orig?.item_condition_out || 'baik');
                                    const defaultCondLabel = isConsumable ? 'Terpakai' : 'Baik';

                                    const otherSum = rItem.return_conditions.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
                                    const defaultQty = Math.max(0, origQty - otherSum);
                                    const totalQty = defaultQty + otherSum;
                                    const isExceeding = otherSum > origQty;

                                    const COND_OPTIONS = [
                                        { value: 'baik',         label: 'Baik' },
                                        { value: 'rusak_ringan', label: 'Rusak Ringan' },
                                        { value: 'rusak_berat',  label: 'Rusak Berat' },
                                        { value: 'hilang',       label: 'Hilang' },
                                        ...(isConsumable ? [{ value: 'terpakai', label: 'Terpakai' }] : []),
                                    ].filter(opt => opt.value !== defaultCondValue && !rItem.return_conditions.some(c => c.condition === opt.value)); // Cegah ganda

                                    return (
                                        <div key={rItem.borrowing_item_id} className={`rounded-2xl border p-3.5 space-y-3 transition-colors ${isExceeding ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30' : 'bg-accent/30 border-border/30'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-foreground truncate">
                                                    {orig?.name ?? '-'}
                                                    {isConsumable && (
                                                        <span className="ml-1.5 text-[9px] bg-amber-100/80 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Consumable</span>
                                                    )}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <span className={['text-xs font-semibold', isExceeding ? 'text-red-500' : 'text-green-600 dark:text-green-400'].join(' ')}>
                                                        Total Kondisi: {totalQty}/{origQty}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Default Condition (Readonly) */}
                                            <div className="flex gap-2 items-center bg-background/50 rounded-lg p-2 border border-border/40 shadow-sm">
                                                <div className="flex-1 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                    Kondisi Awal ({defaultCondLabel})
                                                </div>
                                                <div className="w-16 py-1 text-sm font-semibold text-center text-foreground">
                                                    {defaultQty}
                                                </div>
                                                <div className="w-[28px]" />
                                            </div>

                                            {/* Other Conditions */}
                                            {rItem.return_conditions.map((cond, condIdx) => (
                                                <div key={condIdx} className="flex gap-2 items-center animate-fade-in">
                                                    <select
                                                        value={cond.condition}
                                                        onChange={e => {
                                                            setReturnItems(prev => prev.map((ri, ii) => ii !== itemIdx ? ri : {
                                                                ...ri,
                                                                return_conditions: ri.return_conditions.map((c, ci) =>
                                                                    ci !== condIdx ? c : { ...c, condition: e.target.value as ReturnConditionEntry['condition'] }
                                                                ),
                                                            }));
                                                        }}
                                                        className="input-ios flex-1 py-1.5 text-xs appearance-none cursor-pointer"
                                                    >
                                                        <option value={cond.condition}>
                                                            {{ 'baik': 'Baik', 'rusak_ringan': 'Rusak Ringan', 'rusak_berat': 'Rusak Berat', 'hilang': 'Hilang', 'terpakai': 'Terpakai' }[cond.condition] || cond.condition}
                                                        </option>
                                                        {COND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={cond.quantity === 0 ? '' : cond.quantity}
                                                        placeholder="0"
                                                        onChange={e => {
                                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                            setReturnItems(prev => prev.map((ri, ii) => ii !== itemIdx ? ri : {
                                                                ...ri,
                                                                return_conditions: ri.return_conditions.map((c, ci) =>
                                                                    ci !== condIdx ? c : { ...c, quantity: Math.max(0, val) }
                                                                ),
                                                            }));
                                                        }}
                                                        className="input-ios w-16 py-1.5 text-xs text-center"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setReturnItems(prev => prev.map((ri, ii) => ii !== itemIdx ? ri : {
                                                            ...ri,
                                                            return_conditions: ri.return_conditions.filter((_, ci) => ci !== condIdx),
                                                        }))}
                                                        className="p-1.5 rounded-xl text-destructive hover:bg-destructive/8 transition-all duration-150"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            {COND_OPTIONS.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReturnItems(prev => prev.map((ri, ii) => {
                                                        if (ii !== itemIdx) return ri;
                                                        return {
                                                            ...ri,
                                                            return_conditions: [
                                                                ...ri.return_conditions,
                                                                { condition: COND_OPTIONS[0].value as ReturnConditionEntry['condition'], quantity: 0 },
                                                            ],
                                                        };
                                                    }))}
                                                    className="flex items-center gap-1 text-xs text-primary font-medium hover:gap-1.5 transition-all duration-150 mt-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Tambah Kondisi
                                                </button>
                                            )}

                                            {isExceeding && (
                                                <p className="text-[10px] text-red-500 font-medium animate-fade-in mt-1">
                                                    ⚠️ Jumlah kondisi melebihi barang yang dikembalikan.
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Catatan Pengembalian
                                    </label>
                                    <textarea
                                        value={returnNotes}
                                        onChange={e => setReturnNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Catatan kondisi pengembalian..."
                                        className="input-ios resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        className="w-full bg-violet-600 hover:bg-violet-700"
                                        loading={approveReturnMutation.isPending}
                                        disabled={returnItems.some(ri => {
                                            const orig = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === ri.borrowing_item_id);
                                            const otherSum = ri.return_conditions.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
                                            return otherSum > (orig?.quantity ?? 0);
                                        })}
                                        onClick={() => approveReturnMutation.mutate()}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Selesaikan Audit
                                    </Button>
                                    {returnItems.some(ri => {
                                        const orig = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === ri.borrowing_item_id);
                                        const otherSum = ri.return_conditions.reduce((s, c) => s + (Number(c.quantity) || 0), 0);
                                        return otherSum > (orig?.quantity ?? 0);
                                    }) && (
                                        <p className="text-center text-[10px] text-red-500 font-medium">
                                            Audit belum dapat diselesaikan karena jumlah kondisi melebihi total barang.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Admin: danger zone */}
                    {isAdmin && TERMINAL.includes(borrowing.status) && (
                        <div className="glass-card border-red-200/50 dark:border-red-800/30 animate-fade-up delay-200">
                            <div className="px-5 py-4 border-b border-red-200/40 dark:border-red-800/20">
                                <p className="text-xs font-bold uppercase tracking-widest text-red-500">Zona Berbahaya</p>
                            </div>
                            <div className="px-5 py-4 space-y-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Hapus permanen seluruh data peminjaman ini beserta foto bukti. Tidak dapat dibatalkan.
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    loading={deleteMutation.isPending}
                                    onClick={() => confirm(`Hapus data peminjaman "${borrowing.code}"?\nTidak dapat dibatalkan.`) && deleteMutation.mutate()}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus Data Peminjaman
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Crop Modal — muncul saat user pilih foto selfie */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={undefined}
                    title={pendingPhotoType === 'borrow' ? 'Sesuaikan Foto Pengambilan' : 'Sesuaikan Foto Pengembalian'}
                    outputFilename={`selfie-${pendingPhotoType ?? 'photo'}.jpg`}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
}
