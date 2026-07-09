<?php

namespace App\Enums;

enum BorrowingStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case RETURNING = 'returning';
    case RETURNED = 'returned';
    case CANCELLED = 'cancelled';
}
