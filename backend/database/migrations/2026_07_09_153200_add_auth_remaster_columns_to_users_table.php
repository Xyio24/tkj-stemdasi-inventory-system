<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Status akun — menggantikan is_active yang hanya boolean
            $table->enum('status', ['pending', 'active', 'blocked'])
                ->default('pending')
                ->after('is_active');

            // Nomor absen — unik per kelas
            $table->tinyInteger('absen_number')->unsigned()->nullable()->after('status');

            // Tipe avatar: generated (inisial) atau upload (file)
            $table->enum('avatar_type', ['generated', 'upload'])
                ->default('generated')
                ->after('avatar');

            // Catatan admin saat approve/reject registrasi
            $table->text('registration_notes')->nullable()->after('absen_number');

            // Siapa yang approve dan kapan
            $table->foreignId('approved_by')
                ->nullable()
                ->after('registration_notes')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });

        // Migrasi data lama: is_active=true → active, is_active=false → blocked
        DB::statement("UPDATE users SET status = CASE WHEN is_active = 1 THEN 'active' ELSE 'blocked' END");

        Schema::table('users', function (Blueprint $table) {
            // Unique constraint: nomor absen unik per kelas
            // Partial unique (hanya jika keduanya tidak null)
            $table->unique(['class_id', 'absen_number'], 'users_class_id_absen_number_unique');

            // Index status untuk query filter pending/active/blocked
            $table->index('status', 'users_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_class_id_absen_number_unique');
            $table->dropIndex('users_status_index');
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'status',
                'absen_number',
                'avatar_type',
                'registration_notes',
                'approved_by',
                'approved_at',
            ]);
        });
    }
};
