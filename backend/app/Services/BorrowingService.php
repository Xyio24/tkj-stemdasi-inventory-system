<?php

namespace App\Services;

use App\Enums\BorrowingStatus;
use App\Models\Borrowing;
use App\Models\BorrowingItem;
use App\Models\BorrowingPhoto;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BorrowingService
{
    /**
     * Create a borrowing request.
     */
    public function create(array $data, int $userId): Borrowing
    {
        return DB::transaction(function () use ($data, $userId) {
            // Generate Code: BRW-YYYYMMDD-XXXX
            $date = now()->format('Ymd');
            $prefix = "BRW-{$date}-";
            
            // Lock the table to prevent race conditions in code generation
            $latest = Borrowing::where('code', 'like', "{$prefix}%")
                ->lockForUpdate()
                ->orderBy('code', 'desc')
                ->first();

            $sequence = $latest ? intval(substr($latest->code, -4)) + 1 : 1;
            $code = $prefix . str_pad($sequence, 4, '0', STR_PAD_LEFT);

            // Create borrowing header
            $borrowing = Borrowing::create([
                'code' => $code,
                'user_id' => $userId,
                'status' => BorrowingStatus::PENDING,
                'purpose' => $data['purpose'],
                'notes' => $data['notes'] ?? null,
                'borrow_date' => $data['borrow_date'],
                'expected_return_date' => $data['expected_return_date'],
            ]);

            // Add items and validate stock (using lock for update)
            foreach ($data['items'] as $itemData) {
                $item = Item::where('id', $itemData['item_id'])->lockForUpdate()->first();

                if (!$item) {
                    throw new HttpException(404, "Barang dengan ID {$itemData['item_id']} tidak ditemukan.");
                }

                if (!$item->is_available || $item->stock < $itemData['quantity']) {
                    throw new HttpException(409, "Stok barang '{$item->name}' tidak mencukupi atau tidak tersedia.");
                }

                BorrowingItem::create([
                    'borrowing_id' => $borrowing->id,
                    'item_id' => $item->id,
                    'quantity' => $itemData['quantity'],
                    'item_condition_out' => $item->condition, // Condition of item when borrowed is current item condition
                ]);
            }

            // Log activity
            ActivityLogService::log(
                'borrowing.created',
                "Peminjaman dengan kode {$borrowing->code} berhasil diajukan.",
                $borrowing
            );

            return $borrowing;
        });
    }

    /**
     * Cancel a pending borrowing request.
     */
    public function cancel(Borrowing $borrowing, int $userId): Borrowing
    {
        return DB::transaction(function () use ($borrowing, $userId) {
            if ($borrowing->user_id !== $userId) {
                throw new HttpException(403, "Anda tidak memiliki akses untuk membatalkan peminjaman ini.");
            }

            if ($borrowing->status !== BorrowingStatus::PENDING) {
                throw new HttpException(409, "Hanya pengajuan dengan status pending yang dapat dibatalkan.");
            }

            $before = ['status' => $borrowing->status->value];
            $borrowing->update(['status' => BorrowingStatus::CANCELLED]);

            ActivityLogService::log(
                'borrowing.cancelled',
                "Peminjaman dengan kode {$borrowing->code} dibatalkan oleh siswa.",
                $borrowing,
                ['before' => $before, 'after' => ['status' => BorrowingStatus::CANCELLED->value]]
            );

            return $borrowing;
        });
    }

    /**
     * Delete a terminal-status borrowing and its associated files.
     */
    public function delete(Borrowing $borrowing, int $userId): void
    {
        DB::transaction(function () use ($borrowing, $userId) {
            $code = $borrowing->code;

            // Delete photo files from disk
            foreach ($borrowing->photos as $photo) {
                Storage::disk('public')->delete($photo->path);
            }

            // Delete the directory if it exists: borrowings/{id}/
            Storage::disk('public')->deleteDirectory("borrowings/{$borrowing->id}");

            // Cascade deletes (borrowing_items, borrowing_photos) handled by DB foreign keys
            $borrowing->delete();

            ActivityLogService::log(
                'borrowing.deleted',
                "Data peminjaman {$code} dihapus oleh admin.",
                null,
                ['code' => $code]
            );
        });
    }

    /**
     * Upload photo proof (borrow / return selfie).
     */
    public function uploadPhoto(Borrowing $borrowing, string $type, $file, int $userId): BorrowingPhoto
    {
        return DB::transaction(function () use ($borrowing, $type, $file, $userId) {
            if ($type === 'borrow') {
                if ($borrowing->status !== BorrowingStatus::APPROVED) {
                    throw new HttpException(409, "Upload foto selfie pengambilan hanya dapat dilakukan setelah peminjaman disetujui (Approved).");
                }
            } elseif ($type === 'return') {
                if ($borrowing->status !== BorrowingStatus::APPROVED) {
                    throw new HttpException(409, "Upload foto selfie pengembalian hanya dapat dilakukan ketika status peminjaman adalah Approved.");
                }
            } else {
                throw new HttpException(400, "Tipe foto tidak valid.");
            }

            // Generate UUID filename
            $extension = $file->getClientOriginalExtension();
            $uuid = Str::uuid()->toString();
            $filename = "{$uuid}.{$extension}";

            // Store to disk 'public' (→ storage/app/public/) agar dapat diakses via symlink
            // Path relatif terhadap root disk 'public': borrowings/{id}/{type}/filename.ext
            $relativePath = "borrowings/{$borrowing->id}/{$type}/{$filename}";
            Storage::disk('public')->putFileAs(
                "borrowings/{$borrowing->id}/{$type}",
                $file,
                $filename
            );

            // Simpan URL lengkap ke database agar konsisten
            // Storage::disk('public')->url() menghasilkan: http://localhost:8000/storage/borrowings/...
            $photo = BorrowingPhoto::create([
                'borrowing_id' => $borrowing->id,
                'type' => $type,
                'path' => $relativePath,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'uploaded_by' => $userId,
            ]);

            // If return selfie, transition state to RETURNING
            if ($type === 'return') {
                $before = ['status' => $borrowing->status->value];
                $borrowing->update([
                    'status' => BorrowingStatus::RETURNING,
                    'returned_at' => now(),
                ]);

                ActivityLogService::log(
                    'return.submitted',
                    "Siswa mengunggah bukti pengembalian untuk {$borrowing->code}.",
                    $borrowing,
                    ['before' => $before, 'after' => ['status' => BorrowingStatus::RETURNING->value]]
                );
            } else {
                ActivityLogService::log(
                    'borrowing.photo_uploaded',
                    "Siswa mengunggah bukti pengambilan untuk {$borrowing->code}.",
                    $borrowing
                );
            }

            return $photo;
        });
    }
}
