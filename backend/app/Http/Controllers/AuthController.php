<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        try {
            $client = new \Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->token);

            if ($payload) {
                $googleId = $payload['sub'];
                $email = $payload['email'];
                $name = $payload['name'];
                $avatar = $payload['picture'] ?? null;

                $user = User::where('email', $email)->first();

                if ($user) {
                    if (!$user->is_active) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Akun dinonaktifkan.'
                        ], 403);
                    }
                    
                    // Update google_id and avatar if missing
                    $user->update([
                        'google_id' => $googleId,
                        'avatar' => $avatar,
                    ]);
                } else {
                    $user = User::create([
                        'google_id' => $googleId,
                        'email' => $email,
                        'name' => $name,
                        'avatar' => $avatar,
                        'role' => 'siswa',
                        'is_active' => true,
                    ]);
                }

                $token = $user->createToken('auth_token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Login berhasil',
                    'data' => [
                        'token' => $token,
                        'user' => $user,
                    ]
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Google tidak valid'
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Google Auth Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat verifikasi token: ' . $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Data pengguna',
            'data' => [
                'user' => $request->user(),
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }
}
