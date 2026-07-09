<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Borrowing;
use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Collect all dashboard data.
     */
    public function getDashboardData(): array
    {
        return [
            'stats'               => $this->getStats(),
            'recent_borrowings'   => $this->getRecentBorrowings(),
            'recent_activity'     => $this->getRecentActivity(),
            'borrowings_chart'    => $this->getBorrowingsChart(),
        ];
    }

    /**
     * Summary statistics cards.
     */
    private function getStats(): array
    {
        return [
            'total_items'       => Item::count(),
            'total_categories'  => Category::count(),
            'total_users'       => User::count(),
            'active_borrowings' => Borrowing::whereIn('status', ['approved', 'borrowing'])->count(),
            'pending_approvals' => Borrowing::where('status', 'pending')->count(),
            'items_low_stock'   => Item::whereColumn('stock', '<=', 'stock_minimum')->count(),
            'returning_count'   => Borrowing::where('status', 'returning')->count(),
        ];
    }

    /**
     * 5 most recent borrowings with basic info.
     */
    private function getRecentBorrowings(): array
    {
        return Borrowing::with(['user:id,name,email'])
            ->withCount('borrowingItems as items_count')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'id'                   => $b->id,
                'code'                 => $b->code,
                'user'                 => $b->user ? ['name' => $b->user->name] : null,
                'status'               => $b->status instanceof \BackedEnum ? $b->status->value : $b->status,
                'items_count'          => $b->items_count,
                'borrow_date'          => $b->borrow_date?->toDateString(),
                'expected_return_date' => $b->expected_return_date?->toDateString(),
                'created_at'           => $b->created_at,
            ])
            ->toArray();
    }

    /**
     * 5 most recent activity log entries.
     */
    private function getRecentActivity(): array
    {
        return ActivityLog::with(['user:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($log) => [
                'action'      => $log->action,
                'description' => $log->description,
                'user'        => $log->user ? ['name' => $log->user->name] : null,
                'created_at'  => $log->created_at,
            ])
            ->toArray();
    }

    /**
     * Borrowing count per day for the last 7 days.
     */
    private function getBorrowingsChart(): array
    {
        $days = collect(range(6, 0))->map(fn($i) => Carbon::now()->subDays($i)->toDateString());

        $counts = Borrowing::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
            ->where('created_at', '>=', Carbon::now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->pluck('count', 'date');

        return $days->map(fn($date) => [
            'date'  => $date,
            'count' => (int) ($counts[$date] ?? 0),
        ])->values()->toArray();
    }
}
