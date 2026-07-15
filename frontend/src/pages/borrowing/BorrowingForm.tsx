import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getItems, getCategories } from '@/api/inventory';
import type { Item, Category } from '@/api/inventory';
import { createBorrowing } from '@/api/borrowing';
import type { CreateBorrowingPayload, BorrowingItemPayload } from '@/api/borrowing';
import { toast } from 'sonner';
import {
    ArrowLeft, Search, Plus, X, Package,
    CalendarDays, FileText, ShoppingCart, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type SelectedItem = BorrowingItemPayload & { name: string; max: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABEL: Record<string, string> = {
    baik:         'Baik',
    rusak_ringan: 'Rusak Ringan',
    rusak_berat:  'Rusak Berat',
};

// ─── FormSection ──────────────────────────────────────────────────────────────

function FormSection({
    title, icon, children, delay, stretch,
}: {
    title: string; icon: React.ReactNode; children: React.ReactNode; delay?: string; stretch?: boolean;
}) {
    return (
        <div className={[
            'glass-card overflow-hidden animate-fade-up',
            stretch ? 'flex flex-col flex-1' : '',
            delay,
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

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, required, children }: {
    label: string; required?: boolean; children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label} {required && <span className="text-red-500 normal-case">*</span>}
            </label>
            {children}
        </div>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function BorrowingForm() {
    const navigate = useNavigate();

    const [purpose,             setPurpose]            = useState('');
    const [borrowDate,          setBorrowDate]          = useState('');
    const [expectedReturnDate,  setExpectedReturnDate]  = useState('');
    const [notes,               setNotes]               = useState('');
    const [selectedItems,       setSelectedItems]       = useState<SelectedItem[]>([]);
    const [searchItem,          setSearchItem]          = useState('');
    const [showSelector,        setShowSelector]        = useState(true);
    const [categoryId,          setCategoryId]          = useState<number | ''>('');

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn:  getCategories,
    });

    const { data: itemsData, isLoading: isLoadingItems } = useQuery({
        queryKey: ['items-search', searchItem, categoryId],
        queryFn:  () => getItems({
            search:      searchItem   || undefined,
            category_id: categoryId   || undefined,
            per_page:    20,
        }),
    });

    const createMutation = useMutation({
        mutationFn: createBorrowing,
        onSuccess: () => {
            toast.success('Peminjaman berhasil dibuat');
            navigate('/dashboard/borrowings');
        },
        onError: (e: any) => {
            toast.error(e.response?.data?.message || 'Gagal membuat peminjaman');
        },
    });

    function handleAddItem(item: Item) {
        if (selectedItems.find(i => i.item_id === item.id)) {
            toast.error('Barang sudah ditambahkan'); return;
        }
        if (item.stock <= 0) {
            toast.error('Stok barang habis'); return;
        }
        setSelectedItems(prev => [...prev, { item_id: item.id, quantity: 1, name: item.name, max: item.stock }]);
    }

    function handleRemove(id: number) {
        setSelectedItems(prev => prev.filter(i => i.item_id !== id));
    }

    function handleQty(id: number, qty: number, max: number) {
        const clamped = Math.min(Math.max(qty, 1), max);
        setSelectedItems(prev => prev.map(i => i.item_id === id ? { ...i, quantity: clamped } : i));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (selectedItems.length === 0) { toast.error('Pilih minimal satu barang'); return; }

        const payload: CreateBorrowingPayload = {
            purpose,
            borrow_date:           borrowDate,
            expected_return_date:  expectedReturnDate,
            notes,
            items: selectedItems.map(({ item_id, quantity }) => ({ item_id, quantity })),
        };
        createMutation.mutate(payload);
    }

    const inputCls = 'input-ios';
    const today    = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-4xl mx-auto space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-up">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-2xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150 active:scale-[0.93]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Buat Peminjaman Baru</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Isi detail peminjaman dan pilih barang</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

                    {/* ── Kiri: Info peminjaman ── */}
                    <div className="flex flex-col">
                        <FormSection title="Informasi Peminjaman" icon={<FileText className="w-4 h-4 text-primary" />} delay="delay-75" stretch>
                            <div className="space-y-4 flex flex-col flex-1">
                                <Field label="Keperluan" required>
                                    <input
                                        required
                                        type="text"
                                        value={purpose}
                                        onChange={e => setPurpose(e.target.value)}
                                        placeholder="Contoh: Praktikum Jaringan Komputer"
                                        className={inputCls}
                                    />
                                </Field>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Tgl Pinjam" required>
                                        <input
                                            required
                                            type="date"
                                            value={borrowDate}
                                            min={today}
                                            onChange={e => setBorrowDate(e.target.value)}
                                            className={inputCls}
                                        />
                                    </Field>
                                    <Field label="Tenggat Kembali" required>
                                        <input
                                            required
                                            type="date"
                                            value={expectedReturnDate}
                                            min={borrowDate || today}
                                            onChange={e => setExpectedReturnDate(e.target.value)}
                                            className={inputCls}
                                        />
                                    </Field>
                                </div>

                                <Field label="Catatan Tambahan">
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Keterangan tambahan (opsional)"
                                        className={inputCls + ' resize-none'}
                                    />
                                </Field>
                            </div>
                        </FormSection>
                    </div>

                    {/* ── Kanan: Pilih barang ── */}
                    <div className="flex flex-col">
                        <FormSection title="Pilih Barang" icon={<ShoppingCart className="w-4 h-4 text-primary" />} delay="delay-100" stretch>
                            <div className="space-y-3">

                                {/* Category filter */}
                                <div className="relative">
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none" />
                                    <select
                                        value={categoryId}
                                        onChange={e => {
                                            setCategoryId(e.target.value ? Number(e.target.value) : '');
                                            setShowSelector(true);
                                        }}
                                        className={inputCls + ' appearance-none cursor-pointer pr-9'}
                                    >
                                        <option value="">Semua Kategori</option>
                                        {categoriesData?.data?.map((cat: Category) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Search + tombol + */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none z-10" />
                                        <input
                                            type="text"
                                            placeholder="Cari barang..."
                                            value={searchItem}
                                            onChange={e => setSearchItem(e.target.value)}
                                            className={inputCls + ' pl-10'}
                                            onFocus={() => setShowSelector(true)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSelector(v => !v)}
                                        title="Tampilkan daftar barang"
                                        className={[
                                            'flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-[0.93]',
                                            showSelector
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20',
                                        ].join(' ')}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Item list */}
                                {showSelector && (
                                    <div className="border border-border/50 rounded-2xl overflow-hidden max-h-52 overflow-y-auto animate-fade-up">
                                        {isLoadingItems ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">Memuat...</div>
                                        ) : itemsData?.data?.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                {searchItem || categoryId
                                                    ? `Tidak ada barang${categoryId ? ' di kategori ini' : ''}${searchItem ? ` untuk "${searchItem}"` : ''}.`
                                                    : 'Tidak ada barang.'}
                                            </div>
                                        ) : (
                                            itemsData?.data?.map((item: Item) => {
                                                const added = selectedItems.some(i => i.item_id === item.id);
                                                const outOfStock = item.stock <= 0;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-0 hover:bg-accent/40 transition-colors duration-150"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Stok: {item.stock} · {CONDITION_LABEL[item.condition as string] ?? item.condition}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => { handleAddItem(item); setShowSelector(false); setSearchItem(''); }}
                                                            disabled={outOfStock || added}
                                                            className={[
                                                                'ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-xl transition-all duration-150',
                                                                added
                                                                    ? 'text-green-600 bg-green-100/80 dark:bg-green-900/30 cursor-default'
                                                                    : outOfStock
                                                                    ? 'text-muted-foreground bg-accent cursor-not-allowed opacity-50'
                                                                    : 'text-primary bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 active:scale-[0.95]',
                                                            ].join(' ')}
                                                        >
                                                            {added ? '✓ Ditambahkan' : outOfStock ? 'Habis' : '+ Tambah'}
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {/* Selected items */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                            Barang Dipilih ({selectedItems.length})
                                        </p>
                                        {showSelector && (
                                            <button
                                                type="button"
                                                onClick={() => { setShowSelector(false); setSearchItem(''); }}
                                                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
                                            >
                                                Tutup
                                            </button>
                                        )}
                                    </div>

                                    {selectedItems.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground">
                                            <Package className="w-8 h-8 opacity-30" />
                                            <p className="text-xs">Belum ada barang dipilih</p>
                                            <button
                                                type="button"
                                                onClick={() => setShowSelector(true)}
                                                className="text-xs text-primary font-semibold hover:underline"
                                            >
                                                + Cari & tambah barang
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedItems.map(item => (
                                                <div
                                                    key={item.item_id}
                                                    className="flex items-center gap-3 p-3 bg-accent/30 rounded-2xl border border-border/30 animate-fade-up"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">Maks: {item.max} unit</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {/* Qty stepper */}
                                                        <div className="flex items-center gap-1 bg-background rounded-xl border border-border/50 px-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQty(item.item_id, item.quantity - 1, item.max)}
                                                                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg transition-colors duration-150 text-sm font-bold"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={item.max}
                                                                value={item.quantity}
                                                                onChange={e => handleQty(item.item_id, parseInt(e.target.value) || 1, item.max)}
                                                                className="w-8 text-center text-sm font-semibold bg-transparent outline-none text-foreground"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQty(item.item_id, item.quantity + 1, item.max)}
                                                                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg transition-colors duration-150 text-sm font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(item.item_id)}
                                                            className="p-1.5 rounded-xl text-destructive hover:bg-destructive/8 dark:hover:bg-destructive/15 transition-all duration-150 active:scale-[0.93]"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FormSection>
                    </div>
                </div>

                {/* Submit footer */}
                <div className="glass-card px-5 py-4 flex items-center justify-between gap-3 animate-fade-up delay-200">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        {selectedItems.length > 0
                            ? `${selectedItems.length} barang dipilih · Total ${selectedItems.reduce((s, i) => s + i.quantity, 0)} unit`
                            : 'Pilih minimal satu barang untuk melanjutkan.'}
                    </p>
                    <div className="flex gap-3 ml-auto">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={createMutation.isPending}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            loading={createMutation.isPending}
                            disabled={createMutation.isPending || selectedItems.length === 0}
                            className="px-8"
                        >
                            {createMutation.isPending ? 'Mengajukan...' : 'Ajukan Peminjaman'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
