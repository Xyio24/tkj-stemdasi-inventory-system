import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createItem, updateItem, getItem, deleteItemImage } from '@/api/inventory';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Package,
    Tag,
    ImagePlus,
    X,
    Upload,
    LayoutGrid,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageCropModal from '@/components/common/ImageCropModal';

const STORAGE_URL = (import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage').replace(/\/+$/, '');

// ─── FormSection ──────────────────────────────────────────────────────────────

function FormSection({
    title,
    icon,
    children,
    delay,
}: {
    title:    string;
    icon:     React.ReactNode;
    children: React.ReactNode;
    delay?:   string;
}) {
    return (
        <div className={['glass-card overflow-hidden animate-fade-up', delay].filter(Boolean).join(' ')}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
    label,
    required,
    hint,
    children,
}: {
    label:     string;
    required?: boolean;
    hint?:     string;
    children:  React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label} {required && <span className="text-red-500 normal-case">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
        </div>
    );
}

// ─── Dropzone ─────────────────────────────────────────────────────────────────

function Dropzone({
    label,
    accept,
    multiple,
    onFiles,
    preview,
    hint,
}: {
    label:    string;
    accept:   string;
    multiple: boolean;
    onFiles:  (files: File[]) => void;
    preview?: string | null;
    hint?:    string;
}) {
    const inputRef                    = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`Upload ${label}`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={[
                'relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer select-none',
                'flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[120px]',
                isDragging
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]'
                    : preview
                    ? 'border-border/40 bg-accent/30'
                    : 'border-border/60 hover:border-primary/40 hover:bg-accent/20 active:scale-[0.99]',
            ].join(' ')}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="sr-only"
                onChange={e => onFiles(Array.from(e.target.files ?? []))}
            />

            {preview ? (
                <div className="w-full flex flex-col items-center gap-2">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-h-32 rounded-2xl object-contain shadow-glass"
                    />
                    <span className="text-xs text-muted-foreground">Klik untuk mengganti</span>
                </div>
            ) : (
                <>
                    <div className={[
                        'w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isDragging
                            ? 'bg-primary text-primary-foreground scale-110 shadow-glow-blue-sm'
                            : 'bg-accent text-muted-foreground',
                    ].join(' ')}>
                        <Upload className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Klik atau drag & drop</p>
                    </div>
                    {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
                </>
            )}
        </div>
    );
}

// ─── GalleryThumb ─────────────────────────────────────────────────────────────

function GalleryThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
    return (
        <div className="relative w-20 h-20 rounded-2xl border border-border/40 overflow-hidden group flex-shrink-0 animate-spring-in">
            <img src={src} alt="" className="object-cover w-full h-full" />
            <button
                type="button"
                onClick={onRemove}
                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                aria-label="Hapus gambar"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ItemForm() {
    const { id }      = useParams();
    const isEdit      = Boolean(id);
    const navigate    = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        category_id:   '',
        name:          '',
        description:   '',
        brand:         '',
        model:         '',
        type:          'non_consumable',
        stock_total:   '0',
        stock_minimum: '1',
        condition:     'baik',
        location:      '',
        is_available:  true,
    });

    const [coverImage,      setCoverImage]      = useState<File | null>(null);
    const [galleryImages,   setGalleryImages]   = useState<File[]>([]);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [existingGallery, setExistingGallery] = useState<any[]>([]);
    const [newGalleryPrev,  setNewGalleryPrev]  = useState<string[]>([]);
    const [cropSrc,         setCropSrc]         = useState<string | null>(null);

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

    const { data: itemData, isLoading: itemLoading } = useQuery({
        queryKey: ['items', id],
        queryFn:  () => getItem(Number(id)),
        enabled:  isEdit,
    });

    useEffect(() => {
        if (isEdit && itemData?.data) {
            const item = itemData.data;
            const isConsumable = item.type === 'consumable';
            setFormData({
                category_id:   String(item.category_id),
                name:          item.name,
                description:   item.description || '',
                brand:         item.brand || '',
                model:         item.model || '',
                type:          item.type || 'non_consumable',
                // Untuk consumable: tampilkan stock aktif (bukan stock_total historis)
                stock_total:   isConsumable ? String(item.stock) : String(item.stock_total),
                stock_minimum: String(item.stock_minimum),
                condition:     item.condition,
                location:      item.location || '',
                is_available:  item.is_available,
            });
            if (item.image)  setCoverPreviewUrl(`${STORAGE_URL}/${item.image}`);
            if (item.images) setExistingGallery(item.images);
        }
    }, [itemData, isEdit]);

    const mutation = useMutation({
        mutationFn: (data: FormData) => isEdit ? updateItem(Number(id), data) : createItem(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items'] });
            toast.success(`Barang berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`);
            navigate('/dashboard/items');
        },
        onError: (err: any) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                const first = Object.values(errors).flat()[0] as string;
                toast.error(first || err.response?.data?.message || 'Validasi gagal');
            } else {
                toast.error(err.response?.data?.message || 'Terjadi kesalahan');
            }
        },
    });

    const deleteImageMutation = useMutation({
        mutationFn: (imageId: number) => deleteItemImage(Number(id), imageId),
        onSuccess: (_, imageId) => {
            toast.success('Gambar dihapus');
            setExistingGallery(prev => prev.filter(img => img.id !== imageId));
        },
    });

    function set(key: string, value: string | boolean) {
        setFormData(prev => ({ ...prev, [key]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
        });
        if (coverImage) data.append('cover_image', coverImage);
        galleryImages.forEach(file => data.append('gallery_images[]', file));
        mutation.mutate(data);
    }

    function handleCoverFiles(files: File[]) {
        const file = files[0];
        if (!file) return;
        // Buka crop modal, terapkan setelah crop dikonfirmasi
        setCropSrc(URL.createObjectURL(file));
    }

    function handleCropConfirm(croppedFile: File) {
        setCoverImage(croppedFile);
        setCoverPreviewUrl(URL.createObjectURL(croppedFile));
        setCropSrc(null);
    }

    function handleCropCancel() {
        setCropSrc(null);
    }

    function handleGalleryFiles(files: File[]) {
        setGalleryImages(prev => [...prev, ...files]);
        setNewGalleryPrev(prev => [
            ...prev,
            ...files.map(f => URL.createObjectURL(f)),
        ]);
    }

    function removeNewGallery(index: number) {
        setGalleryImages(prev => prev.filter((_, i) => i !== index));
        setNewGalleryPrev(prev => prev.filter((_, i) => i !== index));
    }

    const inputCls = 'input-ios';

    // ── Loading skeleton ──
    if (isEdit && itemLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-48 rounded-3xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 animate-fade-up">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-2xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.93] flex-shrink-0"
                    aria-label="Kembali"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        {isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {isEdit
                            ? 'Perbarui informasi barang inventaris'
                            : 'Daftarkan barang baru ke inventaris TKJ'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* ── 1. Informasi Dasar ── */}
                <FormSection
                    title="Informasi Dasar"
                    icon={<Package className="w-4 h-4 text-primary" />}
                    delay="delay-75"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Nama Barang" required>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder="Contoh: Cisco Switch 24 Port"
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Kategori" required>
                            <select
                                required
                                value={formData.category_id}
                                onChange={e => set('category_id', e.target.value)}
                                className={inputCls + ' appearance-none cursor-pointer'}
                            >
                                <option value="">Pilih Kategori</option>
                                {categories?.data?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Merk / Brand">
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={e => set('brand', e.target.value)}
                                placeholder="Cisco, TP-Link, APC..."
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Model / Seri">
                            <input
                                type="text"
                                value={formData.model}
                                onChange={e => set('model', e.target.value)}
                                placeholder="WS-C2960-24TC..."
                                className={inputCls}
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Deskripsi & Spesifikasi">
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => set('description', e.target.value)}
                                    placeholder="Spesifikasi teknis, keterangan tambahan, dll."
                                    className={inputCls + ' resize-none'}
                                />
                            </Field>
                        </div>
                    </div>
                </FormSection>

                {/* ── 2. Jenis Barang ── */}
                <FormSection
                    title="Jenis Barang"
                    icon={<Tag className="w-4 h-4 text-primary" />}
                    delay="delay-100"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([
                            {
                                value: 'non_consumable',
                                title: 'Non-Consumable',
                                desc:  'Dapat dipinjam dan wajib dikembalikan.',
                                sub:   'Laptop, kabel, akses poin, dll.',
                                ring:  'border-primary bg-primary/5 dark:bg-primary/10',
                                radio: 'accent-primary',
                                text:  'text-primary',
                            },
                            {
                                value: 'consumable',
                                title: 'Consumable',
                                desc:  'Sekali pakai, bisa habis terpakai.',
                                sub:   'Konektor RJ45, isolasi, tinta, dll.',
                                ring:  'border-amber-400 bg-amber-50/60 dark:bg-amber-900/15',
                                radio: 'accent-amber-500',
                                text:  'text-amber-600 dark:text-amber-400',
                            },
                        ] as const).map(opt => {
                            const sel = formData.type === opt.value;
                            return (
                                <label
                                    key={opt.value}
                                    className={[
                                        'flex items-start gap-3.5 p-4 rounded-3xl border-2 cursor-pointer',
                                        'transition-all duration-200 ease-spring',
                                        sel ? opt.ring : 'border-border/60 hover:border-border',
                                    ].join(' ')}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={opt.value}
                                        checked={sel}
                                        onChange={e => set('type', e.target.value)}
                                        className={['mt-1 w-4 h-4', opt.radio].join(' ')}
                                    />
                                    <div>
                                        <p className={['text-sm font-semibold', sel ? opt.text : 'text-foreground'].join(' ')}>
                                            {opt.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{opt.sub}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </FormSection>

                {/* ── 3. Stok & Kondisi ── */}
                <FormSection
                    title="Stok & Kondisi"
                    icon={<LayoutGrid className="w-4 h-4 text-primary" />}
                    delay="delay-150"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                        <Field
                            label={formData.type === 'consumable' ? 'Stok Aktif Saat Ini' : 'Total Stok Fisik'}
                            required
                            hint={formData.type === 'consumable'
                                ? (isEdit ? 'Jumlah sisa stok yang tersedia sekarang.' : 'Stok awal yang tersedia.')
                                : (!isEdit ? 'Stok aktif mengikuti total awal.' : undefined)}
                        >
                            <input
                                required
                                type="number"
                                min="0"
                                value={formData.stock_total}
                                onChange={e => set('stock_total', e.target.value)}
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Stok Minimum">
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.stock_minimum}
                                onChange={e => set('stock_minimum', e.target.value)}
                                className={inputCls}
                            />
                        </Field>

                        <Field label="Kondisi">
                            <select
                                value={formData.condition}
                                onChange={e => set('condition', e.target.value)}
                                className={inputCls + ' appearance-none cursor-pointer'}
                            >
                                <option value="baik">Baik</option>
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                            </select>
                        </Field>

                        <Field label="Lokasi Penyimpanan">
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => set('location', e.target.value)}
                                placeholder="Lemari A1"
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    {/* Available toggle */}
                    <label className="flex items-center gap-3 mt-5 p-3.5 rounded-2xl hover:bg-accent/40 transition-colors duration-150 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={formData.is_available}
                            onChange={e => set('is_available', e.target.checked)}
                            className="w-4 h-4 rounded accent-primary"
                        />
                        <div>
                            <p className="text-sm font-medium text-foreground">Bisa Dipinjam (Tersedia)</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Hilangkan centang untuk menonaktifkan peminjaman barang ini
                            </p>
                        </div>
                    </label>
                </FormSection>

                {/* ── 4. Gambar ── */}
                <FormSection
                    title="Gambar"
                    icon={<ImagePlus className="w-4 h-4 text-primary" />}
                    delay="delay-200"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Cover */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Foto Utama (Cover)
                            </p>
                            <Dropzone
                                label="Upload Cover"
                                accept=".jpg,.jpeg,.png,.webp"
                                multiple={false}
                                onFiles={handleCoverFiles}
                                preview={coverImage ? coverPreviewUrl : (coverPreviewUrl ?? null)}
                                hint="JPG, PNG, WebP — maks 5MB"
                            />
                        </div>

                        {/* Gallery */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Foto Tambahan (Gallery)
                            </p>

                            {/* Existing thumbs */}
                            {existingGallery.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {existingGallery.map(img => (
                                        <GalleryThumb
                                            key={img.id}
                                            src={`${STORAGE_URL}/${img.path}`}
                                            onRemove={() => deleteImageMutation.mutate(img.id)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* New thumbs */}
                            {newGalleryPrev.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {newGalleryPrev.map((src, i) => (
                                        <GalleryThumb
                                            key={src}
                                            src={src}
                                            onRemove={() => removeNewGallery(i)}
                                        />
                                    ))}
                                </div>
                            )}

                            <Dropzone
                                label="Tambah Foto"
                                accept=".jpg,.jpeg,.png,.webp"
                                multiple
                                onFiles={handleGalleryFiles}
                                hint="Pilih beberapa file — maks 5MB/file"
                            />
                        </div>
                    </div>

                    {/* Info note */}
                    <div className="flex gap-2.5 mt-4 bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-700/20 rounded-2xl px-4 py-3">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                            Foto tersimpan dapat dihapus dengan hover lalu klik. Foto baru tampil di galeri setelah disimpan.
                        </p>
                    </div>
                </FormSection>

                {/* ── Submit footer ── */}
                <div className="glass-card px-6 py-4 flex items-center justify-between gap-3 animate-fade-up delay-300">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        {isEdit
                            ? 'Perubahan akan disimpan setelah klik Simpan.'
                            : 'Barang baru akan langsung tersedia di inventaris.'}
                    </p>
                    <div className="flex gap-3 ml-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                            disabled={mutation.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            loading={mutation.isPending}
                            disabled={mutation.isPending}
                            className="px-8"
                        >
                            {mutation.isPending
                                ? 'Menyimpan...'
                                : isEdit ? 'Simpan Perubahan' : 'Simpan Barang'}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Crop Modal — untuk foto cover barang */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={16 / 9}
                    title="Sesuaikan Foto Barang"
                    outputFilename="cover.jpg"
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}
        </div>
    );
}
