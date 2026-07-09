<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('borrowing_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_id')->constrained('borrowings')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('items')->onDelete('restrict');
            $table->integer('quantity')->unsigned()->default(1);
            $table->integer('returned_quantity')->unsigned()->default(0);
            $table->enum('item_condition_out', ['baik', 'rusak_ringan', 'rusak_berat'])->nullable();
            $table->enum('item_condition_in', ['baik', 'rusak_ringan', 'rusak_berat'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('borrowing_id', 'idx_borrowing_items_borrowing_id');
            $table->index('item_id', 'idx_borrowing_items_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowing_items');
    }
};
