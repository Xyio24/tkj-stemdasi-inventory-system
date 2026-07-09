<?php

namespace App\Http\Controllers;

use App\Http\Requests\Borrowing\ApproveBorrowingRequest;
use App\Http\Requests\Borrowing\ApproveReturnRequest;
use App\Http\Requests\Borrowing\RejectBorrowingRequest;
use App\Http\Resources\BorrowingResource;
use App\Models\Borrowing;
use App\Services\BorrowingApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BorrowingAdminController extends Controller
{
    protected BorrowingApprovalService $approvalService;

    public function __construct(BorrowingApprovalService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    /**
     * Approve a pending borrowing (pending -> approved, stock deducted).
     */
    public function approve(ApproveBorrowingRequest $request, Borrowing $borrowing): JsonResponse
    {
        $borrowing = $this->approvalService->approve(
            $borrowing,
            $request->notes,
            Auth::id()
        );

        return $this->successResponse(
            'Peminjaman berhasil disetujui.',
            new BorrowingResource($borrowing->load(['user', 'items', 'photos']))
        );
    }

    /**
     * Reject a pending borrowing (pending -> rejected).
     */
    public function reject(RejectBorrowingRequest $request, Borrowing $borrowing): JsonResponse
    {
        $borrowing = $this->approvalService->reject(
            $borrowing,
            $request->rejection_reason,
            Auth::id()
        );

        return $this->successResponse(
            'Peminjaman berhasil ditolak.',
            new BorrowingResource($borrowing->load(['user', 'items']))
        );
    }

    /**
     * Approve return (returning -> returned, stock restored).
     */
    public function approveReturn(ApproveReturnRequest $request, Borrowing $borrowing): JsonResponse
    {
        $borrowing = $this->approvalService->approveReturn(
            $borrowing,
            $request->items,
            $request->return_notes,
            Auth::id()
        );

        return $this->successResponse(
            'Pengembalian barang berhasil dikonfirmasi.',
            new BorrowingResource($borrowing->load([
                'user',
                'items',
                'photos',
                'borrowingItems.returnConditions',
            ]))
        );
    }
}
