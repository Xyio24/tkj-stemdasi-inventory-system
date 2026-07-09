<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index()
    {
        $years = AcademicYear::orderBy('name', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $years
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:academic_years,name',
            'is_active' => 'boolean'
        ]);

        if (!empty($validated['is_active'])) {
            $activeCount = AcademicYear::where('is_active', true)->count();
            if ($activeCount >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maksimal 3 angkatan dapat aktif bersamaan. Nonaktifkan salah satu terlebih dahulu.'
                ], 409);
            }
        }

        $year = AcademicYear::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil ditambahkan',
            'data' => $year
        ], 201);
    }

    public function update(Request $request, AcademicYear $academicYear)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:academic_years,name,' . $academicYear->id,
            'is_active' => 'boolean'
        ]);

        // Jika ingin mengaktifkan angkatan yang belum aktif, cek batas max 3
        if (isset($validated['is_active']) && $validated['is_active'] && !$academicYear->is_active) {
            $activeCount = AcademicYear::where('is_active', true)->count();
            if ($activeCount >= 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maksimal 3 angkatan dapat aktif bersamaan. Nonaktifkan salah satu terlebih dahulu.'
                ], 409);
            }
        }

        $academicYear->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil diperbarui',
            'data' => $academicYear
        ]);
    }

    public function destroy(AcademicYear $academicYear)
    {
        if ($academicYear->classes()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak dapat dihapus karena masih memiliki kelas'
            ], 409);
        }

        $academicYear->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil dihapus'
        ]);
    }
}
