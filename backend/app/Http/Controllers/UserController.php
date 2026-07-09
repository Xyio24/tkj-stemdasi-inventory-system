<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['studentClass.academicYear']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nis_nip', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'from' => $users->firstItem(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'to' => $users->lastItem(),
                'total' => $users->total(),
            ],
            'links' => [
                'first' => $users->url(1),
                'last' => $users->url($users->lastPage()),
                'prev' => $users->previousPageUrl(),
                'next' => $users->nextPageUrl(),
            ]
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['sometimes', 'required', Rule::in(['admin', 'guru', 'siswa'])],
            'nis_nip' => ['sometimes', 'nullable', 'string', 'max:30', Rule::unique('users')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'class_id' => ['sometimes', 'nullable', 'exists:student_classes,id'],
        ]);

        // Prevent admin from changing their own role to something else if they are the only admin, 
        // but for simplicity, we just prevent changing own role.
        if ($request->has('role') && $user->id === $request->user()->id && $request->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mengubah role diri sendiri'
            ], 409);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui',
            'data' => $user
        ]);
    }

    public function toggleStatus(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan akun sendiri'
            ], 409);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status pengguna berhasil diubah',
            'data' => $user
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun sendiri'
            ], 409);
        }

        // Ideally check if user has active borrowings before deleting
        // Since we don't have borrowings implemented yet, we just delete.
        // Actually BR-USER-02 says: Pengguna yang dinonaktifkan tidak boleh dihapus dari database. Data historis harus tetap terhubung.
        // And BR-USER-03 says: Pengguna yang memiliki peminjaman aktif tidak dapat dinonaktifkan.
        // For now, we will implement soft deletes if needed or just return error if we want to follow BR-USER-02 strictly.
        // "Pengguna yang dinonaktifkan tidak boleh dihapus dari database". We will just use toggleStatus and not allow hard delete.

        return response()->json([
            'success' => false,
            'message' => 'Sesuai BR-USER-02, pengguna tidak boleh dihapus. Gunakan fitur nonaktifkan (toggleStatus).'
        ], 403);
    }
}
