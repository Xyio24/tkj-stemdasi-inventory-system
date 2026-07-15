<?php

namespace App\Http\Controllers;

use App\Enums\BorrowingStatus;
use App\Exports\BorrowingReportExport;
use App\Exports\InventoryReportExport;
use App\Exports\ReturnReportExport;
use App\Models\Borrowing;
use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    /**
     * Laporan Peminjaman — data JSON (untuk ditampilkan di halaman)
     */
    public function borrowingReport(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
            'status'    => ['nullable', 'in:pending,approved,rejected,returning,returned,cancelled'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $data = Borrowing::query()
            ->with(['user:id,name,nis_nip', 'approvedBy:id,name', 'borrowingItems.item:id,name'])
            ->when($request->date_from, fn ($q) => $q->whereDate('borrow_date', '>=', $request->date_from))
            ->when($request->date_to,   fn ($q) => $q->whereDate('borrow_date', '<=', $request->date_to))
            ->when($request->status,    fn ($q) => $q->where('status', $request->status))
            ->orderBy('borrow_date', 'desc')
            ->paginate($request->integer('per_page', 15));

        $statusMap = [
            'pending'   => 'Menunggu',
            'approved'  => 'Disetujui',
            'rejected'  => 'Ditolak',
            'returning' => 'Pengembalian',
            'returned'  => 'Dikembalikan',
            'cancelled' => 'Dibatalkan',
        ];

        $items = $data->getCollection()->map(fn (Borrowing $b) => [
            'id'                   => $b->id,
            'code'                 => $b->code,
            'user'                 => $b->user ? ['id' => $b->user->id, 'name' => $b->user->name, 'nis_nip' => $b->user->nis_nip] : null,
            'status'               => $b->status instanceof BorrowingStatus ? $b->status->value : (string) $b->status,
            'status_label'         => $statusMap[$b->status instanceof BorrowingStatus ? $b->status->value : (string) $b->status] ?? '-',
            'purpose'              => $b->purpose,
            'borrow_date'          => $b->borrow_date?->format('Y-m-d'),
            'expected_return_date' => $b->expected_return_date?->format('Y-m-d'),
            'items_count'          => $b->borrowingItems->sum('quantity'),
            'items'                => $b->borrowingItems->map(fn ($bi) => [
                'name'     => $bi->item?->name,
                'quantity' => $bi->quantity,
            ]),
            'approved_by'   => $b->approvedBy?->name,
            'approved_at'   => $b->approved_at?->format('Y-m-d H:i'),
            'created_at'    => $b->created_at->format('Y-m-d H:i'),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $data->currentPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
                'last_page'    => $data->lastPage(),
            ],
        ]);
    }

    /**
     * Laporan Pengembalian — data JSON
     */
    public function returnReport(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $data = Borrowing::query()
            ->with(['user:id,name,nis_nip', 'returnApprovedBy:id,name', 'borrowingItems.item:id,name'])
            ->where('status', 'returned')
            ->when($request->date_from, fn ($q) => $q->whereDate('return_approved_at', '>=', $request->date_from))
            ->when($request->date_to,   fn ($q) => $q->whereDate('return_approved_at', '<=', $request->date_to))
            ->orderBy('return_approved_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        $conditionMap = [
            'baik'         => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat'  => 'Rusak Berat',
        ];

        $items = $data->getCollection()->map(fn (Borrowing $b) => [
            'id'                   => $b->id,
            'code'                 => $b->code,
            'user'                 => $b->user ? ['id' => $b->user->id, 'name' => $b->user->name, 'nis_nip' => $b->user->nis_nip] : null,
            'borrow_date'          => $b->borrow_date?->format('Y-m-d'),
            'expected_return_date' => $b->expected_return_date?->format('Y-m-d'),
            'return_approved_at'   => $b->return_approved_at?->format('Y-m-d H:i'),
            'return_approved_by'   => $b->returnApprovedBy?->name,
            'return_notes'         => $b->return_notes,
            'items'                => $b->borrowingItems->map(fn ($bi) => [
                'name'              => $bi->item?->name,
                'quantity'          => $bi->quantity,
                'returned_quantity' => $bi->returned_quantity,
                'condition_in'      => $bi->item_condition_in,
                'condition_label'   => $conditionMap[$bi->item_condition_in ?? ''] ?? '-',
            ]),
            'created_at' => $b->created_at->format('Y-m-d H:i'),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $data->currentPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
                'last_page'    => $data->lastPage(),
            ],
        ]);
    }

    /**
     * Laporan Inventaris — data JSON
     */
    public function inventoryReport(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'condition'   => ['nullable', 'in:baik,rusak_ringan,rusak_berat'],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $data = Item::query()
            ->with('category:id,name')
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->condition,   fn ($q) => $q->where('condition', $request->condition))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15));

        $conditionMap = [
            'baik'         => 'Baik',
            'rusak_ringan' => 'Rusak Ringan',
            'rusak_berat'  => 'Rusak Berat',
        ];

        $items = $data->getCollection()->map(fn (Item $item) => [
            'id'            => $item->id,
            'name'          => $item->name,
            'category'      => $item->category ? ['id' => $item->category->id, 'name' => $item->category->name] : null,
            'brand'         => $item->brand,
            'model'         => $item->model,
            'stock'         => $item->stock,
            'stock_total'   => $item->stock_total,
            'stock_minimum' => $item->stock_minimum,
            'condition'     => is_string($item->condition) ? $item->condition : ($item->condition?->value ?? '-'),
            'condition_label' => $conditionMap[is_string($item->condition) ? $item->condition : ($item->condition?->value ?? '')] ?? '-',
            'location'      => $item->location,
            'is_available'  => $item->is_available,
            'created_at'    => $item->created_at->format('Y-m-d'),
        ]);

        // Also return categories for filter dropdown
        $categories = Category::orderBy('name')->get(['id', 'name']);

        return response()->json([
            'success'    => true,
            'data'       => $items,
            'categories' => $categories,
            'meta'       => [
                'current_page' => $data->currentPage(),
                'per_page'     => $data->perPage(),
                'total'        => $data->total(),
                'last_page'    => $data->lastPage(),
            ],
        ]);
    }

    /**
     * Export Laporan Peminjaman ke Excel
     */
    public function exportBorrowing(Request $request): BinaryFileResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
            'status'    => ['nullable', 'in:pending,approved,rejected,returning,returned,cancelled'],
        ]);

        $filename = 'laporan-peminjaman-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(
            new BorrowingReportExport(
                dateFrom: $request->date_from,
                dateTo: $request->date_to,
                status: $request->status,
            ),
            $filename,
        );
    }

    /**
     * Export Laporan Pengembalian ke Excel
     */
    public function exportReturn(Request $request): BinaryFileResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $filename = 'laporan-pengembalian-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(
            new ReturnReportExport(
                dateFrom: $request->date_from,
                dateTo: $request->date_to,
            ),
            $filename,
        );
    }

    /**
     * Export Laporan Inventaris ke Excel
     */
    public function exportInventory(Request $request): BinaryFileResponse
    {
        $request->validate([
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'condition'   => ['nullable', 'in:baik,rusak_ringan,rusak_berat'],
        ]);

        $filename = 'laporan-inventaris-' . now()->format('Ymd-His') . '.xlsx';

        return Excel::download(
            new InventoryReportExport(
                categoryId: $request->integer('category_id') ?: null,
                condition: $request->condition,
            ),
            $filename,
        );
    }
}
