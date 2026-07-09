<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'description', 'brand', 'model',
        'stock', 'stock_total', 'stock_minimum', 'condition', 'location',
        'is_available', 'image'
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

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
