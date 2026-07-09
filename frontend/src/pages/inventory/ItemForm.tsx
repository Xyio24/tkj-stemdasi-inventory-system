import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createItem, updateItem, getItem, deleteItemImage } from '@/api/inventory';
import { toast } from 'sonner';

const STORAGE_URL = (import.meta.env.VITE_STORAGE_URL ?? 'http://localhost:8000/storage').replace(/\/+$/, '');

export default function ItemForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        category_id: '',
        name: '',
        description: '',
        brand: '',
        model: '',
        type: 'non_consumable',
        stock_total: '0',
        stock_minimum: '1',
        condition: 'baik',
        location: '',
        is_available: true
    });
    
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    
    // For edit preview
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [existingGallery, setExistingGallery] = useState<any[]>([]);

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

    const { data: itemData, isLoading: itemLoading } = useQuery({
        queryKey: ['items', id],
        queryFn: () => getItem(Number(id)),
        enabled: isEdit,
    });

    useEffect(() => {
        if (isEdit && itemData?.data) {
            const item = itemData.data;
            setFormData({
                category_id: String(item.category_id),
                name: item.name,
                description: item.description || '',
                brand: item.brand || '',
                model: item.model || '',
                type: item.type || 'non_consumable',
                stock_total: String(item.stock_total),
                stock_minimum: String(item.stock_minimum),
                condition: item.condition,
                location: item.location || '',
                is_available: item.is_available
            });
            if (item.image) {
                setCoverPreviewUrl(`${STORAGE_URL}/${item.image}`);
            }
            if (item.images) {
                setExistingGallery(item.images);
            }
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
            console.error('Item mutation error:', err);
            console.error('Response data:', err.response?.data);
            console.error('Validation errors:', err.response?.data?.errors);
            const errors = err.response?.data?.errors;
            if (errors) {
                const firstError = Object.values(errors).flat()[0] as string;
                toast.error(firstError || err.response?.data?.message || 'Validasi gagal');
            } else {
                toast.error(err.response?.data?.message || 'Terjadi kesalahan');
            }
        }
    });

    const deleteImageMutation = useMutation({
        mutationFn: (imageId: number) => deleteItemImage(Number(id), imageId),
        onSuccess: (_, imageId) => {
            toast.success('Gambar dihapus');
            setExistingGallery(prev => prev.filter(img => img.id !== imageId));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
        });

        if (coverImage) {
            data.append('cover_image', coverImage);
        }

        galleryImages.forEach(file => {
            data.append('gallery_images[]', file);
        });

        mutation.mutate(data);
    };

    if (isEdit && itemLoading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-150"
                >
                    &larr; Kembali
                </button>
                <h2 className="text-2xl font-bold tracking-tight">{isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="px-6 py-5 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nama Barang <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Kategori <span className="text-red-500">*</span></label>
                            <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150">
                                <option value="">Pilih Kategori</option>
                                {categories?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Merk / Brand</label>
                            <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Model / Seri</label>
                            <input type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi Spesifikasi</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                    </div>

                    {/* Jenis Barang */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Jenis Barang <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className={`flex items-start gap-3 p-3 border-2 rounded-2xl cursor-pointer transition-colors ${formData.type === 'non_consumable' ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="non_consumable"
                                    checked={formData.type === 'non_consumable'}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="mt-0.5 accent-indigo-600"
                                />
                                <div>
                                    <div className="text-sm font-medium">Non-Consumable</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Dapat dipinjam dan wajib dikembalikan. Contoh: laptop, kabel, akses poin.</div>
                                </div>
                            </label>
                            <label className={`flex items-start gap-3 p-3 border-2 rounded-2xl cursor-pointer transition-colors ${formData.type === 'consumable' ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="consumable"
                                    checked={formData.type === 'consumable'}
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                    className="mt-0.5 accent-amber-600"
                                />
                                <div>
                                    <div className="text-sm font-medium">Consumable</div>
                                    <div className="text-xs text-neutral-500 mt-0.5">Sekali pakai, bisa habis terpakai. Contoh: konektor RJ45, isolasi, tinta.</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <hr className="border-neutral-200" />

                    {/* Inventory Logic */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Stok Fisik <span className="text-red-500">*</span></label>
                            <input required type="number" min="0" value={formData.stock_total} onChange={e => setFormData({...formData, stock_total: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                            {!isEdit && <p className="text-xs text-neutral-500 mt-1">Stok aktif (bisa dipinjam) otomatis mengikuti total awal.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Batas Minimum Stok</label>
                            <input required type="number" min="1" value={formData.stock_minimum} onChange={e => setFormData({...formData, stock_minimum: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Kondisi</label>
                            <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150">
                                <option value="baik">Baik</option>
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Lokasi Penyimpanan</label>
                            <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Lemari A1" className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150" />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input type="checkbox" id="is_available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="h-4 w-4 text-indigo-600 rounded border-neutral-300" />
                        <label htmlFor="is_available" className="ml-2 block text-sm font-medium">Bisa Dipinjam (Tersedia)</label>
                    </div>

                    <hr className="border-neutral-200" />

                    {/* Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-medium mb-2">Foto Utama (Cover)</label>
                            {coverPreviewUrl && !coverImage && (
                                <div className="mb-4 relative w-48 aspect-video rounded-xl overflow-hidden border border-neutral-200">
                                    <img src={coverPreviewUrl} alt="Cover" className="object-cover w-full h-full" />
                                </div>
                            )}
                            <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setCoverImage(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-150" />
                            <p className="text-xs text-neutral-500 mt-1">Format: JPG, PNG, WebP. Maks 5MB.</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Foto Tambahan (Gallery)</label>
                            
                            {existingGallery.length > 0 && (
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {existingGallery.map(img => (
                                        <div key={img.id} className="relative w-20 h-20 rounded-xl border border-neutral-200 overflow-hidden group">
                                            <img src={`${STORAGE_URL}/${img.path}`} alt="" className="object-cover w-full h-full" />
                                            <button type="button" onClick={() => deleteImageMutation.mutate(img.id)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                                                Hapus
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={e => setGalleryImages(Array.from(e.target.files || []))} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-neutral-100 hover:file:bg-neutral-200 transition-all duration-150" />
                            <p className="text-xs text-neutral-500 mt-2">Bisa memilih lebih dari 1 file. Format: JPG, PNG, WebP. Maks 5MB per file.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="bg-white border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 ease-out active:scale-[0.97]"
                    >
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan Barang'}
                    </button>
                </div>
            </form>
        </div>
    );
}
