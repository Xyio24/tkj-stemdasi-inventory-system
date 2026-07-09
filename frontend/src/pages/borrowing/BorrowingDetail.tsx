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
    deleteBorrowing
} from '@/api/borrowing';
import type { BorrowingPhoto, BorrowingItemDetail, ApproveReturnItemPayload, ReturnConditionEntry } from '@/api/borrowing';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export default function BorrowingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    
    // Return State
    const [returnNotes, setReturnNotes] = useState('');
    const [returnItems, setReturnItems] = useState<ApproveReturnItemPayload[]>([]);

    // Photo Upload State
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const { data: response, isLoading } = useQuery({
        queryKey: ['borrowings', id],
        queryFn: () => getBorrowingById(Number(id)),
        enabled: !!id
    });

    const borrowing = response?.data;

    useEffect(() => {
        if (borrowing?.items) {
            setReturnItems(
                borrowing.items.map((item: BorrowingItemDetail) => ({
                    borrowing_item_id: item.borrowing_item_id,
                    return_conditions: [
                        {
                            condition: (item.item_condition_out || 'baik') as ReturnConditionEntry['condition'],
                            quantity: item.quantity,
                        }
                    ],
                }))
            );
        }
    }, [borrowing]);

    // Mutations
    const cancelMutation = useMutation({
        mutationFn: () => cancelBorrowing(Number(id)),
        onSuccess: () => {
            toast.success('Peminjaman berhasil dibatalkan');
            queryClient.invalidateQueries({ queryKey: ['borrowings', id] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal membatalkan')
    });

    const approveMutation = useMutation({
        mutationFn: () => approveBorrowing(Number(id), notes),
        onSuccess: () => {
            toast.success('Peminjaman disetujui');
            queryClient.invalidateQueries({ queryKey: ['borrowings', id] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal menyetujui')
    });

    const rejectMutation = useMutation({
        mutationFn: () => rejectBorrowing(Number(id), rejectionReason),
        onSuccess: () => {
            toast.success('Peminjaman ditolak');
            setIsRejecting(false);
            queryClient.invalidateQueries({ queryKey: ['borrowings', id] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal menolak')
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: (formData: FormData) => uploadBorrowingPhoto(Number(id), formData),
        onSuccess: () => {
            toast.success('Foto berhasil diunggah');
            setPhotoFile(null);
            queryClient.invalidateQueries({ queryKey: ['borrowings', id] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal mengunggah foto')
    });

    const approveReturnMutation = useMutation({
        mutationFn: () => approveReturn(Number(id), { return_notes: returnNotes, items: returnItems }),
        onSuccess: () => {
            toast.success('Pengembalian berhasil dikonfirmasi');
            queryClient.invalidateQueries({ queryKey: ['borrowings', id] });
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal mengonfirmasi pengembalian')
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteBorrowing(Number(id)),
        onSuccess: () => {
            toast.success('Data peminjaman berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['borrowings'] });
            navigate('/dashboard/borrowings');
        },
        onError: (err: { response?: { data?: { message?: string } } }) => toast.error(err.response?.data?.message || 'Gagal menghapus data peminjaman')
    });

    if (isLoading) return <div className="p-8 text-center text-neutral-500">Loading detail...</div>;
    if (!borrowing) return <div className="p-8 text-center text-red-500">Peminjaman tidak ditemukan</div>;

    const handleCancel = () => {
        if (confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) {
            cancelMutation.mutate();
        }
    };

    const handleUpload = (e: React.FormEvent, type: 'borrow' | 'return') => {
        e.preventDefault();
        if (!photoFile) return;
        const formData = new FormData();
        formData.append('photo', photoFile);
        formData.append('type', type);
        uploadPhotoMutation.mutate(formData);
    };

    const hasBorrowPhoto = borrowing?.photos?.some((p: BorrowingPhoto) => p.type === 'borrow');
    const hasReturnPhoto = borrowing?.photos?.some((p: BorrowingPhoto) => p.type === 'return');

    const isSiswa = user?.role === 'siswa';
    const isGuruOrAdmin = user?.role === 'admin' || user?.role === 'guru';
    const isAdmin = user?.role === 'admin';

    const TERMINAL_STATUSES = ['returned', 'rejected', 'cancelled'];

    function handleDelete() {
        if (confirm(`Hapus data peminjaman "${borrowing.code}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
            deleteMutation.mutate();
        }
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            rejected: 'bg-red-100 text-red-800',
            borrowing: 'bg-indigo-100 text-indigo-800',
            returning: 'bg-purple-100 text-purple-800',
            returned: 'bg-green-100 text-green-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-neutral-100 text-neutral-800',
        };
        const labels: Record<string, string> = {
            pending: 'Menunggu Persetujuan',
            approved: 'Disetujui',
            rejected: 'Ditolak',
            borrowing: 'Sedang Dipinjam',
            returning: 'Proses Pengembalian',
            returned: 'Dikembalikan',
            overdue: 'Terlambat',
            cancelled: 'Dibatalkan',
        };
        return (
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || styles.pending}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/dashboard/borrowings')} className="text-neutral-500 hover:text-neutral-900">
                    &larr; Kembali
                </button>
                <h2 className="text-2xl font-semibold">Detail Peminjaman</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Utama */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{borrowing.code}</h3>
                                <p className="text-neutral-500 mt-1">{new Date(borrowing.created_at).toLocaleString('id-ID')}</p>
                            </div>
                            <div>{getStatusBadge(borrowing.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-neutral-500">Peminjam</span>
                                <span className="font-medium">{borrowing.user?.name}</span>
                            </div>
                            <div>
                                <span className="block text-neutral-500">Keperluan</span>
                                <span className="font-medium">{borrowing.purpose}</span>
                            </div>
                            <div>
                                <span className="block text-neutral-500">Tanggal Ambil (Rencana)</span>
                                <span className="font-medium">{new Date(borrowing.borrow_date).toLocaleDateString('id-ID')}</span>
                            </div>
                            <div>
                                <span className="block text-neutral-500">Tanggal Kembali (Rencana)</span>
                                <span className="font-medium">{new Date(borrowing.expected_return_date).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>

                        {borrowing.notes && (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md border border-neutral-100 dark:border-neutral-700">
                                <span className="block text-neutral-500 text-xs mb-1">Catatan Siswa</span>
                                <p className="text-sm">{borrowing.notes}</p>
                            </div>
                        )}
                        
                        {borrowing.rejection_reason && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800">
                                <span className="block text-red-600 dark:text-red-400 text-xs font-medium mb-1">Alasan Penolakan</span>
                                <p className="text-sm text-red-800 dark:text-red-200">{borrowing.rejection_reason}</p>
                            </div>
                        )}

                        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                            <h4 className="font-semibold mb-4">Daftar Barang</h4>
                            <div className="space-y-3">
                                {borrowing.items?.map((item: BorrowingItemDetail) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-neutral-500">{item.brand} {item.model}</div>
                                        </div>
                                        <div className="font-semibold px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                                            {item.quantity} Unit
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    
                    {/* Action: Siswa - Cancel */}
                    {isSiswa && borrowing.status === 'pending' && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg">Aksi Siswa</h3>
                            <button
                                onClick={handleCancel}
                                disabled={cancelMutation.isPending}
                                className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-md hover:bg-red-100 font-medium transition-colors"
                            >
                                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan Pengajuan'}
                            </button>
                        </div>
                    )}

                    {/* Action: Siswa - Upload Selfie Pengambilan */}
                    {isSiswa && borrowing.status === 'approved' && !hasBorrowPhoto && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Upload Selfie Pengambilan</h3>
                            <p className="text-sm text-neutral-500">Unggah foto selfie bersama barang sebagai bukti serah terima awal.</p>
                            <form onSubmit={(e) => handleUpload(e, 'borrow')} className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp"
                                    required
                                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-neutral-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                />
                                <button
                                    type="submit"
                                    disabled={!photoFile || uploadPhotoMutation.isPending}
                                    className="w-full bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {uploadPhotoMutation.isPending ? 'Mengunggah...' : 'Unggah Foto Bukti'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Action: Siswa - Upload Selfie Pengembalian */}
                    {isSiswa && borrowing.status === 'approved' && hasBorrowPhoto && !hasReturnPhoto && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Upload Selfie Pengembalian</h3>
                            <p className="text-sm text-neutral-500">Barang sudah selesai digunakan? Unggah foto selfie bersama barang untuk memulai proses pengembalian.</p>
                            <form onSubmit={(e) => handleUpload(e, 'return')} className="space-y-4">
                                <input
                                    type="file"
                                    accept="image/jpeg, image/png, image/webp"
                                    required
                                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-neutral-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-purple-50 file:text-purple-700
                                        hover:file:bg-purple-100"
                                />
                                <button
                                    type="submit"
                                    disabled={!photoFile || uploadPhotoMutation.isPending}
                                    className="w-full bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {uploadPhotoMutation.isPending ? 'Mengunggah...' : 'Kembalikan Barang'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Action: Guru/Admin - Approve/Reject */}
                    {isGuruOrAdmin && borrowing.status === 'pending' && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Persetujuan</h3>
                            
                            {!isRejecting ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Catatan Persetujuan (Opsional)</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm dark:bg-neutral-800"
                                            rows={2}
                                            placeholder="Contoh: Harap dijaga dengan baik"
                                        />
                                    </div>
                                    <button
                                        onClick={() => approveMutation.mutate()}
                                        disabled={approveMutation.isPending}
                                        className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {approveMutation.isPending ? 'Menyimpan...' : 'Setujui Peminjaman'}
                                    </button>
                                    <button
                                        onClick={() => setIsRejecting(true)}
                                        className="w-full bg-white dark:bg-neutral-900 text-red-600 border border-red-200 dark:border-red-900 py-2 rounded-md font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        Tolak Pengajuan
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-red-600 mb-1">Alasan Penolakan *</label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                            className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                            rows={3}
                                            placeholder="Minimal 10 karakter..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsRejecting(false)}
                                            className="flex-1 bg-neutral-100 text-neutral-700 py-2 rounded-md text-sm font-medium hover:bg-neutral-200"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={() => rejectMutation.mutate()}
                                            disabled={rejectMutation.isPending || rejectionReason.length < 10}
                                            className="flex-1 bg-red-600 text-white py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {rejectMutation.isPending ? 'Memproses...' : 'Tolak'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action: Guru/Admin - Konfirmasi Pengembalian */}
                    {isGuruOrAdmin && borrowing.status === 'returning' && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Konfirmasi Pengembalian</h3>
                            <div className="space-y-4">
                                {/* Per-item condition breakdown */}
                                {returnItems.map((rItem, itemIdx) => {
                                    const originalItem = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === rItem.borrowing_item_id);
                                    const totalQty = rItem.return_conditions.reduce((s, c) => s + c.quantity, 0);
                                    const isMatch = totalQty === (originalItem?.quantity ?? 0);
                                    const isConsumable = originalItem?.type === 'consumable';

                                    const CONDITION_OPTIONS = [
                                        { value: 'baik', label: 'Baik' },
                                        { value: 'rusak_ringan', label: 'Rusak Ringan' },
                                        { value: 'rusak_berat', label: 'Rusak Berat' },
                                        { value: 'hilang', label: 'Hilang' },
                                        ...(isConsumable ? [{ value: 'terpakai', label: 'Terpakai' }] : []),
                                    ];

                                    return (
                                        <div key={rItem.borrowing_item_id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm text-indigo-600 dark:text-indigo-400">
                                                    {originalItem?.name ?? '-'}
                                                    {isConsumable && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Consumable</span>}
                                                </span>
                                                <span className={`text-xs font-medium ${isMatch ? 'text-green-600' : 'text-red-500'}`}>
                                                    {totalQty}/{originalItem?.quantity ?? 0} unit
                                                </span>
                                            </div>

                                            {/* Condition rows */}
                                            <div className="space-y-1.5">
                                                {rItem.return_conditions.map((cond, condIdx) => (
                                                    <div key={condIdx} className="flex gap-2 items-center">
                                                        <select
                                                            value={cond.condition}
                                                            onChange={(e) => {
                                                                const updated = returnItems.map((ri, ii) => {
                                                                    if (ii !== itemIdx) return ri;
                                                                    const conditions = ri.return_conditions.map((c, ci) =>
                                                                        ci === condIdx ? { ...c, condition: e.target.value as ReturnConditionEntry['condition'] } : c
                                                                    );
                                                                    return { ...ri, return_conditions: conditions };
                                                                });
                                                                setReturnItems(updated);
                                                            }}
                                                            className="flex-1 border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1.5 text-xs dark:bg-neutral-800"
                                                        >
                                                            {CONDITION_OPTIONS.map(o => (
                                                                <option key={o.value} value={o.value}>{o.label}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={originalItem?.quantity}
                                                            value={cond.quantity}
                                                            onChange={(e) => {
                                                                const updated = returnItems.map((ri, ii) => {
                                                                    if (ii !== itemIdx) return ri;
                                                                    const conditions = ri.return_conditions.map((c, ci) =>
                                                                        ci === condIdx ? { ...c, quantity: Number(e.target.value) } : c
                                                                    );
                                                                    return { ...ri, return_conditions: conditions };
                                                                });
                                                                setReturnItems(updated);
                                                            }}
                                                            className="w-16 border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1.5 text-xs text-center dark:bg-neutral-800"
                                                        />
                                                        {rItem.return_conditions.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = returnItems.map((ri, ii) => {
                                                                        if (ii !== itemIdx) return ri;
                                                                        return { ...ri, return_conditions: ri.return_conditions.filter((_, ci) => ci !== condIdx) };
                                                                    });
                                                                    setReturnItems(updated);
                                                                }}
                                                                className="text-red-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add condition row */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = returnItems.map((ri, ii) => {
                                                        if (ii !== itemIdx) return ri;
                                                        return {
                                                            ...ri,
                                                            return_conditions: [...ri.return_conditions, { condition: 'baik' as ReturnConditionEntry['condition'], quantity: 1 }],
                                                        };
                                                    });
                                                    setReturnItems(updated);
                                                }}
                                                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                                            >
                                                <Plus className="w-3 h-3" /> Tambah Kondisi
                                            </button>
                                        </div>
                                    );
                                })}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Catatan Pengembalian (Opsional)</label>
                                    <textarea
                                        value={returnNotes}
                                        onChange={e => setReturnNotes(e.target.value)}
                                        className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm dark:bg-neutral-800"
                                        rows={2}
                                        placeholder="Contoh: Barang dikembalikan dalam kondisi lengkap..."
                                    />
                                </div>
                                <button
                                    onClick={() => approveReturnMutation.mutate()}
                                    disabled={
                                        approveReturnMutation.isPending ||
                                        returnItems.some(ri => {
                                            const orig = borrowing.items?.find((i: BorrowingItemDetail) => i.borrowing_item_id === ri.borrowing_item_id);
                                            return ri.return_conditions.reduce((s, c) => s + c.quantity, 0) !== (orig?.quantity ?? 0);
                                        })
                                    }
                                    className="w-full bg-purple-600 text-white py-2 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {approveReturnMutation.isPending ? 'Memproses...' : 'Konfirmasi Pengembalian'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Foto Bukti Terlampir */}
                    {borrowing.photos && borrowing.photos.length > 0 && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                            <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Lampiran Foto</h3>
                            <div className="space-y-4">
                                {borrowing.photos.map((photo: BorrowingPhoto) => (
                                    <div key={photo.id} className="space-y-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                            Bukti {photo.type === 'borrow' ? 'Pengambilan' : 'Pengembalian'}
                                        </span>
                                        <a href={photo.url ?? photo.path} target="_blank" rel="noopener noreferrer" className="block border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                                            <img
                                                src={photo.url ?? photo.path}
                                                alt={`Bukti ${photo.type === 'borrow' ? 'pengambilan' : 'pengembalian'}`}
                                                className="w-full h-auto object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </a>
                                        <div className="text-xs text-neutral-400">
                                            Diunggah: {photo.uploaded_at ? new Date(photo.uploaded_at).toLocaleString('id-ID') : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action: Admin - Hapus Data */}
                    {isAdmin && TERMINAL_STATUSES.includes(borrowing.status) && (
                        <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-red-200 dark:border-red-900/40 p-6 space-y-3">
                            <h3 className="font-medium text-sm text-red-600 dark:text-red-400">Zona Berbahaya</h3>
                            <p className="text-xs text-neutral-500">
                                Hapus permanen seluruh data peminjaman ini beserta foto bukti. Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 text-sm transition-colors"
                            >
                                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Data Peminjaman'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
