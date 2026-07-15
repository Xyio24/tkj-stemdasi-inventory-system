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
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{label}</span>
            <span className="text-sm font-medium text-foreground">{value || '-'}</span>
        </div>
    );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Section({
    title, icon, children, className, stretch,
}: {
    title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; stretch?: boolean;
}) {
    return (
        <div className={[
            'glass-card animate-fade-up',
            stretch ? 'flex flex-col flex-1' : '',
            className,
        ].filter(Boolean).join(' ')}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/40">
                <div className="w-7 h-7 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            </div>
            <div className={['px-5 py-4', stretch ? 'flex flex-col flex-1' : ''].filter(Boolean).join(' ')}>
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
                borrowing.items.map((item: BorrowingItemDetail) => {
                    const isConsumable = item.type === 'consumable';
                    const defaultCondition = isConsumable
                        ? 'terpakai'
                        : (item.item_condition_out || 'baik');
                    return {
                        borrowing_item_id: item.borrowing_item_id,
                        return_conditions: [{
                            condition: defaultCondition as ReturnConditionEntry['condition'],
                            quantity:  item.quantity,
                        }],
                    };
                })
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
        mutationFn: () => approveReturn(Number(id), { return_notes: returnNotes, items: returnItems }),
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
        <div className="max-w-4xl mx-auto space-y-5">

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">

                {/* ── Left: main info ── */}
                <div className="lg:col-span-2 space-y-4 flex flex-col">

                    {/* Info utama */}
                    <Section title="Informasi Peminjaman" icon={<FileText className="w-4 h-4 text-primary" />} className="delay-75">
                        {/* Code + status */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="font-mono text-lg font-bold text-primary">{borrowing.code}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(borrowing.created_at)}</p>
                            </div>
                            <span className={['badge-pill text-xs', st.badge].join(' ')}>{st.label}</span>
                        </div>

                        {/* Grid info */}
                        <div className="grid grid-cols-2 gap-4">
                            <InfoRow label="Peminjam"        value={borrowing.user?.name} />
                            <InfoRow label="Keperluan"       value={borrowing.purpose} />
                            <InfoRow label="Tgl Pinjam"      value={formatDate(borrowing.borrow_date)} />
                            <InfoRow label="Tenggat Kembali" value={formatDate(borrowing.expected_return_date)} />
                        </div>

                        {/* Notes */}
                        {borrowing.notes && (
                            <div className="mt-4 p-3.5 bg-accent/40 rounded-2xl border border-border/40">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Catatan Siswa</p>
                                <p className="text-sm text-foreground">{borrowing.notes}</p>
                            </div>
                        )}

                        {/* Rejection reason */}
                        {borrowing.rejection_reason && (
                            <div className="mt-4 p-3.5 bg-red-50/60 dark:bg-red-900/15 rounded-2xl border border-red-200/50 dark:border-red-800/30">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-1">Alasan Penolakan</p>
                                <p className="text-sm text-red-700 dark:text-red-300">{borrowing.rejection_reason}</p>
                            </div>
                        )}
                    </Section>

                    {/* Daftar barang */}
                    <Section title="Daftar Barang" icon={<Package className="w-4 h-4 text-primary" />} className="delay-100">
                        <div className="space-y-2">
                            {borrowing.items?.map((item: BorrowingItemDetail) => (
                                <div key={item.id} className="flex items-center justify-between p-3.5 bg-accent/30 rounded-2xl border border-border/30 hover:bg-accent/50 transition-colors duration-150">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                                        {(item.brand || item.model) && (
                                            <p className="text-xs text-muted-foreground">{[item.brand, item.model].filter(Boolean).join(' · ')}</p>
                                        )}
                                    </div>
                                    <span className="badge-pill bg-primary/10 dark:bg-primary/20 text-primary ml-3 flex-shrink-0">
                                        {item.quantity} unit
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Lampiran foto */}
                    {borrowing.photos && borrowing.photos.length > 0 && (
                        <Section title="Lampiran Foto" icon={<ImageIcon className="w-4 h-4 text-primary" />} className="delay-150">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {borrowing.photos.map((photo: BorrowingPhoto) => (
                                    <div key={photo.id} className="space-y-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                                            Bukti {photo.type === 'borrow' ? 'Pengambilan' : 'Pengembalian'}
                                        </p>
                                        <a href={photo.url ?? photo.path} target="_blank" rel="noopener noreferrer"
                                            className="block rounded-2xl overflow-hidden border border-border/40 hover:opacity-90 transition-opacity duration-150 shadow-glass">
                                            <img
                                                src={photo.url ?? photo.path}
                                                alt={`Bukti ${photo.type}`}
                                                className="w-full h-auto object-cover"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </a>
                                        <p className="text-[10px] text-muted-foreground/60">
                                            {photo.uploaded_at ? formatDateTime(photo.uploaded_at) : '-'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}
                </div>

                {/* ── Right: action panels ── */}
                <div className="space-y-4 flex flex-col">

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
                                    const totalQty = rItem.return_conditions.reduce((s, c) => s + c.quantity, 0);
                                    const isMatch  = totalQty === (orig?.quantity ?? 0);
                                    const isConsumable = orig?.type === 'consumable';

                                    const COND_OPTIONS = [
                                        { value: 'baik',         label: 'Baik' },
                                        { value: 'rusak_ringan', label: 'Rusak Ringan' },
                                        { value: 'rusak_berat',  label: 'Rusak Berat' },
                                        { value: 'hilang',       label: 'Hilang' },
                                        ...(isConsumable ? [{ value: 'terpakai', label: 'Terpakai' }] : []),
                                    ];

                                    return (
                                        <div key={rItem.borrowing_item_id} className="bg-accent/30 rounded-2xl border border-border/30 p-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-foreground truncate">
                                                    {orig?.name ?? '-'}
                                                    {isConsumable && (
                                                        <span className="ml-1.5 text-[9px] bg-amber-100/80 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Consumable</span>
                                                    )}
                                                </span>
                                                <span className={['text-xs font-semibold', isMatch ? 'text-green-600 dark:text-green-400' : 'text-red-500'].join(' ')}>
                                                    {totalQty}/{orig?.quantity ?? 0}
                                                </span>
                                            </div>

                                            {rItem.return_conditions.map((cond, condIdx) => (
                                                <div key={condIdx} className="flex gap-2 items-center">
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
                                                        {COND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={orig?.quantity}
                                                        value={cond.quantity}
                                                        onChange={e => {
                                                            setReturnItems(prev => prev.map((ri, ii) => ii !== itemIdx ? ri : {
                                                                ...ri,
                                                                return_conditions: ri.return_conditions.map((c, ci) =>
                                                                    ci !== condIdx ? c : { ...c, quantity: Number(e.target.value) }
                                                                ),
                                                            }));
                                                        }}
                                                        className="input-ios w-16 py-1.5 text-xs text-center"
                                                    />
                                                    {rItem.return_conditions.length > 1 && (
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
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => setReturnItems(prev => prev.map((ri, ii) => {
                                                    if (ii !== itemIdx) return ri;
                                                    const origQty = orig?.quantity ?? 0;
                                                    const currentTotal = ri.return_conditions.reduce((s, c) => s + c.quantity, 0);
                                                    // Sisa qty setelah ditambah 1 untuk kondisi baru
                                                    const newCondQty = 1;
                                                    const remaining  = currentTotal - newCondQty;
                                                    // Kurangi qty dari baris pertama (pastikan minimal 1)
                                                    const updatedConditions = ri.return_conditions.map((c, ci) => {
                                                        if (ci !== 0) return c;
                                                        return { ...c, quantity: Math.max(0, c.quantity - newCondQty) };
                                                    }).filter(c => c.quantity > 0);
                                                    const defaultCond = isConsumable ? 'terpakai' : 'baik';
                                                    return {
                                                        ...ri,
                                                        return_conditions: [
                                                            ...updatedConditions,
                                                            { condition: defaultCond as ReturnConditionEntry['condition'], quantity: newCondQty },
                                                        ],
                                                    };
                                                }))}
                                                className="flex items-center gap-1 text-xs text-primary font-medium hover:gap-1.5 transition-all duration-150"
                                            >
                                                <Plus className="w-3 h-3" /> Tambah Kondisi
                                            </button>
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

                                <Button
                                    className="w-full bg-violet-600 hover:bg-violet-700"
                                    loading={approveReturnMutation.isPending}
                                    disabled={returnItems.some(ri => {
                                        const orig = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === ri.borrowing_item_id);
                                        return ri.return_conditions.reduce((s, c) => s + c.quantity, 0) !== (orig?.quantity ?? 0);
                                    })}
                                    onClick={() => approveReturnMutation.mutate()}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Konfirmasi Pengembalian
                                </Button>
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
