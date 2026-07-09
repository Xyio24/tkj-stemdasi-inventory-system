<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // ─── Register ─────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/register
     *
     * Pendaftaran akun baru oleh siswa.
     * Akun berstatus 'pending' sampai disetujui admin.
     */
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name'         => $request->name,
            'email'        => $request->email,
            'password'     => $request->password, // Di-hash otomatis via cast 'hashed'
            'class_id'     => $request->class_id,
            'absen_number' => $request->absen_number,
            'role'         => 'siswa',
            'status'       => 'pending',
            'avatar_type'  => 'generated',
        ]);

        ActivityLogService::log(
            'auth.register',
            "Siswa {$user->name} mendaftar akun baru, menunggu persetujuan admin.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran berhasil. Akun kamu sedang menunggu persetujuan admin.',
        ], 201);
    }

    // ─── Login Email + Password ────────────────────────────────────────────────

    /**
     * POST /api/auth/login
     *
     * Login dengan email + password.
     * Hanya akun berstatus 'active' yang diizinkan.
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        // Cek user ada dan password cocok
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password tidak valid.',
            ], 401);
        }

        // Cek status akun
        if ($user->status !== 'active') {
            $message = match ($user->status) {
                'pending' => 'Akun kamu belum disetujui admin. Silakan tunggu konfirmasi.',
                'blocked' => 'Akun kamu telah diblokir. Hubungi admin untuk informasi lebih lanjut.',
                default   => 'Akun tidak aktif.',
            };

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogService::log(
            'auth.login',
            "{$user->name} berhasil login menggunakan email/password.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'token'      => $token,
                'token_type' => 'Bearer',
                'user'       => $user,
            ],
        ]);
    }

    // ─── Google Login ──────────────────────────────────────────────────────────

    /**
     * POST /api/auth/google
     *
     * Login via Google OAuth.
     * - Email belum terdaftar  → tolak 403
     * - Email ada, google_id null → bind google_id lalu login
     * - Email ada, google_id match → login biasa
     * - Status bukan 'active' → tolak 403
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $client  = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if (! $payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google tidak valid.',
                ], 422);
            }

            $googleId = $payload['sub'];
            $email    = $payload['email'];
            $avatar   = $payload['picture'] ?? null;

            // Cari user by google_id DULU — menangani akun yang di-bind ke Google
            // dengan email berbeda dari email di sistem (misal: bind b@gmail.com ke
            // akun yang terdaftar dengan a@sekolah.sch.id)
            $user = User::where('google_id', $googleId)->first();

            // Jika tidak ketemu by google_id, cari by email
            if (! $user) {
                $user = User::where('email', $email)->first();
            }

            // Jika tidak ketemu sama sekali, tolak — tidak auto-create
            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ini belum terdaftar. Silakan daftar terlebih dahulu.',
                ], 403);
            }

            // Cek status akun
            if ($user->status !== 'active') {
                $message = match ($user->status) {
                    'pending' => 'Akun kamu belum disetujui admin. Silakan tunggu konfirmasi.',
                    'blocked' => 'Akun kamu telah diblokir. Hubungi admin untuk informasi lebih lanjut.',
                    default   => 'Akun tidak aktif.',
                };

                return response()->json([
                    'success' => false,
                    'message' => $message,
                ], 403);
            }

            // Jika ditemukan by email dan google_id belum di-bind, bind sekarang
            // (hanya terjadi jika lookup by google_id gagal, artinya ketemu by email)
            if (is_null($user->google_id)) {
                $user->update([
                    'google_id' => $googleId,
                    'avatar'    => $user->avatar ?? $avatar,
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            ActivityLogService::log(
                'auth.login',
                "{$user->name} berhasil login menggunakan Google.",
                $user
            );

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil',
                'data'    => [
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'user'       => $user,
                ],
            ]);

        } catch (\Throwable $e) {
            Log::error('Google Auth Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat verifikasi token.',
            ], 500);
        }
    }

    // ─── Bind Google ───────────────────────────────────────────────────────────

    /**
     * POST /api/auth/bind-google
     *
     * Hubungkan akun Google ke akun yang sedang login.
     * Hanya bisa jika google_id belum di-bind, dan google_id dari token
     * belum dipakai akun lain.
     */
    public function bindGoogle(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $client  = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if (! $payload) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google tidak valid.',
                ], 422);
            }

            $googleId    = $payload['sub'];
            $googleEmail = $payload['email'];
            $user        = $request->user();

            // Validasi: email Google harus sama dengan email akun yang sedang login.
            // Mencegah user A menghubungkan akun Google milik user B ke akunnya.
            if ($googleEmail !== $user->email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email akun Google harus sama dengan email akun kamu (' . $user->email . ').',
                ], 422);
            }

            // Cek apakah google_id ini sudah dipakai akun lain
            $alreadyBound = User::where('google_id', $googleId)
                ->where('id', '!=', $user->id)
                ->exists();

            if ($alreadyBound) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun Google ini sudah terhubung ke akun lain.',
                ], 409);
            }

            // Cek apakah user ini sudah punya google_id
            if (! is_null($user->google_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akun kamu sudah terhubung ke Google.',
                ], 409);
            }

            $user->update(['google_id' => $googleId]);

            ActivityLogService::log(
                'auth.google_bound',
                "{$user->name} menghubungkan akun Google.",
                $user
            );

            return response()->json([
                'success' => true,
                'message' => 'Akun Google berhasil dihubungkan.',
            ]);

        } catch (\Throwable $e) {
            Log::error('Bind Google Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghubungkan akun Google.',
            ], 500);
        }
    }

    // ─── Unbind Google ─────────────────────────────────────────────────────────

    /**
     * DELETE /api/auth/unbind-google
     *
     * Lepas binding Google dari akun.
     * Hanya bisa jika user punya password — mencegah lockout.
     */
    public function unbindGoogle(Request $request)
    {
        $user = $request->user();

        // Cek google_id ada
        if (is_null($user->google_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Akun kamu belum terhubung ke Google.',
            ], 409);
        }

        // Cek user punya password — jika tidak, putuskan hubungan akan menyebabkan lockout
        if (is_null($user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa memutuskan hubungan Google karena akun ini tidak memiliki password. Buat password terlebih dahulu.',
            ], 409);
        }

        $user->update(['google_id' => null]);

        ActivityLogService::log(
            'auth.google_unbound',
            "{$user->name} memutuskan hubungan akun Google.",
            $user
        );

        return response()->json([
            'success' => true,
            'message' => 'Akun Google berhasil diputuskan.',
        ]);
    }

    // ─── Me ────────────────────────────────────────────────────────────────────

    /**
     * GET /api/auth/me
     *
     * Mengembalikan data user yang sedang login.
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Data pengguna',
            'data'    => [
                'user' => $request->user()->load('studentClass.academicYear'),
            ],
        ]);
    }

    // ─── Logout ────────────────────────────────────────────────────────────────

    /**
     * POST /api/auth/logout
     *
     * Hapus token aktif dari database.
     */
    public function logout(Request $request)
    {
        ActivityLogService::log(
            'auth.logout',
            "{$request->user()->name} logout.",
            $request->user()
        );

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
        ]);
    }
}
