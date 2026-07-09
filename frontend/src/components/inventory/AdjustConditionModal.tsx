import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adjustItemCondition } from '@/api/stockCondition';
import type { Item } from '@/api/inventory';
import type { ConditionKey } from '@/api/stockCondition';
import { toast } from 'sonner';
import { X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    item: Item;
    isOpen: boolean;
    onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONDITION_OPTIONS: { value: ConditionKey; label: string }[] = [
    { value: 'baik', label: 'Baik' },
    { value: 'rusak_ringan', label: 'Rusak Ringan' },
    { value: 'rusak_berat', label: 'Rusak Berat' },
    { value: 'hilang', label: 'Hilang' },
];

const CONDITION_STOCK_KEY: Record<ConditionKey, keyof Item> = {
    baik:         'stock_baik',
    rusak_ringan: 'stock_rusak_ringan',
    rusak_berat:  'stock_rusak_berat',
    hilang:       'stock_hilang',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdjustConditionModal({ item, isOpen, onClose }: Props) {
    const queryClient = useQueryClient();

    const [fromCondition, setFromCondition] = useState<ConditionKey>('rusak_ringan');
    const [toCondition, setToCondition] = useState<ConditionKey>('baik');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const maxQty = (item[CONDITION_STOCK_KEY[fromCondition]] as number) ?? 0;

    const mutation = useMutation({
        mutationFn: () =>
            adjustItemCondition(item.id, {
                from_condition: fromCondition,
                to_condition: toCondition,
                quantity,
                notes: notes || undefined,
            }),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['stock-conditions'] });
            queryClient.invalidateQueries({ queryKey: ['items'] });
            onClose();
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Gagal mengkoreksi kondisi stok.');
        },
    });

    const isValid =
        fromCondition !== toCondition &&
        quantity >= 1 &&
        quantity <= maxQty;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-neutral-900">Koreksi Kondisi Stok</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-all duration-150 active:scale-[0.95]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-5">
                    {/* Stok ringkasan */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {CONDITION_OPTIONS.map(opt => (
                            <div key={opt.value} className="bg-neutral-50 rounded-xl p-3">
                                <div className="font-semibold text-sm text-neutral-800">
                                    {item[CONDITION_STOCK_KEY[opt.value]] as number}
                                </div>
                                <div className="text-neutral-500 mt-0.5">{opt.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* From / To */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                                Dari Kondisi
                            </label>
                            <select
                                value={fromCondition}
                                onChange={e => {
                                    setFromCondition(e.target.value as ConditionKey);
                                    setQuantity(1);
                                }}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50"
                            >
                                {CONDITION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} ({item[CONDITION_STOCK_KEY[opt.value]] as number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                                Ke Kondisi
                            </label>
                            <select
                                value={toCondition}
                                onChange={e => setToCondition(e.target.value as ConditionKey)}
                                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50"
                            >
                                {CONDITION_OPTIONS.filter(o => o.value !== fromCondition).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                            Jumlah Unit <span className="text-neutral-400">(maks: {maxQty})</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={maxQty}
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50"
                        />
                        {maxQty === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                Tidak ada stok di kondisi ini.
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">
                            Catatan <span className="text-neutral-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Contoh: sudah diperbaiki oleh teknisi"
                            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all duration-200 ease-out active:scale-[0.97]"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => mutation.mutate()}
                        disabled={!isValid || mutation.isPending}
                        className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all duration-200 ease-out active:scale-[0.97]"
                    >
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan Koreksi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
