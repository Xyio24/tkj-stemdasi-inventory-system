<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Jenis barang: non_consumable (default) atau consumable
            $table->enum('type', ['non_consumable', 'consumable'])
                  ->default('non_consumable')
                  ->after('condition');

            // Breakdown stok per kondisi
            $table->unsignedTinyInteger('stock_baik')->default(0)->after('type');
            $table->unsignedTinyInteger('stock_rusak_ringan')->default(0)->after('stock_baik');
            $table->unsignedTinyInteger('stock_rusak_berat')->default(0)->after('stock_rusak_ringan');
            $table->unsignedTinyInteger('stock_hilang')->default(0)->after('stock_rusak_berat');
        });

        // Data migration: semua stok yang ada saat ini dianggap kondisi baik
        DB::statement('UPDATE items SET stock_baik = stock');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn(['type', 'stock_baik', 'stock_rusak_ringan', 'stock_rusak_berat', 'stock_hilang']);
        });
    }
};
