import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginWithGoogle } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
    email:    z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
    password: z.string().min(1, 'Password wajib diisi.'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Frosted Input ────────────────────────────────────────────────────────────

interface FrostedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

function FrostedInput({ hasError, className = '', ...props }: FrostedInputProps) {
    return (
        <input
            {...props}
            aria-invalid={hasError}
            className={[
                'input-ios',
                hasError
                    ? 'border-red-400/60 ring-4 ring-red-400/15'
                    : '',
                className,
            ].join(' ')}
        />
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
    const setAuth                  = useAuthStore((state) => state.setAuth);
    const loginWithPasswordAction  = useAuthStore((state) => state.loginWithPassword);
    const navigate                 = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [googleError,  setGoogleError]  = useState<string | null>(null);

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
            setGoogleError(getErrorMessage(error, 'Login Google gagal. Silakan coba lagi.'));
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
            toast.error(getErrorMessage(error, 'Login gagal. Silakan coba lagi.'));
        },
    });

    const onSubmit = (values: LoginForm) => {
        setGoogleError(null);
        passwordMutation.mutate(values);
    };

    const isPending = googleMutation.isPending || passwordMutation.isPending;

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-dvh flex items-center justify-center p-4">
            <div className="w-full max-w-sm animate-fade-up">

                {/* ── Logo & title ── */}
                <div className="text-center mb-8 animate-fade-up">
                    {/* Logo badge with glow */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary shadow-glow-blue mb-5 animate-spring-in">
                        <img src="/tkj.svg" alt="TKJ Logo" className="w-9 h-9 object-contain brightness-0 invert" />
                    </div>

                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Inventory TKJ
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                        Sistem Inventaris & Peminjaman Barang
                    </p>
                </div>

                {/* ── Glass Card ── */}
                <div className="glass-card px-7 py-7 animate-fade-up delay-100">

                    <h2 className="text-base font-semibold text-foreground text-center mb-6">
                        Masuk ke Akun
                    </h2>

                    {/* Google Login */}
                    <div className="flex flex-col items-center gap-3">
                        {isPending ? (
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-2">
                                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Memproses login...
                            </div>
                        ) : (
                            <div className="w-full flex justify-center">
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
                            </div>
                        )}

                        {/* Google error */}
                        {googleError && (
                            <div className="w-full rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-fade-up">
                                {googleError}
                                {googleError.includes('belum terdaftar') && (
                                    <span>
                                        {' '}
                                        <Link to="/register" className="underline font-semibold hover:text-red-800 dark:hover:text-red-300">
                                            Daftar sekarang
                                        </Link>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-border/60" />
                        <span className="text-xs text-muted-foreground/70 font-medium select-none">atau</span>
                        <div className="flex-1 h-px bg-border/60" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                        {/* Email */}
                        <div className="space-y-1.5 animate-fade-up delay-150">
                            <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                                Email
                            </label>
                            <FrostedInput
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@email.com"
                                disabled={isPending}
                                hasError={!!errors.email}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 dark:text-red-400 animate-fade-in">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 animate-fade-up delay-200">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                                Password
                            </label>
                            <div className="relative">
                                <FrostedInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    disabled={isPending}
                                    hasError={!!errors.password}
                                    className="pr-11"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground hover:text-foreground transition-colors duration-150"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword
                                        ? <EyeOff className="w-4 h-4" />
                                        : <Eye    className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 dark:text-red-400 animate-fade-in">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="animate-fade-up delay-300 pt-1">
                            <Button
                                type="submit"
                                size="lg"
                                loading={passwordMutation.isPending}
                                disabled={isPending}
                                className="w-full gap-2"
                            >
                                {!passwordMutation.isPending && (
                                    <>
                                        Masuk
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                                {passwordMutation.isPending && 'Masuk...'}
                            </Button>
                        </div>
                    </form>

                    {/* Register link */}
                    <p className="text-center text-sm text-muted-foreground mt-5 animate-fade-up delay-300">
                        Belum punya akun?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline underline-offset-2 transition-all">
                            Daftar sekarang
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground/60 mt-6 animate-fade-up delay-500">
                    Jurusan Teknik Komputer dan Jaringan · SMKN 2 Singosari
                </p>
            </div>
        </div>
    );
}
