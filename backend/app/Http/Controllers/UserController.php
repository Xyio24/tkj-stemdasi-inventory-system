<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────

    /**
     * GET /api/users
     *
     * Daftar pengguna dengan filter opsional: search, role, status.
     */
    public function index(Request $request)
    {
        $query = User::with(['studentClass.academicYear']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nis_nip', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter status — support: pending, active, blocked
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->latest()->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $users->items(),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'from'         => $users->firstItem(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'to'           => $users->lastItem(),
                'total'        => $users->total(),
            ],
            'links' => [
                'first' => $users->url(1),
                'last'  => $users->url($users->lastPage()),
                'prev'  => $users->previousPageUrl(),
                'next'  => $users->nextPageUrl(),
            ],
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    /**
     * PATCH /api/users/{user}
     *
     * Update data user oleh admin.
     * Field yang bisa diedit: role, nis_nip, phone, class_id, absen_number.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => [
                'sometimes',
                'required',
                Rule::in(['admin', 'guru', 'siswa']),
            ],
            'nis_nip' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'class_id' => ['sometimes', 'nullable', 'exists:student_classes,id'],
            'absen_number' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'max:99',
                // Unik per kelas — exclude user itu sendiri
                Rule::unique('users', 'absen_number')
                    ->where(fn ($q) => $q->where('class_id', $request->input('class_id', $user->class_id)))
                    ->ignore($user->id),
            ],
        ], [
            'role.in'              => 'Role tidak valid.',
            'nis_nip.unique'       => 'NIS/NIP ini sudah digunakan.',
            'class_id.exists'      => 'Kelas yang dipilih tidak valid.',
            'absen_number.unique'  => 'Nomor absen ini sudah digunakan di kelas yang sama.',
            'absen_number.integer' => 'Nomor absen harus berupa angka.',
        ]);

        // BR-USER-06: Admin tidak bisa ubah role diri sendiri
        if ($request->has('role') && $user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat mengubah role diri sendiri.',
            ], 409);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data'    => $user->fresh('studentClass.academicYear'),
        ]);
    }

    // ─── Approve ──────────────────────────────────────────────────────────────

    /**
     * PATCH /api/users/{user}/approve
     *
     * Admin menyetujui akun pendaftar baru.
     * Hanya bisa untuk user berstatus 'pending'.
     */
    public function approve(Request $request, User $user)
    {
        if ($user->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun dengan status pending yang dapat disetujui.',
            ], 409);
        }

        $user->update([
            'status'      => 'active',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        ActivityLogService::log(
            'user.approved',
            "Admin {$request->user()->name} menyetujui akun {$user->name} ({$user->email}).",
            $user,
            ['before' => ['status' => 'pending'], 'after' => ['status' => 'active']]
        );

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil disetujui.",
            'data'    => $user->fresh(),
        ]);
    }

    // ─── Reject ───────────────────────────────────────────────────────────────

    /**
     * PATCH /api/users/{user}/reject
     *
     * Admin menolak pendaftaran akun baru.
     * Hanya bisa untuk user berstatus 'pending'.
     * Set status = blocked dan simpan alasan penolakan.
     */
    public function reject(Request $request, User $user)
    {
        if ($user->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun dengan status pending yang dapat ditolak.',
            ], 409);
        }

        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10'],
        ], [
            'rejection_reason.required' => 'Alasan penolakan wajib diisi.',
            'rejection_reason.min'      => 'Alasan penolakan minimal 10 karakter.',
        ]);

        $user->update([
            'status'             => 'blocked',
            'registration_notes' => $request->rejection_reason,
        ]);

        ActivityLogService::log(
            'user.rejected',
            "Admin {$request->user()->name} menolak pendaftaran {$user->name} ({$user->email}). Alasan: {$request->rejection_reason}",
            $user,
            ['before' => ['status' => 'pending'], 'after' => ['status' => 'blocked']]
        );

        return response()->json([
            'success' => true,
            'message' => "Pendaftaran {$user->name} berhasil ditolak.",
            'data'    => $user->fresh(),
        ]);
    }

    // ─── Reset Password ───────────────────────────────────────────────────────

    /**
     * POST /api/users/{user}/reset-password
     *
     * Admin mereset password user menjadi password acak.
     * Password baru dikembalikan sebagai plaintext sekali saja — admin
     * bertanggung jawab menyampaikannya ke user bersangkutan.
     */
    public function resetPassword(Request $request, User $user)
    {
        // Admin tidak bisa reset password diri sendiri lewat endpoint ini
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Gunakan halaman profil untuk mengubah password Anda sendiri.',
            ], 409);
        }

        // Generate password acak 12 karakter: huruf + angka
        $newPassword = substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'), 0, 4)
                     . substr(str_shuffle('0123456789'), 0, 4)
                     . substr(str_shuffle('!@#$%'), 0, 2)
                     . substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'), 0, 2);
        $newPassword = str_shuffle($newPassword);

        $user->update([
            'password' => bcrypt($newPassword),
        ]);

        // Cabut semua token aktif user agar dipaksa login ulang
        $user->tokens()->delete();

        ActivityLogService::log(
            'user.password_reset',
            "Admin {$request->user()->name} mereset password akun {$user->name} ({$user->email}).",
            $user,
            ['reset_by' => $request->user()->id]
        );

        return response()->json([
            'success'      => true,
            'message'      => "Password {$user->name} berhasil direset.",
            'new_password' => $newPassword,
        ]);
    }

    /**
     * PATCH /api/users/{user}/block
     *
     * Admin memblokir akun user aktif.
     * Semua token aktif user akan dicabut.
     */
    public function block(Request $request, User $user)
    {
        // Admin tidak bisa blokir diri sendiri
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat memblokir akun sendiri.',
            ], 409);
        }

        if ($user->status === 'blocked') {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini sudah diblokir.',
            ], 409);
        }

        // Revoke semua token aktif milik user
        $user->tokens()->delete();

        $user->update(['status' => 'blocked']);

        ActivityLogService::log(
            'user.blocked',
            "Admin {$request->user()->name} memblokir akun {$user->name} ({$user->email}).",
            $user,
            ['before' => ['status' => $user->getOriginal('status')], 'after' => ['status' => 'blocked']]
        );

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil diblokir.",
            'data'    => $user->fresh(),
        ]);
    }

    // ─── Unblock ──────────────────────────────────────────────────────────────

    /**
     * PATCH /api/users/{user}/unblock
     *
     * Admin mengaktifkan kembali akun yang diblokir.
     */
    public function unblock(Request $request, User $user)
    {
        if ($user->status !== 'blocked') {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini tidak dalam status diblokir.',
            ], 409);
        }

        $user->update(['status' => 'active']);

        ActivityLogService::log(
            'user.unblocked',
            "Admin {$request->user()->name} mengaktifkan kembali akun {$user->name} ({$user->email}).",
            $user,
            ['before' => ['status' => 'blocked'], 'after' => ['status' => 'active']]
        );

        return response()->json([
            'success' => true,
            'message' => "Akun {$user->name} berhasil diaktifkan kembali.",
            'data'    => $user->fresh(),
        ]);
    }

    // ─── Toggle Status (deprecated — kept for backward compat) ────────────────

    /**
     * PATCH /api/users/{user}/toggle-status
     *
     * @deprecated Gunakan block/unblock endpoint.
     */
    public function toggleStatus(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan akun sendiri.',
            ], 409);
        }

        $newStatus = $user->status === 'active' ? 'blocked' : 'active';

        if ($newStatus === 'blocked') {
            $user->tokens()->delete();
        }

        $user->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Status pengguna berhasil diubah.',
            'data'    => $user->fresh(),
        ]);
    }

    // ─── Delete Pending ───────────────────────────────────────────────────────

    /**
     * DELETE /api/users/{user}/delete-pending
     *
     * Hard delete akun yang masih berstatus 'pending'.
     * Hanya bisa untuk user berstatus 'pending' — akun aktif/blocked tidak bisa dihapus (BR-USER-02).
     */
    public function deletePending(Request $request, User $user)
    {
        if ($user->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya akun dengan status pending yang dapat dihapus.',
            ], 409);
        }

        $userName  = $user->name;
        $userEmail = $user->email;

        $user->tokens()->delete();
        $user->delete();

        ActivityLogService::log(
            'user.deleted',
            "Admin {$request->user()->name} menghapus pendaftaran {$userName} ({$userEmail}).",
            null,
            ['deleted_user' => ['name' => $userName, 'email' => $userEmail]]
        );

        return response()->json([
            'success' => true,
            'message' => "Pendaftaran {$userName} berhasil dihapus.",
        ]);
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────

    /**
     * DELETE /api/users/{user}
     *
     * BR-USER-02: Pengguna tidak boleh dihapus dari database.
     * Gunakan block/unblock sebagai gantinya.
     */
    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun sendiri.',
            ], 409);
        }

        return response()->json([
            'success' => false,
            'message' => 'Sesuai kebijakan sistem (BR-USER-02), akun pengguna tidak dapat dihapus. Gunakan fitur blokir sebagai gantinya.',
        ], 403);
    }
}
