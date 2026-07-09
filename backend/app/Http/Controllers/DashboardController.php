<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Return aggregated dashboard data for guru/admin.
     */
    public function index(): JsonResponse
    {
        $data = $this->dashboardService->getDashboardData();

        return $this->successResponse('Data dashboard berhasil dimuat.', $data);
    }
}
