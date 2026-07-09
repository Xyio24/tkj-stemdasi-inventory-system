<?php

namespace App\Services;

use App\Enums\BorrowingStatus;
use App\Models\Borrowing;
use App\Models\BorrowingItem;
use App\Models\BorrowingItemReturn;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BorrowingApprovalService
{
    /**
     * Approve a borrowing request (pending -> approved).
     * Deducts inventory stock — only stock_baik counts as available.
     */
    public function approve(Borrowing $borrowing, ?string $notes, int $approverId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $notes, $approverId) {
            if ($borrowing->status !== BorrowingStatus::PENDING) {
                throw new HttpException(409, "Hanya pengajuan dengan status Pending yang dapat disetujui.");
            }

            $before = ['status' => $borrowing->status->value, 'items' => []];
            $after  = ['status' => BorrowingStatus::APPROVED->value, 'items' => []];

            foreach ($borrowing->borrowingItems as $borrowItem) {
                $item = Item::where('id', $borrowItem->item_id)->lockForUpdate()->first();

                if (! $item) {
                    throw new HttpException(404, "Barang dengan ID '{$borrowItem->item_id}' tidak ditemukan.");
                }

                // Hanya stock_baik yang dihitung sebagai stok tersedia untuk dipinjam
                if ($item->stock_baik < $borrowItem->quantity) {
                    throw new HttpException(409, "Persetujuan gagal. Stok barang '{$item->name}' yang tersedia (kondisi baik: {$item->stock_baik}) kurang dari jumlah pengajuan ({$borrowItem->quantity}).");
                }

                $before['items'][] = [
                    'id'         => $item->id,
                    'name'       => $item->name,
                    'stock'      => $item->stock,
                    'stock_baik' => $item->stock_baik,
                ];

                // Kurangi dari stock_baik dan sync total stock
                $item->stock_baik -= $borrowItem->quantity;
                $item->syncStock();

                $after['items'][] = [
                    'id'         => $item->id,
                    'name'       => $item->name,
                    'stock'      => $item->stock,
                    'stock_baik' => $item->stock_baik,
                ];
            }

            $borrowing->update([
                'status'      => BorrowingStatus::APPROVED,
                'approved_by' => $approverId,
                'approved_at' => now(),
                'notes'       => $notes ?? $borrowing->notes,
            ]);

            ActivityLogService::log(
                'borrowing.approved',
                "Peminjaman {$borrowing->code} disetujui oleh guru.",
                $borrowing,
                ['before' => $before, 'after' => $after]
            );

            return $borrowing;
        });
    }

    /**
     * Reject a borrowing request (pending -> rejected).
     */
    public function reject(Borrowing $borrowing, string $rejectionReason, int $approverId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $rejectionReason, $approverId) {
            if ($borrowing->status !== BorrowingStatus::PENDING) {
                throw new HttpException(409, "Hanya pengajuan dengan status Pending yang dapat ditolak.");
            }

            $before = ['status' => $borrowing->status->value];

            $borrowing->update([
                'status'           => BorrowingStatus::REJECTED,
                'approved_by'      => $approverId,
                'rejected_at'      => now(),
                'rejection_reason' => $rejectionReason,
            ]);

            ActivityLogService::log(
                'borrowing.rejected',
                "Peminjaman {$borrowing->code} ditolak oleh guru. Alasan: {$rejectionReason}",
                $borrowing,
                ['before' => $before, 'after' => ['status' => BorrowingStatus::REJECTED->value, 'reason' => $rejectionReason]]
            );

            return $borrowing;
        });
    }

    /**
     * Approve returned items (returning -> returned).
     *
     * Setiap item di-breakdown per kondisi via borrowing_item_returns.
     * Pengaruh ke stok:
     *   baik         → stock_baik += qty, stock += qty
     *   rusak_ringan → stock_rusak_ringan += qty, stock += qty
     *   rusak_berat  → stock_rusak_berat += qty, stock += qty
     *   hilang       → stock_hilang += qty (stock tidak bertambah)
     *   terpakai     → tidak ada perubahan stok (consumable habis)
     */
    public function approveReturn(Borrowing $borrowing, array $itemsData, ?string $returnNotes, int $approverId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $itemsData, $returnNotes, $approverId) {
            if ($borrowing->status !== BorrowingStatus::RETURNING) {
                throw new HttpException(409, "Hanya peminjaman dengan status Returning yang dapat dikonfirmasi pengembaliannya.");
            }

            $before = ['status' => $borrowing->status->value, 'items' => []];
            $after  = ['status' => BorrowingStatus::RETURNED->value, 'items' => []];

            foreach ($itemsData as $itemData) {
                $borrowItem = BorrowingItem::where('id', $itemData['borrowing_item_id'])
                    ->where('borrowing_id', $borrowing->id)
                    ->first();

                if (! $borrowItem) {
                    throw new HttpException(404, "Item peminjaman dengan ID {$itemData['borrowing_item_id']} tidak ditemukan.");
                }

                $returnConditions = $itemData['return_conditions'];

                // Validasi: total qty semua kondisi harus == qty yang dipinjam
                $totalReturned = collect($returnConditions)->sum('quantity');
                if ($totalReturned !== $borrowItem->quantity) {
                    $item = Item::find($borrowItem->item_id);
                    $itemName = $item?->name ?? "ID {$borrowItem->item_id}";
                    throw new HttpException(
                        422,
                        "Total kondisi pengembalian untuk '{$itemName}' ({$totalReturned}) harus sama dengan jumlah yang dipinjam ({$borrowItem->quantity})."
                    );
                }

                $item = Item::where('id', $borrowItem->item_id)->lockForUpdate()->first();

                if (! $item) {
                    throw new HttpException(404, "Barang dengan ID {$borrowItem->item_id} tidak ditemukan.");
                }

                $before['items'][] = [
                    'id'                 => $item->id,
                    'name'               => $item->name,
                    'stock'              => $item->stock,
                    'stock_baik'         => $item->stock_baik,
                    'stock_rusak_ringan' => $item->stock_rusak_ringan,
                    'stock_rusak_berat'  => $item->stock_rusak_berat,
                    'stock_hilang'       => $item->stock_hilang,
                    'condition'          => $item->condition,
                ];

                // Simpan tiap kondisi ke borrowing_item_returns dan update stok
                foreach ($returnConditions as $condData) {
                    $condition = $condData['condition'];
                    $qty       = (int) $condData['quantity'];

                    // Simpan ke tabel borrowing_item_returns
                    BorrowingItemReturn::create([
                        'borrowing_item_id' => $borrowItem->id,
                        'condition'         => $condition,
                        'quantity'          => $qty,
                        'notes'             => $condData['notes'] ?? null,
                    ]);

                    // Update stok berdasarkan kondisi
                    match ($condition) {
                        'baik'         => $item->stock_baik += $qty,
                        'rusak_ringan' => $item->stock_rusak_ringan += $qty,
                        'rusak_berat'  => $item->stock_rusak_berat += $qty,
                        'hilang'       => $item->stock_hilang += $qty,
                        'terpakai'     => null, // consumable habis, tidak kembali ke stok
                        default        => null,
                    };
                }

                // Sync total stock dan update kondisi mayoritas
                $item->syncStock();
                $item->updateConditionFromMajority();

                // Update borrowing_item ringkasan:
                // returned_quantity = total yang kembali ke stok (tidak termasuk hilang)
                $returnedToStock = collect($returnConditions)
                    ->whereNotIn('condition', ['hilang'])
                    ->sum('quantity');

                // Kondisi mayoritas dari return_conditions (tidak termasuk hilang/terpakai)
                $conditionSummary = collect($returnConditions)
                    ->whereNotIn('condition', ['hilang', 'terpakai'])
                    ->sortByDesc('quantity')
                    ->first();

                $borrowItem->update([
                    'returned_quantity' => $returnedToStock,
                    'item_condition_in' => $conditionSummary['condition'] ?? 'baik',
                ]);

                $after['items'][] = [
                    'id'                 => $item->id,
                    'name'               => $item->name,
                    'stock'              => $item->stock,
                    'stock_baik'         => $item->stock_baik,
                    'stock_rusak_ringan' => $item->stock_rusak_ringan,
                    'stock_rusak_berat'  => $item->stock_rusak_berat,
                    'stock_hilang'       => $item->stock_hilang,
                    'condition'          => $item->condition,
                ];
            }

            $borrowing->update([
                'status'             => BorrowingStatus::RETURNED,
                'return_approved_by' => $approverId,
                'return_approved_at' => now(),
                'return_notes'       => $returnNotes,
            ]);

            ActivityLogService::log(
                'return.approved',
                "Pengembalian barang untuk peminjaman {$borrowing->code} telah disetujui oleh guru.",
                $borrowing,
                ['before' => $before, 'after' => $after]
            );

            return $borrowing;
        });
    }
}
