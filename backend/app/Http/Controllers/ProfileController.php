<?php

namespace App\Http\Controllers;

use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    // ─── Get Profile ──────────────────────────────────────────────────────────

    /**
     * GET /api/profile
     *
     * Mengembalikan data profil user yang sedang login,
     * lengkap dengan relasi kelas dan angkatan.
     */
    public function show(Request $request)
    {
        $user = $request->user()->load('studentClass.academicYear');

        return response()->json([
            'success' => true,
            'message' => 'Data profil berhasil dimuat.',
            'data'    => array_merge($user->toArray(), [
                'avatar_url' => $this->resolveAvatarUrl($user),
            ]),
        ]);
    }

    // ─── Update Profile ───────────────────────────────────────────────────────

    /**
     * PATCH /api/profile
     *
     * Update profil user: name, email, dan/atau password.
     * Jika update password, wajib sertakan current_password.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'             => ['sometimes', 'required', 'string', 'max:255'],
            'email'            => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'current_password' => ['required_with:password', 'string'],
            'password'         => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required'             => 'Nama tidak boleh kosong.',
            'email.email'               => 'Format email tidak valid.',
            'email.unique'              => 'Email ini sudah digunakan akun lain.',
            'current_password.required_with' => 'Password saat ini wajib diisi untuk mengganti password.',
            'password.min'              => 'Password baru minimal 8 karakter.',
            'password.confirmed'        => 'Konfirmasi password baru tidak cocok.',
        ]);

        // Verifikasi current_password jika ingin ganti password
        if ($request->filled('password')) {
            if (is_null($user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun ini belum memiliki password. Buat password melalui fitur bind Google terlebih dahulu tidak berlaku di sini — hubungi admin.',
                ], 409);
            }

            if (! Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password saat ini tidak sesuai.',
                    'errors'  => ['current_password' => ['Password saat ini tidak sesuai.']],
                ], 422);
            }
        }

        $data = $request->only(['name', 'email']);

        if ($request->filled('password')) {
            $data['password'] = $request->password; // di-hash otomatis via cast 'hashed'
        }

        $user->update($data);

        ActivityLogService::log(
            'profile.updated',
            "{$user->name} memperbarui data profil.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => array_merge($user->fresh('studentClass.academicYear')->toArray(), [
                'avatar_url' => $this->resolveAvatarUrl($user->fresh()),
            ]),
        ]);
    }

    // ─── Upload Avatar ────────────────────────────────────────────────────────

    /**
     * POST /api/profile/avatar
     *
     * Upload foto profil.
     * Simpan ke storage/app/public/avatars/{user_id}/
     * Format: jpeg, jpg, png, webp — max 5MB.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ], [
            'avatar.required' => 'File foto profil wajib disertakan.',
            'avatar.mimes'    => 'Format file harus JPEG, JPG, PNG, atau WebP.',
            'avatar.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        $user = $request->user();

        // Hapus foto lama jika ada
        if ($user->avatar_type === 'upload' && $user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Simpan file baru dengan nama UUID
        $path = $request->file('avatar')->store(
            "avatars/{$user->id}",
            'public'
        );

        $user->update([
            'avatar'      => $path,
            'avatar_type' => 'upload',
        ]);

        ActivityLogService::log(
            'profile.avatar_uploaded',
            "{$user->name} mengunggah foto profil baru.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diunggah.',
            'data'    => [
                'avatar_url' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    // ─── Delete Avatar ────────────────────────────────────────────────────────

    /**
     * DELETE /api/profile/avatar
     *
     * Hapus foto profil upload, kembali ke generated avatar.
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar_type !== 'upload' || is_null($user->avatar)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada foto profil yang bisa dihapus.',
            ], 409);
        }

        // Hapus file dari storage
        Storage::disk('public')->delete($user->avatar);

        $user->update([
            'avatar'      => null,
            'avatar_type' => 'generated',
        ]);

        ActivityLogService::log(
            'profile.avatar_deleted',
            "{$user->name} menghapus foto profil.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil dihapus.',
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Resolve URL avatar berdasarkan avatar_type.
     * - 'upload': URL file dari storage/public
     * - 'generated': null (frontend generate inisial)
     */
    private function resolveAvatarUrl($user): ?string
    {
        if ($user->avatar_type === 'upload' && $user->avatar) {
            return Storage::disk('public')->url($user->avatar);
        }

        return null;
    }
}
