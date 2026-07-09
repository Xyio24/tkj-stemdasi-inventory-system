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
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('return_approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'returning',
                'returned',
                'cancelled'
            ])->default('pending');
            $table->text('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('return_approved_at')->nullable();
            $table->text('return_notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('user_id', 'idx_borrowings_user_id');
            $table->index('status', 'idx_borrowings_status');
            $table->index('code', 'idx_borrowings_code');
            $table->index('borrow_date', 'idx_borrowings_borrow_date');
            $table->index('approved_by', 'idx_borrowings_approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('borrowings');
    }
};
