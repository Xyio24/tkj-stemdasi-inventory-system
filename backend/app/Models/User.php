<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'password',
    'google_id',
    'role',
    'avatar',
    'avatar_type',
    'phone',
    'nis_nip',
    'is_active',
    'status',
    'absen_number',
    'registration_notes',
    'approved_by',
    'approved_at',
    'class_id',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'approved_at'       => 'datetime',
        ];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Apakah akun ini boleh login.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Apakah akun ini masih menunggu approval.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Apakah akun ini diblokir.
     */
    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function studentClass()
    {
        return $this->belongsTo(StudentClass::class, 'class_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function borrowings()
    {
        return $this->hasMany(Borrowing::class, 'user_id');
    }

    public function approvedBorrowings()
    {
        return $this->hasMany(Borrowing::class, 'approved_by');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
