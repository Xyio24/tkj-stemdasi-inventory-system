import { GoogleLogin } from '@react-oauth/google';
import { useMutation } from '@tanstack/react-query';
import { loginWithGoogle } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Package } from 'lucide-react';

export default function Login() {
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const loginMutation = useMutation({
        mutationFn: (token: string) => loginWithGoogle(token),
        onSuccess: (data) => {
            if (data.success) {
                setAuth(data.data.token, data.data.user);
                toast.success('Login berhasil');
                navigate('/dashboard');
            }
        },
        onError: () => {
            toast.error('Login gagal. Silakan coba lagi.');
        },
    });

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo & title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
                        <Package className="w-7 h-7 text-white" />
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
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Gunakan akun Google sekolah Anda untuk masuk.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        {loginMutation.isPending ? (
                            <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                Memproses login...
                            </div>
                        ) : (
                            <GoogleLogin
                                onSuccess={(credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        loginMutation.mutate(credentialResponse.credential);
                                    }
                                }}
                                onError={() => {
                                    toast.error('Login Google gagal. Silakan coba lagi.');
                                }}
                                useOneTap
                                width="280"
                            />
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
                    Jurusan Teknik Komputer dan Jaringan
                </p>
            </div>
        </div>
    );
}
