<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description', 'brand', 'model',
        'stock', 'stock_total', 'stock_minimum', 'condition', 'location',
        'is_available', 'image',
        // Stock remaster
        'type', 'stock_baik', 'stock_rusak_ringan', 'stock_rusak_berat', 'stock_hilang',
    ];

    protected $casts = [
        'is_available'       => 'boolean',
        'stock'              => 'integer',
        'stock_baik'         => 'integer',
        'stock_rusak_ringan' => 'integer',
        'stock_rusak_berat'  => 'integer',
        'stock_hilang'       => 'integer',
    ];

    // ─── Stock Helpers ────────────────────────────────────────────────────────

    /**
     * Stok yang tersedia untuk dipinjam — hanya kondisi baik.
     */
    public function availableStock(): int
    {
        return (int) $this->stock_baik;
    }

    /**
     * Sync kolom `stock` dari jumlah breakdown kondisi aktif.
     * stock = stock_baik + stock_rusak_ringan + stock_rusak_berat
     * (stock_hilang & terpakai tidak masuk stok aktif)
     */
    public function syncStock(): void
    {
        $this->stock = $this->stock_baik + $this->stock_rusak_ringan + $this->stock_rusak_berat;
        $this->saveQuietly();
    }

    /**
     * Update kondisi item ke kondisi mayoritas dari breakdown stok.
     * Jika seri, prioritas: rusak_berat > rusak_ringan > baik (lebih konservatif).
     */
    public function updateConditionFromMajority(): void
    {
        $breakdown = [
            'rusak_berat'  => (int) $this->stock_rusak_berat,
            'rusak_ringan' => (int) $this->stock_rusak_ringan,
            'baik'         => (int) $this->stock_baik,
        ];

        // Jika semua nol (misal semua hilang/terpakai), pertahankan kondisi saat ini
        if (array_sum($breakdown) === 0) {
            return;
        }

        // Cari nilai max, lalu ambil kondisi pertama yang nilainya sama
        // (urutan array sudah prioritas: rusak_berat → rusak_ringan → baik)
        $max = max($breakdown);
        foreach ($breakdown as $condition => $qty) {
            if ($qty === $max) {
                $this->condition = $condition;
                $this->saveQuietly();
                return;
            }
        }
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ItemImage::class)->orderBy('order');
    }

    public function borrowingItems()
    {
        return $this->hasMany(BorrowingItem::class);
    }

    public function borrowings()
    {
        return $this->belongsToMany(Borrowing::class, 'borrowing_items')
            ->withPivot(['id', 'quantity', 'returned_quantity', 'item_condition_out', 'item_condition_in', 'notes'])
            ->withTimestamps();
    }
}
