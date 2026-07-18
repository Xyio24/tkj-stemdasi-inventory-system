import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Trash2, Eye, EyeOff, Link2, Link2Off, Loader2 } from 'lucide-react';
import { getProfile, updateProfile, uploadAvatar, deleteAvatar } from '@/api/profile';
import { bindGoogle, unbindGoogle } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import GeneratedAvatar from '@/components/common/GeneratedAvatar';
import ImageCropModal from '@/components/common/ImageCropModal';
import { GoogleLogin } from '@react-oauth/google';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    name:  z.string().min(1, 'Nama wajib diisi.').max(255),
    email: z.string().min(1, 'Email wajib diisi.').email('Format email tidak valid.'),
});

const passwordSchema = z
    .object({
        current_password:      z.string().min(1, 'Password saat ini wajib diisi.'),
        password:              z.string().min(8, 'Password baru minimal 8 karakter.'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi.'),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Konfirmasi password tidak cocok.',
        path: ['password_confirmation'],
    });

type ProfileForm   = z.infer<typeof profileSchema>;
type PasswordForm  = z.infer<typeof passwordSchema>;

// ─── Input className helper ───────────────────────────────────────────────────

const inputCls = 'input-ios';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            </div>
            <div className="px-5 py-5">{children}</div>
        </div>
    );
}

// ─── Avatar Section ───────────────────────────────────────────────────────────

function AvatarSection({ avatarUrl, name, email }: { avatarUrl: string | null; name: string; email: string }) {
    const queryClient = useQueryClient();
    const updateUser  = useAuthStore((s) => s.updateUser);
    const fileRef     = useRef<HTMLInputElement>(null);

    // State untuk crop modal
    const [cropSrc, setCropSrc]   = useState<string | null>(null);

    const uploadMutation = useMutation({
        mutationFn: (file: File) => uploadAvatar(file),
        onSuccess: (res) => {
            toast.success('Foto profil berhasil diunggah.');
            updateUser({ avatar: res.data.avatar_url, avatar_url: res.data.avatar_url, avatar_type: 'upload' });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: () => toast.error('Gagal mengunggah foto.'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAvatar,
        onSuccess: () => {
            toast.success('Foto profil berhasil dihapus.');
            updateUser({ avatar: null, avatar_url: null, avatar_type: 'generated' });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: () => toast.error('Gagal menghapus foto.'),
    });

    const isBusy = uploadMutation.isPending || deleteMutation.isPending;

    /** User pilih file → buka modal crop */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Buat object URL untuk ditampilkan di crop modal
        const objectUrl = URL.createObjectURL(file);
        setCropSrc(objectUrl);
        // Reset input agar onChange trigger lagi kalau user pilih file yang sama
        e.target.value = '';
    };

    /** User konfirmasi crop → upload file hasil crop */
    const handleCropConfirm = (croppedFile: File) => {
        if (cropSrc) {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
        }
        uploadMutation.mutate(croppedFile);
    };

    /** User batal crop */
    const handleCropCancel = () => {
        if (cropSrc) {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
        }
    };

    return (
        <>
            <Section title="Foto Profil">
                <div className="flex items-center gap-5">
                    {/* Avatar display */}
                    <div className="relative shrink-0">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={name}
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <GeneratedAvatar name={name} email={email} size={80} />
                        )}
                        {isBusy && (
                            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-2 rounded-xl transition-all duration-200 ease-out active:scale-[0.97]"
                        >
                            <Camera className="w-3.5 h-3.5" />
                            {avatarUrl ? 'Ganti Foto' : 'Upload Foto'}
                        </Button>

                        {avatarUrl && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => deleteMutation.mutate()}
                                className="flex items-center gap-2 rounded-xl transition-all duration-200 ease-out active:scale-[0.97]"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Hapus Foto
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP — maks. 5 MB</p>
                    </div>
                </div>
            </Section>

            {/* Crop Modal — render di luar Section agar tidak ter-clip */}
            {cropSrc && (
                <ImageCropModal
                    imageSrc={cropSrc}
                    aspect={1}
                    title="Sesuaikan Foto Profil"
                    outputFilename="avatar.jpg"
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}

// ─── Edit Profile Section ─────────────────────────────────────────────────────

function EditProfileSection({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
    const queryClient = useQueryClient();
    const updateUser  = useAuthStore((s) => s.updateUser);

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: defaultName, email: defaultEmail },
    });

    const mutation = useMutation({
        mutationFn: (data: ProfileForm) => updateProfile(data),
        onSuccess: (res) => {
            toast.success('Profil berhasil diperbarui.');
            updateUser({ name: res.data.name, email: res.data.email });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (err: unknown) => {
            const msg =
                err &&
                typeof err === 'object' &&
                'response' in err
                    ? ((err as { response: { data?: { message?: string } } }).response.data?.message)
                    : undefined;
            toast.error(msg ?? 'Gagal memperbarui profil.');
        },
    });

    return (
        <Section title="Informasi Profil">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="p-name" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama Lengkap</label>
                    <input id="p-name" type="text" disabled={mutation.isPending} {...register('name')} aria-invalid={!!errors.name} className={inputCls} />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="p-email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                    <input id="p-email" type="email" disabled={mutation.isPending} {...register('email')} aria-invalid={!!errors.email} className={inputCls} />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <Button
                    type="submit"
                    disabled={mutation.isPending || !isDirty}
                    size="sm"
                >
                    {mutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : 'Simpan Perubahan'}
                </Button>
            </form>
        </Section>
    );
}


// ─── PasswordInput ────────────────────────────────────────────────────────────
// Didefinisikan di LUAR ChangePasswordSection agar referensi komponen stabil.
// Kalau didefinisikan di dalam, React akan unmount/remount setiap render
// karena referensi fungsi berubah → input kehilangan fokus saat validasi berjalan.

function PasswordInput({ id, label, show, toggle, err, disabled, ...inputProps }: {
    id: string;
    label: string;
    show: boolean;
    toggle: () => void;
    err?: string;
    disabled?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    disabled={disabled}
                    aria-invalid={!!err}
                    className={inputCls + ' pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden'}
                    {...inputProps}
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={toggle}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors z-10"
                    aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
            <p className="text-xs text-red-500 min-h-[1rem]">{err ?? ''}</p>
        </div>
    );
}

// ─── Change Password Section ──────────────────────────────────────────────────

function ChangePasswordSection() {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew]         = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
    });

    const mutation = useMutation({
        mutationFn: (data: PasswordForm) => updateProfile(data),
        onSuccess: () => {
            toast.success('Password berhasil diganti.');
            reset();
        },
        onError: (err: unknown) => {
            const resp = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
                : null;
            const fieldErr = resp?.data?.errors?.current_password?.[0];
            if (fieldErr) { toast.error(fieldErr); return; }
            toast.error(resp?.data?.message ?? 'Gagal mengganti password.');
        },
    });

    return (
        <Section title="Ganti Password">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <PasswordInput id="pw-current" label="Password Saat Ini"
                    show={showCurrent} toggle={() => setShowCurrent((v) => !v)}
                    disabled={mutation.isPending}
                    err={errors.current_password?.message}
                    {...register('current_password')} />
                <PasswordInput id="pw-new" label="Password Baru"
                    show={showNew} toggle={() => setShowNew((v) => !v)}
                    disabled={mutation.isPending}
                    err={errors.password?.message}
                    {...register('password')} />
                <PasswordInput id="pw-confirm" label="Konfirmasi Password Baru"
                    show={showConfirm} toggle={() => setShowConfirm((v) => !v)}
                    disabled={mutation.isPending}
                    err={errors.password_confirmation?.message}
                    {...register('password_confirmation')} />
                <Button type="submit" disabled={mutation.isPending}
                    size="sm">
                    {mutation.isPending
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
                        : 'Ganti Password'}
                </Button>
            </form>
        </Section>
    );
}

// ─── Google Binding Section ───────────────────────────────────────────────────

function GoogleBindingSection({ googleId }: { googleId: string | null }) {
    const queryClient = useQueryClient();
    const updateUser  = useAuthStore((s) => s.updateUser);

    const bindMutation = useMutation({
        mutationFn: (token: string) => bindGoogle(token),
        onSuccess: () => {
            toast.success('Akun Google berhasil dihubungkan.');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (err: unknown) => {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string } } }).response.data?.message
                : undefined;
            toast.error(msg ?? 'Gagal menghubungkan akun Google.');
        },
    });

    const unbindMutation = useMutation({
        mutationFn: unbindGoogle,
        onSuccess: () => {
            toast.success('Akun Google berhasil diputuskan.');
            updateUser({ google_id: null });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
        onError: (err: unknown) => {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response: { data?: { message?: string } } }).response.data?.message
                : undefined;
            toast.error(msg ?? 'Gagal memutuskan akun Google.');
        },
    });

    const isBusy = bindMutation.isPending || unbindMutation.isPending;

    return (
        <Section title="Akun Google">
            <div className="flex items-center justify-between">
                <div>
                    {googleId ? (
                        <>
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-green-500" />
                                Terhubung
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Akun Google kamu sudah terhubung. Kamu bisa login menggunakan Google.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Link2Off className="w-4 h-4 text-muted-foreground" />
                                Belum Terhubung
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Hubungkan akun Google agar bisa login menggunakan Google.
                            </p>
                        </>
                    )}
                </div>

                <div>
                    {googleId ? (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => unbindMutation.mutate()}
                            className="flex items-center gap-2 rounded-xl transition-all duration-200 ease-out active:scale-[0.97]"
                        >
                            {unbindMutation.isPending
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Link2Off className="w-3.5 h-3.5" />}
                            Putuskan
                        </Button>
                    ) : (
                        isBusy ? (
                            <Button type="button" variant="outline" size="sm" disabled className="rounded-xl">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            </Button>
                        ) : (
                            <GoogleLogin
                                onSuccess={(cred) => {
                                    if (cred.credential) bindMutation.mutate(cred.credential);
                                }}
                                onError={() => toast.error('Gagal mendapatkan token Google.')}
                                width="200"
                            />
                        )
                    )}
                </div>
            </div>
        </Section>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { data, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: getProfile,
    });

    const user = data?.data;

    if (isLoading || !user) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto w-full">
                <div className="h-8 w-48 skeleton rounded-xl" />
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card h-36 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Profil Saya</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi akun dan keamanan</p>
            </div>

            {/* Info bar — full width, hanya tampil jika ada data kelas */}
            {user.student_class && (
                <div className="glass-card px-5 py-4 flex flex-wrap gap-6 text-sm">
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kelas</span>
                        <p className="font-medium text-foreground mt-0.5">
                            {user.student_class.name}
                        </p>
                    </div>
                    {user.student_class.academic_year && (
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Angkatan</span>
                            <p className="font-medium text-foreground mt-0.5">
                                {user.student_class.academic_year.name}
                            </p>
                        </div>
                    )}
                    {user.absen_number && (
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. Absen</span>
                            <p className="font-medium text-foreground mt-0.5">
                                {user.absen_number}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* 2-column grid di desktop, stack di mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Kolom kiri — Foto Profil + Informasi Profil */}
                <div className="space-y-6 flex flex-col">
                    <AvatarSection avatarUrl={user.avatar_url} name={user.name} email={user.email} />
                    <EditProfileSection defaultName={user.name} defaultEmail={user.email} />
                </div>

                {/* Kolom kanan — Ganti Password + Akun Google */}
                <div className="space-y-6 flex flex-col">
                    <ChangePasswordSection />
                    <GoogleBindingSection googleId={user.google_id} />
                </div>
            </div>
        </div>
    );
}
