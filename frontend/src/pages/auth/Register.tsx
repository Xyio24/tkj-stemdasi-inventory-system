import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { registerUser } from '@/api/auth';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import type { AcademicYear, StudentClass } from '@/api/masterData';

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
    .object({
        name: z.string().min(1, 'Nama lengkap wajib diisi.').max(255),
        email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
        password: z.string().min(8, 'Password minimal 8 karakter.'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi.'),
        academic_year_id: z.string().min(1, 'Angkatan wajib dipilih.'),
        class_id: z.string().min(1, 'Kelas wajib dipilih.'),
        absen_number: z
            .string()
            .min(1, 'Nomor absen wajib diisi.')
            .refine((v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 99, {
                message: 'Nomor absen harus antara 1–99.',
            }),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Konfirmasi password tidak cocok.',
        path: ['password_confirmation'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── API (public — no auth) ───────────────────────────────────────────────────

const fetchActiveAcademicYears = async (): Promise<AcademicYear[]> => {
    const res = await api.get('/public/academic-years');
    const years: AcademicYear[] = res.data.data ?? [];
    return years.filter((y) => y.is_active);
};

const fetchClassesByYear = async (academicYearId: number): Promise<StudentClass[]> => {
    const res = await api.get('/public/classes', {
        params: { academic_year_id: academicYearId },
    });
    return res.data.data ?? [];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const { data: academicYears = [], isLoading: loadingYears } = useQuery({
        queryKey: ['public-academic-years'],
        queryFn: fetchActiveAcademicYears,
    });

    const { data: classes = [], isLoading: loadingClasses } = useQuery({
        queryKey: ['public-classes', selectedYearId],
        queryFn: () => fetchClassesByYear(selectedYearId!),
        enabled: !!selectedYearId,
    });

    const registerMutation = useMutation({
        mutationFn: (data: RegisterForm) =>
            registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                class_id: Number(data.class_id),
                absen_number: Number(data.absen_number),
            }),
        onSuccess: () => {
            setIsSuccess(true);
        },
        onError: (error: unknown) => {
            if (error && typeof error === 'object' && 'response' in error) {
                const resp = (
                    error as {
                        response: { data?: { message?: string; errors?: Record<string, string[]> } };
                    }
                ).response;
                const fieldErrors = resp.data?.errors;
                if (fieldErrors) {
                    const first = Object.values(fieldErrors)[0]?.[0];
                    if (first) { toast.error(first); return; }
                }
                if (resp.data?.message) { toast.error(resp.data.message); return; }
            }
            toast.error('Pendaftaran gagal. Silakan coba lagi.');
        },
    });

    const onSubmit = (values: RegisterForm) => registerMutation.mutate(values);

    // ── Success ───────────────────────────────────────────────────────────────

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
                <div className="w-full max-w-sm text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        Pendaftaran Berhasil!
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
                        Akun kamu sedang menunggu persetujuan admin.
                        Kamu bisa masuk setelah akun disetujui.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center w-full h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                    >
                        Kembali ke Halaman Masuk
                    </Link>
                </div>
            </div>
        );
    }

    // ── Form ──────────────────────────────────────────────────────────────────

    const inputClass =
        'w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-400/20 transition';

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
                        <Package className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                        Daftar Akun
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        Isi data diri kamu untuk mendaftar
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm px-8 py-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                        {/* Nama Lengkap */}
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Nama Lengkap
                            </label>
                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Nama sesuai data sekolah"
                                disabled={registerMutation.isPending}
                                {...register('name')}
                                aria-invalid={!!errors.name}
                                className={inputClass}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@email.com"
                                disabled={registerMutation.isPending}
                                {...register('email')}
                                aria-invalid={!!errors.email}
                                className={inputClass}
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    disabled={registerMutation.isPending}
                                    {...register('password')}
                                    aria-invalid={!!errors.password}
                                    className={inputClass + ' pr-10'}
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password_confirmation" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Konfirmasi Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Ulangi password"
                                    disabled={registerMutation.isPending}
                                    {...register('password_confirmation')}
                                    aria-invalid={!!errors.password_confirmation}
                                    className={inputClass + ' pr-10'}
                                />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                    aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}>
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>
                            )}
                        </div>

                        {/* Angkatan */}
                        <div className="space-y-1.5">
                            <label htmlFor="academic_year_id" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Angkatan
                            </label>
                            <select
                                id="academic_year_id"
                                disabled={registerMutation.isPending || loadingYears}
                                {...register('academic_year_id')}
                                onChange={(e) => {
                                    setValue('academic_year_id', e.target.value);
                                    setValue('class_id', '');
                                    setSelectedYearId(Number(e.target.value) || null);
                                }}
                                aria-invalid={!!errors.academic_year_id}
                                className={inputClass}
                            >
                                <option value="">
                                    {loadingYears ? 'Memuat...' : '-- Pilih Angkatan --'}
                                </option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                            {errors.academic_year_id && (
                                <p className="text-xs text-red-500">{errors.academic_year_id.message}</p>
                            )}
                        </div>

                        {/* Kelas */}
                        <div className="space-y-1.5">
                            <label htmlFor="class_id" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Kelas
                            </label>
                            <select
                                id="class_id"
                                disabled={registerMutation.isPending || !selectedYearId || loadingClasses}
                                {...register('class_id')}
                                aria-invalid={!!errors.class_id}
                                className={inputClass}
                            >
                                <option value="">
                                    {!selectedYearId
                                        ? '-- Pilih angkatan dulu --'
                                        : loadingClasses
                                            ? 'Memuat kelas...'
                                            : '-- Pilih Kelas --'}
                                </option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                            {errors.class_id && (
                                <p className="text-xs text-red-500">{errors.class_id.message}</p>
                            )}
                        </div>

                        {/* Nomor Absen */}
                        <div className="space-y-1.5">
                            <label htmlFor="absen_number" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Nomor Absen
                            </label>
                            <input
                                id="absen_number"
                                type="number"
                                min={1}
                                max={99}
                                placeholder="Contoh: 12"
                                disabled={registerMutation.isPending}
                                {...register('absen_number')}
                                aria-invalid={!!errors.absen_number}
                                className={inputClass}
                            />
                            {errors.absen_number && (
                                <p className="text-xs text-red-500">{errors.absen_number.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={registerMutation.isPending}
                            className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                        >
                            {registerMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Mendaftar...
                                </span>
                            ) : (
                                'Daftar'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                            Masuk
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
