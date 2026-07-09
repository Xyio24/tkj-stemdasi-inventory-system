<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Cek dua hal:
     * 1. Role user sesuai dengan yang diizinkan
     * 2. Status akun = 'active' (bukan pending/blocked)
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Cek status akun
        if ($user->status !== 'active') {
            $message = match ($user->status) {
                'pending' => 'Akun kamu belum disetujui admin. Silakan tunggu konfirmasi.',
                'blocked' => 'Akun kamu telah diblokir. Hubungi admin untuk informasi lebih lanjut.',
                default   => 'Akun kamu tidak aktif.',
            };

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 403);
        }

        // Cek role
        if (!in_array($user->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke resource ini.',
            ], 403);
        }

        return $next($request);
    }
}
