<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BorrowingItemReturn extends Model
{
    protected $fillable = [
        'borrowing_item_id',
        'condition',
        'quantity',
        'notes',
    ];

    // ─── Relations ────────────────────────────────────────────────────────────

    public function borrowingItem(): BelongsTo
    {
        return $this->belongsTo(BorrowingItem::class);
    }
}
