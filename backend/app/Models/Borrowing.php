<?php

namespace App\Models;

use App\Enums\BorrowingStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Borrowing extends Model
{
    protected $fillable = [
        'code',
        'user_id',
        'approved_by',
        'return_approved_by',
        'status',
        'purpose',
        'notes',
        'borrow_date',
        'expected_return_date',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'returned_at',
        'return_approved_at',
        'return_notes'
    ];

    protected $casts = [
        'status' => BorrowingStatus::class,
        'borrow_date' => 'date',
        'expected_return_date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'returned_at' => 'datetime',
        'return_approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function returnApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'return_approved_by');
    }

    public function borrowingItems(): HasMany
    {
        return $this->hasMany(BorrowingItem::class);
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'borrowing_items')
            ->using(BorrowingItem::class)
            ->withPivot(['id', 'quantity', 'returned_quantity', 'item_condition_out', 'item_condition_in', 'notes'])
            ->withTimestamps();
    }

    public function photos(): HasMany
    {
        return $this->hasMany(BorrowingPhoto::class);
    }
}
