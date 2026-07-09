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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Koreksi Kondisi Stok</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stok ringkasan */}
                <div className="px-6 pt-4">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {CONDITION_OPTIONS.map(opt => (
                            <div key={opt.value} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2">
                                <div className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">
                                    {item[CONDITION_STOCK_KEY[opt.value]] as number}
                                </div>
                                <div className="text-neutral-500 mt-0.5">{opt.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <div className="px-6 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                Dari Kondisi
                            </label>
                            <select
                                value={fromCondition}
                                onChange={e => {
                                    setFromCondition(e.target.value as ConditionKey);
                                    setQuantity(1);
                                }}
                                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800"
                            >
                                {CONDITION_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label} ({item[CONDITION_STOCK_KEY[opt.value]] as number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                                Ke Kondisi
                            </label>
                            <select
                                value={toCondition}
                                onChange={e => setToCondition(e.target.value as ConditionKey)}
                                className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800"
                            >
                                {CONDITION_OPTIONS.filter(o => o.value !== fromCondition).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            Jumlah Unit <span className="text-neutral-400">(maks: {maxQty})</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={maxQty}
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800"
                        />
                        {maxQty === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                                Tidak ada stok di kondisi ini.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                            Catatan <span className="text-neutral-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Contoh: sudah diperbaiki oleh teknisi"
                            className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm dark:bg-neutral-800"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => mutation.mutate()}
                        disabled={!isValid || mutation.isPending}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {mutation.isPending ? 'Menyimpan...' : 'Simpan Koreksi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
