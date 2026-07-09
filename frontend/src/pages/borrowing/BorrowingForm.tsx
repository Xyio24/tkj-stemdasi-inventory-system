import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getItems } from '@/api/inventory';
import type { Item } from '@/api/inventory';
import { createBorrowing } from '@/api/borrowing';
import type { CreateBorrowingPayload, BorrowingItemPayload } from '@/api/borrowing';
import { toast } from 'sonner';

export default function BorrowingForm() {
    const navigate = useNavigate();
    const [purpose, setPurpose] = useState('');
    const [borrowDate, setBorrowDate] = useState('');
    const [expectedReturnDate, setExpectedReturnDate] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedItems, setSelectedItems] = useState<(BorrowingItemPayload & { name: string, max: number })[]>([]);

    const [searchItem, setSearchItem] = useState('');

    const { data: itemsData, isLoading: isLoadingItems } = useQuery({
        queryKey: ['items-search', searchItem],
        queryFn: () => getItems({ search: searchItem || undefined, per_page: 20 }),
        enabled: true,
    });

    const createMutation = useMutation({
        mutationFn: createBorrowing,
        onSuccess: () => {
            toast.success('Peminjaman berhasil dibuat');
            navigate('/dashboard/borrowings');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Gagal membuat peminjaman');
        }
    });

    const handleAddItem = (item: Item) => {
        if (selectedItems.find(i => i.item_id === item.id)) {
            toast.error('Barang sudah ditambahkan');
            return;
        }
        if (item.stock <= 0) {
            toast.error('Stok barang habis');
            return;
        }
        setSelectedItems([...selectedItems, { item_id: item.id, quantity: 1, name: item.name, max: item.stock }]);
    };

    const handleRemoveItem = (id: number) => {
        setSelectedItems(selectedItems.filter(i => i.item_id !== id));
    };

    const handleQuantityChange = (id: number, qty: number, max: number) => {
        if (qty < 1) qty = 1;
        if (qty > max) qty = max;
        setSelectedItems(selectedItems.map(i => i.item_id === id ? { ...i, quantity: qty } : i));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            toast.error('Pilih minimal satu barang');
            return;
        }

        const payload: CreateBorrowingPayload = {
            purpose,
            borrow_date: borrowDate,
            expected_return_date: expectedReturnDate,
            notes,
            items: selectedItems.map(({ item_id, quantity }) => ({ item_id, quantity }))
        };

        createMutation.mutate(payload);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-neutral-500 hover:text-neutral-900">
                    &larr; Kembali
                </button>
                <h2 className="text-2xl font-semibold">Buat Peminjaman Baru</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                        <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Informasi Peminjaman</h3>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Keperluan *</label>
                            <input
                                type="text"
                                required
                                value={purpose}
                                onChange={e => setPurpose(e.target.value)}
                                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                                placeholder="Contoh: Praktikum Jaringan"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tanggal Pinjam *</label>
                                <input
                                    type="date"
                                    required
                                    value={borrowDate}
                                    onChange={e => setBorrowDate(e.target.value)}
                                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tenggat Kembali *</label>
                                <input
                                    type="date"
                                    required
                                    value={expectedReturnDate}
                                    onChange={e => setExpectedReturnDate(e.target.value)}
                                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Catatan Tambahan</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                                rows={3}
                            ></textarea>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {createMutation.isPending ? 'Menyimpan...' : 'Ajukan Peminjaman'}
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-neutral-900 shadow-sm rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 flex flex-col h-full">
                        <h3 className="font-medium text-lg border-b border-neutral-100 dark:border-neutral-800 pb-2">Pilih Barang</h3>
                        
                        <input
                            type="text"
                            placeholder="Cari barang untuk ditambahkan..."
                            value={searchItem}
                            onChange={e => setSearchItem(e.target.value)}
                            className="w-full border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 dark:bg-neutral-800"
                        />

                        <div className="border border-neutral-200 dark:border-neutral-800 rounded-md max-h-[200px] overflow-y-auto">
                            {isLoadingItems ? (
                                <div className="p-3 text-center text-sm text-neutral-400">Memuat barang...</div>
                            ) : itemsData?.data?.length === 0 ? (
                                <div className="p-3 text-center text-sm text-neutral-400">
                                    {searchItem ? `Barang "${searchItem}" tidak ditemukan.` : 'Tidak ada barang tersedia.'}
                                </div>
                            ) : (
                                itemsData?.data?.map((item: Item) => (
                                    <div key={item.id} className="flex justify-between items-center p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <div>
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-neutral-500">
                                                Stok: {item.stock} · {item.condition}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem(item)}
                                            disabled={item.stock <= 0 || selectedItems.some(i => i.item_id === item.id)}
                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {item.stock <= 0 ? 'Habis' : selectedItems.some(i => i.item_id === item.id) ? 'Ditambahkan' : 'Tambah'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex-1">
                            <h4 className="font-medium text-sm mb-2 text-neutral-600 dark:text-neutral-400">Barang Terpilih ({selectedItems.length})</h4>
                            {selectedItems.length === 0 ? (
                                <div className="text-center text-neutral-500 text-sm py-4 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-md">
                                    Belum ada barang yang dipilih
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedItems.map(item => (
                                        <div key={item.item_id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-950 p-3 rounded-md border border-neutral-200 dark:border-neutral-800">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{item.name}</div>
                                                <div className="text-xs text-neutral-500">Maks: {item.max}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.max}
                                                    value={item.quantity}
                                                    onChange={e => handleQuantityChange(item.item_id, parseInt(e.target.value) || 1, item.max)}
                                                    className="w-16 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-1 text-sm dark:bg-neutral-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.item_id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
