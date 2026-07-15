<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;

class BorrowingItem extends Pivot
{
    public $incrementing = true;

    protected $table = 'borrowing_items';

    protected $primaryKey = 'id';

    protected $keyType = 'int';

    protected $fillable = [
        'borrowing_id',
        'item_id',
        'quantity',
        'returned_quantity',
        'item_condition_out',
        'item_condition_in',
        'notes',
    ];

    public function borrowing(): BelongsTo
    {
        return $this->belongsTo(Borrowing::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function returnConditions(): HasMany
    {
        return $this->hasMany(BorrowingItemReturn::class, 'borrowing_item_id', 'id');
    }
}
