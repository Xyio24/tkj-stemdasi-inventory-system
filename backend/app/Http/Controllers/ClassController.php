<?php

namespace App\Http\Controllers;

use App\Models\StudentClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = StudentClass::with('academicYear');

        if ($request->has('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        $classes = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'name' => [
                'required',
                'string',
                Rule::unique('student_classes')->where(function ($query) use ($request) {
                    return $query->where('academic_year_id', $request->academic_year_id);
                })
            ],
        ]);

        $class = StudentClass::create($validated);
        $class->load('academicYear');

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil ditambahkan',
            'data' => $class
        ], 201);
    }

    public function update(Request $request, StudentClass $class)
    {
        // For simplicity, we just allow renaming. Changing academic_year_id might mess up historical data if students are attached.
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                Rule::unique('student_classes')->where(function ($query) use ($class) {
                    return $query->where('academic_year_id', $class->academic_year_id);
                })->ignore($class->id)
            ],
        ]);

        $class->update($validated);
        $class->load('academicYear');

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil diperbarui',
            'data' => $class
        ]);
    }

    public function destroy(StudentClass $class)
    {
        if ($class->students()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kelas tidak dapat dihapus karena masih memiliki siswa'
            ], 409);
        }

        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus'
        ]);
    }
}
