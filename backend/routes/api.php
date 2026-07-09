<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockConditionController;
use App\Http\Controllers\UserController;

// Public routes untuk halaman registrasi — tidak butuh auth
Route::get('/public/academic-years', [\App\Http\Controllers\AcademicYearController::class, 'index']);
Route::get('/public/classes', [\App\Http\Controllers\ClassController::class, 'index']);

Route::prefix('auth')->group(function () {
    // Public — tidak perlu token
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/google',   [AuthController::class, 'googleLogin']);

    // Protected — perlu token
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',             [AuthController::class, 'me']);
        Route::post('/logout',        [AuthController::class, 'logout']);
        Route::post('/bind-google',   [AuthController::class, 'bindGoogle']);
        Route::delete('/unbind-google', [AuthController::class, 'unbindGoogle']);
    });
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::patch('/{user}', [UserController::class, 'update']);
    Route::patch('/{user}/approve', [UserController::class, 'approve']);
    Route::patch('/{user}/reject', [UserController::class, 'reject']);
    Route::patch('/{user}/block', [UserController::class, 'block']);
    Route::patch('/{user}/unblock', [UserController::class, 'unblock']);
    Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus']); // deprecated
    Route::delete('/{user}', [UserController::class, 'destroy']);
});

// Profile routes — semua role yang sudah login
Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::patch('/', [ProfileController::class, 'update']);
    Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/avatar', [ProfileController::class, 'deleteAvatar']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('academic-years', \App\Http\Controllers\AcademicYearController::class);
    Route::apiResource('classes', \App\Http\Controllers\ClassController::class);
});

// Categories & Items — read: semua role, write: guru/admin, delete: admin
Route::middleware('auth:sanctum')->group(function () {
    // Read — semua authenticated user (siswa, guru, admin)
    Route::get('categories',           [\App\Http\Controllers\CategoryController::class, 'index']);
    Route::get('categories/{category}', [\App\Http\Controllers\CategoryController::class, 'show']);
    Route::get('items',                [\App\Http\Controllers\ItemController::class, 'index']);
    // stock-conditions harus SEBELUM items/{item} agar tidak dikira {item}='stock-conditions'
    Route::get('items/stock-conditions', [StockConditionController::class, 'index']);
    Route::get('items/{item}',         [\App\Http\Controllers\ItemController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:admin,guru'])->group(function () {
    // Write — guru & admin
    Route::post('categories',                [\App\Http\Controllers\CategoryController::class, 'store']);
    Route::put('categories/{category}',      [\App\Http\Controllers\CategoryController::class, 'update']);
    Route::post('items',                     [\App\Http\Controllers\ItemController::class, 'store']);
    Route::put('items/{item}',               [\App\Http\Controllers\ItemController::class, 'update']);
    Route::post('items/{item}',              [\App\Http\Controllers\ItemController::class, 'update']); // for _method=PUT via FormData
    Route::post('items/{item}/images',       [\App\Http\Controllers\ItemController::class, 'uploadImage']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    // Delete — admin only
    Route::delete('categories/{category}',            [\App\Http\Controllers\CategoryController::class, 'destroy']);
    Route::delete('items/{item}',                     [\App\Http\Controllers\ItemController::class, 'destroy']);
    Route::delete('items/{item}/images/{image}',      [\App\Http\Controllers\ItemController::class, 'destroyImage']);
});

// Borrowing routes (all authenticated users)
Route::middleware('auth:sanctum')->prefix('borrowings')->group(function () {
    Route::get('/', [\App\Http\Controllers\BorrowingController::class, 'index']);
    Route::get('/{borrowing}', [\App\Http\Controllers\BorrowingController::class, 'show']);
    Route::post('/', [\App\Http\Controllers\BorrowingController::class, 'store']);
    Route::patch('/{borrowing}/cancel', [\App\Http\Controllers\BorrowingController::class, 'cancel']);
    Route::post('/{borrowing}/photos', [\App\Http\Controllers\BorrowingController::class, 'uploadPhoto']);
    Route::delete('/{borrowing}', [\App\Http\Controllers\BorrowingController::class, 'destroy']);
});

// Admin/Guru borrowing approval routes
Route::middleware(['auth:sanctum', 'role:admin,guru'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Borrowing approvals
    Route::prefix('admin/borrowings')->group(function () {
        Route::patch('/{borrowing}/approve', [\App\Http\Controllers\BorrowingAdminController::class, 'approve']);
        Route::patch('/{borrowing}/reject', [\App\Http\Controllers\BorrowingAdminController::class, 'reject']);
        Route::patch('/{borrowing}/approve-return', [\App\Http\Controllers\BorrowingAdminController::class, 'approveReturn']);
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/borrowings',          [ReportController::class, 'borrowingReport']);
        Route::get('/borrowings/export',   [ReportController::class, 'exportBorrowing']);
        Route::get('/returns',             [ReportController::class, 'returnReport']);
        Route::get('/returns/export',      [ReportController::class, 'exportReturn']);
        Route::get('/inventory',           [ReportController::class, 'inventoryReport']);
        Route::get('/inventory/export',    [ReportController::class, 'exportInventory']);
    });
});

// Adjust condition — admin only
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('items/{item}/adjust-condition', [StockConditionController::class, 'adjust']);
});

