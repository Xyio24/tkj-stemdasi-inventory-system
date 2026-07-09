import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { loginWithGoogle } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
    password: z.string().min(1, 'Password wajib diisi.'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ambil pesan error dari response Axios.
 * Backend mengembalikan { success: false, message: '...' }
 */
function getErrorMessage(error: unknown, fallback: string): string {
    if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
    ) {
        const data = (error.response as { data: { message?: string } }).data;
        return data?.message || fallback;
    }
    return fallback;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const loginWithPasswordAction = useAuthStore((state) => state.loginWithPassword);
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

    // ── Google Login ──────────────────────────────────────────────────────────

    const googleMutation = useMutation({
        mutationFn: (token: string) => loginWithGoogle(token),
        onSuccess: (data) => {
            setAuth(data.data.token, data.data.user);
            toast.success('Login berhasil');
            navigate('/dashboard');
        },
        onError: (error) => {
            const msg = getErrorMessage(
                error,
                'Login Google gagal. Silakan coba lagi.'
            );
            setGoogleError(msg);
        },
    });

    // ── Email + Password Login ────────────────────────────────────────────────

    const passwordMutation = useMutation({
        mutationFn: ({ email, password }: LoginForm) =>
            loginWithPasswordAction(email, password),
        onSuccess: () => {
            toast.success('Login berhasil');
            navigate('/dashboard');
        },
        onError: (error) => {
            const msg = getErrorMessage(error, 'Login gagal. Silakan coba lagi.');
            toast.error(msg);
        },
    });

    const onSubmit = (values: LoginForm) => {
        setGoogleError(null);
        passwordMutation.mutate(values);
    };

    const isPending = googleMutation.isPending || passwordMutation.isPending;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Logo & title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
                        <img src="/tkj.svg" alt="TKJ Logo" className="w-9 h-9 object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                        Inventory TKJ
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Sistem Inventaris & Peminjaman Barang
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm px-8 py-8">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            Masuk
                        </h2>
                    </div>

                    {/* Google Login */}
                    <div className="flex flex-col items-center gap-2">
                        {isPending ? (
                            <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                Memproses login...
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={(credentialResponse) => {
                                    setGoogleError(null);
                                    if (credentialResponse.credential) {
                                        googleMutation.mutate(credentialResponse.credential);
                                    }
                                }}
                                onError={() => {
                                    setGoogleError('Login Google gagal. Silakan coba lagi.');
                                }}
                                useOneTap
                                width="280"
                            />
                        )}

                        {/* Error dari Google login */}
                        {googleError && (
                            <div className="w-full rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                {googleError}
                                {googleError.includes('belum terdaftar') && (
                                    <span>
                                        {' '}
                                        <Link
                                            to="/register"
                                            className="underline font-medium hover:text-red-800 dark:hover:text-red-300"
                                        >
                                            Daftar sekarang
                                        </Link>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Separator */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">atau</span>
                        <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                    </div>

                    {/* Email + Password Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@email.com"
                                disabled={isPending}
                                {...register('email')}
                                aria-invalid={!!errors.email}
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20 transition"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    disabled={isPending}
                                    {...register('password')}
                                    aria-invalid={!!errors.password}
                                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 pr-10 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20 transition"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                        >
                            {passwordMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Masuk...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </Button>
                    </form>

                    {/* Register link */}
                    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
                        Belum punya akun?{' '}
                        <Link
                            to="/register"
                            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                        >
                            Daftar sekarang
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
                    Jurusan Teknik Komputer dan Jaringan
                </p>
            </div>
        </div>
    );
}
