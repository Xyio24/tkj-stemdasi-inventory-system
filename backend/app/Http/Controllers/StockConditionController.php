<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StockConditionController extends Controller
{
    // ─── GET /api/items/stock-conditions ─────────────────────────────────────

    /**
     * Daftar semua barang dengan breakdown stok per kondisi.
     *
     * Query params:
     *   search      — filter nama / brand / model
     *   category_id — filter per kategori
     *   has_damage  — "1" → hanya tampilkan yang ada rusak atau hilang
     *   per_page    — default 15
     */
    public function index(Request $request)
    {
        $query = Item::with('category')
            ->select([
                'id', 'name', 'slug', 'brand', 'model', 'type',
                'condition', 'category_id',
                'stock', 'stock_baik', 'stock_rusak_ringan',
                'stock_rusak_berat', 'stock_hilang',
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter: hanya tampilkan barang yang ada kerusakan / kehilangan
        if ($request->boolean('has_damage')) {
            $query->where(function ($q) {
                $q->where('stock_rusak_ringan', '>', 0)
                  ->orWhere('stock_rusak_berat', '>', 0)
                  ->orWhere('stock_hilang', '>', 0);
            });
        }

        $items = $query->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $items->items(),
            'meta'    => [
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'per_page'     => $items->perPage(),
                'total'        => $items->total(),
            ],
        ]);
    }

    // ─── POST /api/items/{item}/adjust-condition ──────────────────────────────

    /**
     * Pindahkan sejumlah unit dari satu kondisi ke kondisi lain.
     * Digunakan admin untuk koreksi kondisi stok
     * (misal: barang rusak ringan sudah diperbaiki → pindah ke baik).
     *
     * Body:
     *   from_condition  — kondisi asal: baik|rusak_ringan|rusak_berat|hilang
     *   to_condition    — kondisi tujuan: baik|rusak_ringan|rusak_berat|hilang
     *   quantity        — jumlah unit yang dipindah (min:1)
     *   notes           — opsional, keterangan alasan koreksi
     */
    public function adjust(Request $request, Item $item)
    {
        $conditionOptions = ['baik', 'rusak_ringan', 'rusak_berat', 'hilang'];

        $validated = $request->validate([
            'from_condition' => ['required', Rule::in($conditionOptions)],
            'to_condition'   => ['required', Rule::in($conditionOptions)],
            'quantity'       => ['required', 'integer', 'min:1'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ], [
            'from_condition.required' => 'Kondisi asal wajib diisi.',
            'from_condition.in'       => 'Kondisi asal tidak valid.',
            'to_condition.required'   => 'Kondisi tujuan wajib diisi.',
            'to_condition.in'         => 'Kondisi tujuan tidak valid.',
            'quantity.required'       => 'Jumlah unit yang dipindah wajib diisi.',
            'quantity.integer'        => 'Jumlah unit harus berupa angka.',
            'quantity.min'            => 'Jumlah unit minimal 1.',
        ]);

        // Kondisi asal dan tujuan tidak boleh sama
        if ($validated['from_condition'] === $validated['to_condition']) {
            return response()->json([
                'success' => false,
                'message' => 'Kondisi asal dan tujuan tidak boleh sama.',
            ], 422);
        }

        $fromCol = 'stock_' . $validated['from_condition'];
        $toCol   = 'stock_' . $validated['to_condition'];
        $qty     = (int) $validated['quantity'];

        // Validasi: stok di kondisi asal mencukupi
        if ($item->{$fromCol} < $qty) {
            return response()->json([
                'success' => false,
                'message' => "Stok kondisi '{$validated['from_condition']}' untuk barang '{$item->name}' hanya {$item->{$fromCol}} unit, tidak cukup untuk memindahkan {$qty} unit.",
            ], 422);
        }

        $before = [
            'stock'              => $item->stock,
            'stock_baik'         => $item->stock_baik,
            'stock_rusak_ringan' => $item->stock_rusak_ringan,
            'stock_rusak_berat'  => $item->stock_rusak_berat,
            'stock_hilang'       => $item->stock_hilang,
            'condition'          => $item->condition,
        ];

        // Pindahkan unit
        $item->{$fromCol} -= $qty;
        $item->{$toCol}   += $qty;

        // Sync total stock dan update kondisi mayoritas
        // Catatan: jika from atau to adalah 'hilang', stock total berubah
        // (hilang tidak masuk stock aktif)
        $item->syncStock();
        $item->updateConditionFromMajority();

        $after = [
            'stock'              => $item->stock,
            'stock_baik'         => $item->stock_baik,
            'stock_rusak_ringan' => $item->stock_rusak_ringan,
            'stock_rusak_berat'  => $item->stock_rusak_berat,
            'stock_hilang'       => $item->stock_hilang,
            'condition'          => $item->condition,
        ];

        $notesText = $validated['notes'] ?? null;

        ActivityLogService::log(
            'item.condition_adjusted',
            "Admin {$request->user()->name} memindahkan {$qty} unit '{$item->name}' dari kondisi '{$validated['from_condition']}' ke '{$validated['to_condition']}'" .
                ($notesText ? ". Catatan: {$notesText}" : '.'),
            $item,
            [
                'before' => $before,
                'after'  => $after,
                'moved'  => [
                    'from'     => $validated['from_condition'],
                    'to'       => $validated['to_condition'],
                    'quantity' => $qty,
                    'notes'    => $notesText,
                ],
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "{$qty} unit '{$item->name}' berhasil dipindahkan dari '{$validated['from_condition']}' ke '{$validated['to_condition']}'.",
            'data'    => $item->fresh('category'),
        ]);
    }
}
