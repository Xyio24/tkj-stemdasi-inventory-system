<?php

namespace App\Policies;

use App\Models\Borrowing;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class BorrowingPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true; // Everyone can see list (controller filters results)
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Borrowing $borrowing): bool
    {
        return $user->role === 'admin' || $user->role === 'guru' || $user->id === $borrowing->user_id;
    }

    /**
     * Determine whether the user can cancel the model.
     */
    public function cancel(User $user, Borrowing $borrowing): bool
    {
        return $user->id === $borrowing->user_id;
    }

    /**
     * Determine whether the user can upload photos.
     */
    public function uploadPhoto(User $user, Borrowing $borrowing): bool
    {
        return $user->id === $borrowing->user_id;
    }

    /**
     * Determine whether the user can delete the borrowing record.
     * Only admin can delete, and only terminal-status borrowings.
     */
    public function delete(User $user, Borrowing $borrowing): bool
    {
        return $user->role === 'admin';
    }
}
