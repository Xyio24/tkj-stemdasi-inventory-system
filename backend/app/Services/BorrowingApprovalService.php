<?php

namespace App\Services;

use App\Enums\BorrowingStatus;
use App\Models\Borrowing;
use App\Models\BorrowingItem;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BorrowingApprovalService
{
    /**
     * Approve a borrowing request (pending -> approved).
     * Deducts inventory stock.
     */
    public function approve(Borrowing $borrowing, ?string $notes, int $approverId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $notes, $approverId) {
            if ($borrowing->status !== BorrowingStatus::PENDING) {
                throw new HttpException(409, "Hanya pengajuan dengan status Pending yang dapat disetujui.");
            }

            $before = [
                'status' => $borrowing->status->value,
                'items' => []
            ];
            $after = [
                'status' => BorrowingStatus::APPROVED->value,
                'items' => []
            ];

            // Re-validate and deduct stock
            foreach ($borrowing->borrowingItems as $borrowItem) {
                $item = Item::where('id', $borrowItem->item_id)->lockForUpdate()->first();

                if (!$item) {
                    throw new HttpException(404, "Barang '{$borrowItem->item_id}' tidak ditemukan.");
                }

                if ($item->stock < $borrowItem->quantity) {
                    throw new HttpException(409, "Persetujuan gagal. Stok barang '{$item->name}' saat ini ({$item->stock}) kurang dari jumlah pengajuan ({$borrowItem->quantity}).");
                }

                $before['items'][] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => $item->stock
                ];

                // Deduct stock
                $item->stock -= $borrowItem->quantity;
                $item->save();

                $after['items'][] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => $item->stock
                ];
            }

            // Update borrowing
            $borrowing->update([
                'status' => BorrowingStatus::APPROVED,
                'approved_by' => $approverId,
                'approved_at' => now(),
                'notes' => $notes ?? $borrowing->notes,
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
                'status' => BorrowingStatus::REJECTED,
                'approved_by' => $approverId,
                'rejected_at' => now(),
                'rejection_reason' => $rejectionReason
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
     * Increments inventory stock.
     */
    public function approveReturn(Borrowing $borrowing, array $itemsData, ?string $returnNotes, int $approverId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $itemsData, $returnNotes, $approverId) {
            if ($borrowing->status !== BorrowingStatus::RETURNING) {
                throw new HttpException(409, "Hanya peminjaman dengan status Returning yang dapat dikonfirmasi pengembaliannya.");
            }

            $before = [
                'status' => $borrowing->status->value,
                'items' => []
            ];
            $after = [
                'status' => BorrowingStatus::RETURNED->value,
                'items' => []
            ];

            // Re-validate and return stock
            foreach ($itemsData as $itemData) {
                $borrowItem = BorrowingItem::where('id', $itemData['borrowing_item_id'])
                    ->where('borrowing_id', $borrowing->id)
                    ->first();

                if (!$borrowItem) {
                    throw new HttpException(404, "Item peminjaman dengan ID {$itemData['borrowing_item_id']} tidak ditemukan.");
                }

                if ($itemData['returned_quantity'] > $borrowItem->quantity) {
                    throw new HttpException(422, "Jumlah barang yang dikembalikan tidak boleh melebihi jumlah yang dipinjam.");
                }

                $item = Item::where('id', $borrowItem->item_id)->lockForUpdate()->first();

                if (!$item) {
                    throw new HttpException(404, "Barang dengan ID {$borrowItem->item_id} tidak ditemukan.");
                }

                $before['items'][] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => $item->stock,
                    'condition' => $item->condition
                ];

                // Update borrowing item details
                $borrowItem->update([
                    'returned_quantity' => $itemData['returned_quantity'],
                    'item_condition_in' => $itemData['item_condition_in'],
                ]);

                // Increment stock
                $item->stock += $itemData['returned_quantity'];
                $item->save();

                $after['items'][] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'stock' => $item->stock,
                    'condition' => $item->condition
                ];
            }

            // Update borrowing header
            $borrowing->update([
                'status' => BorrowingStatus::RETURNED,
                'return_approved_by' => $approverId,
                'return_approved_at' => now(),
                'return_notes' => $returnNotes,
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
