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
        Schema::create('borrowing_item_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('borrowing_item_id')
                  ->constrained('borrowing_items')
                  ->onDelete('cascade');
            $table->enum('condition', ['baik', 'rusak_ringan', 'rusak_berat', 'hilang', 'terpakai']);
            $table->unsignedTinyInteger('quantity');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('borrowing_item_id', 'idx_bir_borrowing_item_id');
            $table->index('condition', 'idx_bir_condition');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowing_item_returns');
    }
};
