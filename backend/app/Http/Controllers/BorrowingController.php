<?php

namespace App\Http\Controllers;

use App\Http\Requests\Borrowing\StoreBorrowingRequest;
use App\Http\Requests\Borrowing\UploadPhotoRequest;
use App\Http\Resources\BorrowingResource;
use App\Models\Borrowing;
use App\Services\BorrowingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class BorrowingController extends Controller
{
    protected BorrowingService $borrowingService;

    public function __construct(BorrowingService $borrowingService)
    {
        $this->borrowingService = $borrowingService;
    }

    /**
     * Display a listing of borrowings.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Borrowing::query()
            ->with(['user', 'items', 'photos'])
            ->orderBy('created_at', 'desc');

        // Siswa can only see their own borrowings
        if ($user->role === 'siswa') {
            $query->where('user_id', $user->id);
        }

        // Filter: status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter: search (code or purpose)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%");
            });
        }

        $perPage = $request->integer('per_page', 15);
        $borrowings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => BorrowingResource::collection($borrowings),
            'meta' => [
                'current_page' => $borrowings->currentPage(),
                'from' => $borrowings->firstItem(),
                'last_page' => $borrowings->lastPage(),
                'per_page' => $borrowings->perPage(),
                'to' => $borrowings->lastItem(),
                'total' => $borrowings->total(),
            ],
            'links' => [
                'first' => $borrowings->url(1),
                'last' => $borrowings->url($borrowings->lastPage()),
                'prev' => $borrowings->previousPageUrl(),
                'next' => $borrowings->nextPageUrl(),
            ]
        ]);
    }

    /**
     * Display the specified borrowing.
     */
    public function show(Borrowing $borrowing): JsonResponse
    {
        Gate::authorize('view', $borrowing);

        $borrowing->load([
            'user',
            'items',
            'photos',
            'approvedBy',
            'returnApprovedBy',
            'borrowingItems.returnConditions',
        ]);

        return $this->successResponse(
            'Detail peminjaman berhasil diambil.',
            new BorrowingResource($borrowing)
        );
    }

    /**
     * Store a newly created borrowing.
     */
    public function store(StoreBorrowingRequest $request): JsonResponse
    {
        if (Auth::user()->role !== 'siswa') {
            return $this->errorResponse('Hanya siswa yang dapat membuat pengajuan peminjaman.', [], 403);
        }

        $borrowing = $this->borrowingService->create($request->validated(), Auth::id());

        return $this->successResponse(
            'Pengajuan peminjaman berhasil dibuat.',
            new BorrowingResource($borrowing->load(['user', 'items'])),
            201
        );
    }

    /**
     * Cancel a pending borrowing.
     */
    public function cancel(Borrowing $borrowing): JsonResponse
    {
        Gate::authorize('cancel', $borrowing);

        $borrowed = $this->borrowingService->cancel($borrowing, Auth::id());

        return $this->successResponse(
            'Pengajuan peminjaman berhasil dibatalkan.',
            new BorrowingResource($borrowed)
        );
    }

    /**
     * Upload photo proof.
     */
    public function uploadPhoto(Borrowing $borrowing, UploadPhotoRequest $request): JsonResponse
    {
        Gate::authorize('uploadPhoto', $borrowing);

        $photo = $this->borrowingService->uploadPhoto(
            $borrowing,
            $request->type,
            $request->file('photo'),
            Auth::id()
        );

        return $this->successResponse(
            'Foto bukti berhasil diunggah.',
            [
                'photo_id' => $photo->id,
                'type' => $photo->type,
                'borrowing_status' => $borrowing->fresh()->status->value
            ],
            201
        );
    }

    /**
     * Delete a borrowing record (admin only, terminal status only).
     */
    public function destroy(Borrowing $borrowing): JsonResponse
    {
        Gate::authorize('delete', $borrowing);

        $terminalStatuses = [
            \App\Enums\BorrowingStatus::RETURNED,
            \App\Enums\BorrowingStatus::REJECTED,
            \App\Enums\BorrowingStatus::CANCELLED,
        ];

        if (!in_array($borrowing->status, $terminalStatuses)) {
            return $this->errorResponse(
                'Hanya peminjaman dengan status selesai, ditolak, atau dibatalkan yang dapat dihapus.',
                [],
                409
            );
        }

        $this->borrowingService->delete($borrowing, Auth::id());

        return $this->successResponse('Data peminjaman berhasil dihapus.');
    }
}
