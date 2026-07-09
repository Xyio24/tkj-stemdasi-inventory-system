import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { registerUser } from '@/api/auth';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import type { AcademicYear, StudentClass } from '@/api/masterData';

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
    .object({
        name:                  z.string().min(1, 'Nama lengkap wajib diisi.').max(255),
        email:                 z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
        password:              z.string().min(8, 'Password minimal 8 karakter.'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi.'),
        academic_year_id:      z.string().min(1, 'Angkatan wajib dipilih.'),
        class_id:              z.string().min(1, 'Kelas wajib dipilih.'),
        absen_number:          z
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

// ─── API (public) ─────────────────────────────────────────────────────────────

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

function getClassPlaceholder(
    selectedYearId: number | null,
    loadingClasses: boolean,
    classes: StudentClass[],
    isFetched: boolean,
): string {
    if (!selectedYearId)  return '-- Pilih angkatan dulu --';
    if (loadingClasses)   return 'Memuat kelas...';
    if (isFetched && classes.length === 0) return 'Tidak ada kelas untuk angkatan ini';
    return '-- Pilih Kelas --';
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
                hasError ? 'border-red-400/60 ring-4 ring-red-400/15' : '',
                className,
            ].join(' ')}
        />
    );
}

interface FrostedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
}

function FrostedSelect({ hasError, className = '', children, ...props }: FrostedSelectProps) {
    return (
        <select
            {...props}
            aria-invalid={hasError}
            className={[
                'input-ios appearance-none cursor-pointer',
                hasError ? 'border-red-400/60 ring-4 ring-red-400/15' : '',
                className,
            ].join(' ')}
        >
            {children}
        </select>
    );
}

// ─── Field Wrapper ────────────────────────────────────────────────────────────

function Field({
    label,
    htmlFor,
    error,
    delay,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    delay?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={['space-y-1.5 animate-fade-up', delay].filter(Boolean).join(' ')}>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground/80">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500 dark:text-red-400 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
    return (
        <div className="min-h-dvh flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center animate-spring-in">
                {/* Success icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 animate-spring-in">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                    Pendaftaran Berhasil!
                </h1>
                <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
                    Akun kamu sedang menunggu persetujuan admin.
                    Kamu bisa masuk setelah akun disetujui.
                </p>

                <Button asChild size="lg" className="w-full gap-2">
                    <Link to="/login">
                        Kembali ke Halaman Masuk
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Register() {
    const [showPassword, setShowPassword]   = useState(false);
    const [showConfirm,  setShowConfirm]    = useState(false);
    const [isSuccess,    setIsSuccess]      = useState(false);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

    const { data: academicYears = [], isLoading: loadingYears } = useQuery({
        queryKey: ['public-academic-years'],
        queryFn: fetchActiveAcademicYears,
    });

    const {
        data: classes = [],
        isLoading: loadingClasses,
        isFetched: classesFetched,
    } = useQuery({
        queryKey: ['public-classes', selectedYearId],
        queryFn: () => fetchClassesByYear(selectedYearId!),
        enabled: !!selectedYearId,
    });

    const registerMutation = useMutation({
        mutationFn: (data: RegisterForm) =>
            registerUser({
                name:                  data.name,
                email:                 data.email,
                password:              data.password,
                password_confirmation: data.password_confirmation,
                class_id:              Number(data.class_id),
                absen_number:          Number(data.absen_number),
            }),
        onSuccess: () => setIsSuccess(true),
        onError: (error: unknown) => {
            if (error && typeof error === 'object' && 'response' in error) {
                const resp = (error as {
                    response: { data?: { message?: string; errors?: Record<string, string[]> } };
                }).response;
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
    const isPending = registerMutation.isPending;

    if (isSuccess) return <SuccessScreen />;

    return (
        <div className="min-h-dvh flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-sm">

                {/* ── Logo & title ── */}
                <div className="text-center mb-7 animate-fade-up">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary shadow-glow-blue mb-5 animate-spring-in">
                        <img src="/tkj.svg" alt="TKJ Logo" className="w-9 h-9 object-contain brightness-0 invert" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Daftar Akun
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                        Isi data diri kamu untuk mendaftar
                    </p>
                </div>

                {/* ── Glass Card ── */}
                <div className="glass-card px-7 py-7 animate-fade-up delay-100">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                        {/* Nama Lengkap */}
                        <Field label="Nama Lengkap" htmlFor="name" error={errors.name?.message} delay="delay-100">
                            <FrostedInput
                                id="name"
                                type="text"
                                autoComplete="name"
                                placeholder="Nama sesuai data sekolah"
                                disabled={isPending}
                                hasError={!!errors.name}
                                {...register('name')}
                            />
                        </Field>

                        {/* Email */}
                        <Field label="Email" htmlFor="email" error={errors.email?.message} delay="delay-150">
                            <FrostedInput
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nama@email.com"
                                disabled={isPending}
                                hasError={!!errors.email}
                                {...register('email')}
                            />
                        </Field>

                        {/* Password */}
                        <Field label="Password" htmlFor="password" error={errors.password?.message} delay="delay-150">
                            <div className="relative">
                                <FrostedInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
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
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        {/* Konfirmasi Password */}
                        <Field
                            label="Konfirmasi Password"
                            htmlFor="password_confirmation"
                            error={errors.password_confirmation?.message}
                            delay="delay-200"
                        >
                            <div className="relative">
                                <FrostedInput
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    placeholder="Ulangi password"
                                    disabled={isPending}
                                    hasError={!!errors.password_confirmation}
                                    className="pr-11"
                                    {...register('password_confirmation')}
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-muted-foreground hover:text-foreground transition-colors duration-150"
                                    aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1 animate-fade-up delay-200">
                            <div className="flex-1 h-px bg-border/60" />
                            <span className="text-xs text-muted-foreground/70 font-medium select-none">Data Sekolah</span>
                            <div className="flex-1 h-px bg-border/60" />
                        </div>

                        {/* Angkatan */}
                        <Field
                            label="Angkatan"
                            htmlFor="academic_year_id"
                            error={errors.academic_year_id?.message}
                            delay="delay-200"
                        >
                            <FrostedSelect
                                id="academic_year_id"
                                disabled={isPending || loadingYears}
                                hasError={!!errors.academic_year_id}
                                {...register('academic_year_id', {
                                    onChange: (e) => {
                                        setValue('class_id', '');
                                        setSelectedYearId(Number(e.target.value) || null);
                                    },
                                })}
                            >
                                <option value="">
                                    {loadingYears ? 'Memuat...' : '-- Pilih Angkatan --'}
                                </option>
                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </FrostedSelect>
                        </Field>

                        {/* Kelas */}
                        <Field
                            label="Kelas"
                            htmlFor="class_id"
                            error={errors.class_id?.message}
                            delay="delay-300"
                        >
                            <FrostedSelect
                                id="class_id"
                                disabled={
                                    isPending ||
                                    !selectedYearId ||
                                    loadingClasses ||
                                    (classesFetched && classes.length === 0)
                                }
                                hasError={!!errors.class_id}
                                {...register('class_id')}
                            >
                                <option value="">
                                    {getClassPlaceholder(selectedYearId, loadingClasses, classes, classesFetched)}
                                </option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </FrostedSelect>
                            {selectedYearId && classesFetched && !loadingClasses && classes.length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    Belum ada kelas untuk angkatan ini. Hubungi admin.
                                </p>
                            )}
                        </Field>

                        {/* Nomor Absen */}
                        <Field
                            label="Nomor Absen"
                            htmlFor="absen_number"
                            error={errors.absen_number?.message}
                            delay="delay-300"
                        >
                            <FrostedInput
                                id="absen_number"
                                type="number"
                                min={1}
                                max={99}
                                placeholder="Contoh: 12"
                                disabled={isPending}
                                hasError={!!errors.absen_number}
                                {...register('absen_number')}
                            />
                        </Field>

                        {/* Submit */}
                        <div className="pt-2 animate-fade-up delay-300">
                            <Button
                                type="submit"
                                size="lg"
                                loading={isPending}
                                disabled={isPending}
                                className="w-full gap-2"
                            >
                                {!isPending && (
                                    <>
                                        Daftar Sekarang
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                                {isPending && 'Mendaftar...'}
                            </Button>
                        </div>
                    </form>

                    {/* Login link */}
                    <p className="text-center text-sm text-muted-foreground mt-5 animate-fade-up delay-300">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline underline-offset-2 transition-all">
                            Masuk
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
