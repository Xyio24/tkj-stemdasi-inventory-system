import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
    ChevronDown,
    BookOpen,
    UserPlus,
    LogIn,
    Package,
    ClipboardList,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Users,
    Tag,
    GraduationCap,
    CalendarDays,
    FileBarChart2,
    ArrowRight,
    Info,
    Camera,
    AlertTriangle,
    ShieldCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
    text: string;
    note?: string;
}

interface GuideSection {
    id:          string;
    icon:        React.ReactNode;
    title:       string;
    description: string;
    steps:       Step[];
    link?:       { to: string; label: string };
    tip?:        string;
    roles:       ('siswa' | 'guru' | 'admin')[];
}

// ─── Guide Data ───────────────────────────────────────────────────────────────

const GUIDE_SECTIONS: GuideSection[] = [
    {
        id: 'register',
        icon: <UserPlus className="w-4 h-4" />,
        title: 'Mendaftar Akun',
        description: 'Cara membuat akun baru sebagai siswa.',
        roles: ['siswa'],
        steps: [
            { text: 'Buka halaman Daftar dari halaman login.' },
            { text: 'Isi nama lengkap, email, dan password (minimal 8 karakter).' },
            { text: 'Pilih Angkatan yang sesuai dengan tahun masukmu.' },
            { text: 'Pilih Kelas dari angkatan yang dipilih.' },
            { text: 'Isi Nomor Absen sesuai absen kelas.' },
            { text: 'Klik Daftar.' },
            { text: 'Akun menunggu persetujuan admin — kamu akan bisa login setelah disetujui.', note: 'Hubungi guru atau admin jika sudah lama belum disetujui.' },
        ],
    },
    {
        id: 'login',
        icon: <LogIn className="w-4 h-4" />,
        title: 'Login ke Sistem',
        description: 'Masuk menggunakan email & password atau akun Google.',
        roles: ['siswa', 'guru', 'admin'],
        steps: [
            { text: 'Buka halaman login.' },
            { text: 'Pilih metode login: isi email & password, atau klik Masuk dengan Google.' },
            { text: 'Jika menggunakan Google, pilih akun Google yang sudah terdaftar.', note: 'Google login hanya bisa dipakai jika sudah dihubungkan lewat halaman Profil.' },
            { text: 'Kamu akan diarahkan ke Dashboard setelah berhasil masuk.' },
        ],
        link: { to: '/login', label: 'Ke Halaman Login' },
    },
    {
        id: 'browse-items',
        icon: <Package className="w-4 h-4" />,
        title: 'Melihat Daftar Barang',
        description: 'Cari dan lihat detail barang yang tersedia untuk dipinjam.',
        roles: ['siswa', 'guru', 'admin'],
        steps: [
            { text: 'Klik menu Barang di sidebar kiri.' },
            { text: 'Gunakan kolom pencarian untuk mencari barang berdasarkan nama, merek, atau model.' },
            { text: 'Filter berdasarkan kategori atau kondisi jika perlu.' },
            { text: 'Lihat kolom Stok untuk mengetahui ketersediaan barang.' },
        ],
        link: { to: '/dashboard/items', label: 'Lihat Barang' },
    },
    {
        id: 'borrow',
        icon: <ClipboardList className="w-4 h-4" />,
        title: 'Mengajukan Peminjaman',
        description: 'Cara mengajukan permohonan peminjaman barang inventaris.',
        roles: ['siswa', 'guru', 'admin'],
        steps: [
            { text: 'Klik menu Peminjaman di sidebar.' },
            { text: 'Klik tombol + Buat Peminjaman.' },
            { text: 'Isi Tujuan Peminjaman dengan jelas.' },
            { text: 'Pilih Tanggal Pinjam dan Tanggal Kembali.' },
            { text: 'Tambahkan barang: klik Tambah Barang, cari nama barang, tentukan jumlah.' },
            { text: 'Upload foto selfie sebagai bukti identitas.', note: 'Foto harus jelas dan menampilkan wajahmu.' },
            { text: 'Klik Kirim Permohonan.' },
            { text: 'Status awal Menunggu — tunggu guru atau admin menyetujui.' },
        ],
        link: { to: '/dashboard/borrowings/create', label: 'Buat Peminjaman' },
        tip: 'Pastikan stok barang tersedia sebelum mengajukan. Stok yang tampil di halaman Barang adalah stok kondisi baik.',
    },
    {
        id: 'track',
        icon: <Info className="w-4 h-4" />,
        title: 'Memantau Status Peminjaman',
        description: 'Cek status dan riwayat semua peminjamanmu.',
        roles: ['siswa', 'guru', 'admin'],
        steps: [
            { text: 'Klik menu Peminjaman di sidebar.' },
            { text: 'Daftar semua peminjamanmu ditampilkan dengan status masing-masing.' },
            { text: 'Klik peminjaman untuk melihat detail lengkap, termasuk barang dan foto.' },
            { text: 'Status Disetujui berarti barang sudah bisa diambil.' },
            { text: 'Status Terlambat berarti sudah melewati tanggal pengembalian — segera kembalikan.' },
        ],
        link: { to: '/dashboard/borrowings', label: 'Lihat Peminjaman' },
    },
    {
        id: 'return',
        icon: <RotateCcw className="w-4 h-4" />,
        title: 'Mengembalikan Barang',
        description: 'Proses pengembalian barang yang sudah selesai dipinjam.',
        roles: ['siswa', 'guru', 'admin'],
        steps: [
            { text: 'Klik menu Peminjaman dan buka detail peminjaman yang ingin dikembalikan.' },
            { text: 'Pastikan status adalah Dipinjam.' },
            { text: 'Klik tombol Kembalikan Barang.' },
            { text: 'Upload foto selfie saat pengembalian.', note: 'Foto diperlukan sebagai bukti pengembalian.' },
            { text: 'Konfirmasi pengembalian.' },
            { text: 'Status berubah menjadi Pengembalian — tunggu verifikasi dari guru atau admin.' },
        ],
        tip: 'Kembalikan barang sebelum tanggal jatuh tempo untuk menghindari status Terlambat.',
    },
    {
        id: 'approve',
        icon: <CheckCircle2 className="w-4 h-4" />,
        title: 'Menyetujui / Menolak Peminjaman',
        description: 'Proses approval permohonan peminjaman dari siswa.',
        roles: ['guru', 'admin'],
        steps: [
            { text: 'Klik menu Peminjaman di sidebar.' },
            { text: 'Filter status Menunggu untuk melihat permohonan yang perlu diproses.' },
            { text: 'Klik peminjaman untuk melihat detail: peminjam, barang, tujuan, dan foto selfie.' },
            { text: 'Klik Setujui jika permohonan valid.' },
            { text: 'Atau klik Tolak dan isi alasan penolakan.', note: 'Alasan penolakan akan terlihat oleh siswa.' },
        ],
        link: { to: '/dashboard/borrowings', label: 'Lihat Peminjaman' },
    },
    {
        id: 'verify-return',
        icon: <ShieldCheck className="w-4 h-4" />,
        title: 'Verifikasi Pengembalian',
        description: 'Konfirmasi bahwa barang sudah dikembalikan dalam kondisi yang sesuai.',
        roles: ['guru', 'admin'],
        steps: [
            { text: 'Buka detail peminjaman dengan status Pengembalian.' },
            { text: 'Periksa foto selfie pengembalian dari siswa.' },
            { text: 'Untuk setiap barang, pilih kondisi saat dikembalikan: Baik, Rusak Ringan, atau Rusak Berat.' },
            { text: 'Tambahkan catatan jika ada kerusakan.' },
            { text: 'Klik Konfirmasi Kembali.' },
            { text: 'Stok barang akan otomatis diperbarui sesuai kondisi yang diinput.' },
        ],
        tip: 'Kondisi barang saat kembali sangat penting — akan mempengaruhi stok kondisi di sistem.',
    },
    {
        id: 'report',
        icon: <FileBarChart2 className="w-4 h-4" />,
        title: 'Melihat & Mengekspor Laporan',
        description: 'Rekap transaksi peminjaman, pengembalian, dan kondisi inventaris.',
        roles: ['guru', 'admin'],
        steps: [
            { text: 'Klik menu Laporan di sidebar.' },
            { text: 'Pilih jenis laporan: Peminjaman, Pengembalian, atau Inventaris.' },
            { text: 'Atur filter tanggal, status, atau user sesuai kebutuhan.' },
            { text: 'Klik Terapkan Filter untuk memperbarui data.' },
            { text: 'Klik Ekspor Excel atau Ekspor PDF untuk mengunduh laporan.' },
        ],
        link: { to: '/dashboard/reports/borrowings', label: 'Lihat Laporan' },
    },
    {
        id: 'approve-user',
        icon: <Users className="w-4 h-4" />,
        title: 'Menyetujui Pendaftaran Siswa',
        description: 'Review dan setujui akun siswa yang baru mendaftar.',
        roles: ['admin'],
        steps: [
            { text: 'Klik menu Pengguna di sidebar.' },
            { text: 'Pilih tab Menunggu Persetujuan.' },
            { text: 'Periksa data calon pengguna: nama, email, kelas, dan nomor absen.' },
            { text: 'Klik Setujui untuk mengaktifkan akun.' },
            { text: 'Atau klik Tolak dan isi alasan penolakan.' },
        ],
        link: { to: '/dashboard/users', label: 'Kelola Pengguna' },
    },
    {
        id: 'manage-items',
        icon: <Package className="w-4 h-4" />,
        title: 'Tambah & Kelola Barang',
        description: 'Tambah barang baru, edit data, dan atur kondisi stok.',
        roles: ['admin'],
        steps: [
            { text: 'Klik menu Barang di sidebar.' },
            { text: 'Klik + Tambah Barang untuk menambah barang baru.' },
            { text: 'Isi nama, kategori, deskripsi, merek, model, stok total, stok minimum, kondisi, dan lokasi.' },
            { text: 'Upload foto cover dan galeri (opsional).' },
            { text: 'Klik Simpan.' },
            { text: 'Untuk mengubah kondisi stok, klik Sesuaikan Kondisi pada baris barang.', note: 'Contoh: 2 unit dari Baik → Rusak Ringan karena kerusakan.' },
        ],
        link: { to: '/dashboard/items', label: 'Kelola Barang' },
        tip: 'Atur Stok Minimum dengan bijak — sistem akan menampilkan peringatan di Dashboard jika stok di bawah nilai ini.',
    },
    {
        id: 'manage-categories',
        icon: <Tag className="w-4 h-4" />,
        title: 'Kelola Kategori',
        description: 'Tambah dan atur kategori untuk pengelompokan barang.',
        roles: ['admin'],
        steps: [
            { text: 'Klik menu Kategori di sidebar.' },
            { text: 'Klik + Tambah Kategori.' },
            { text: 'Isi nama kategori.' },
            { text: 'Klik Simpan.' },
            { text: 'Untuk menghapus, klik ikon hapus — kategori yang masih memiliki barang tidak bisa dihapus.' },
        ],
        link: { to: '/dashboard/categories', label: 'Kelola Kategori' },
    },
    {
        id: 'manage-classes',
        icon: <GraduationCap className="w-4 h-4" />,
        title: 'Kelola Kelas & Tahun Ajaran',
        description: 'Atur data angkatan dan kelas untuk pendaftaran siswa.',
        roles: ['admin'],
        steps: [
            { text: 'Untuk tahun ajaran: klik menu Tahun Ajaran → Tambah → isi nama → aktifkan.' },
            { text: 'Maksimal 3 tahun ajaran aktif bersamaan.' },
            { text: 'Untuk kelas: klik menu Kelas → Tambah Kelas → pilih tahun ajaran → isi nama kelas.' },
            { text: 'Kelas harus dibuat sebelum siswa bisa mendaftar dengan angkatan tersebut.' },
        ],
        link: { to: '/dashboard/classes', label: 'Kelola Kelas' },
        tip: 'Buat kelas terlebih dahulu setiap awal tahun ajaran baru agar siswa baru bisa mendaftar.',
    },
];

// ─── Status reference ─────────────────────────────────────────────────────────

const STATUS_TABLE = [
    { status: 'Menunggu',     desc: 'Permohonan belum diproses guru/admin',     color: 'bg-amber-100/80  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400'  },
    { status: 'Disetujui',    desc: 'Disetujui, barang bisa diambil',           color: 'bg-blue-100/80   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400'   },
    { status: 'Dipinjam',     desc: 'Barang sedang dipinjam',                   color: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { status: 'Pengembalian', desc: 'Proses pengembalian menunggu verifikasi',  color: 'bg-violet-100/80 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
    { status: 'Dikembalikan', desc: 'Peminjaman selesai',                       color: 'bg-green-100/80  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
    { status: 'Ditolak',      desc: 'Permohonan ditolak oleh guru/admin',       color: 'bg-red-100/80    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
    { status: 'Terlambat',    desc: 'Melewati tanggal pengembalian',            color: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { status: 'Dibatalkan',   desc: 'Dibatalkan oleh peminjam',                 color: 'bg-neutral-100   text-neutral-500 dark:bg-neutral-800  dark:text-neutral-400' },
];

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
    siswa: {
        label:  'Siswa',
        badge:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        iconBg: 'bg-indigo-500',
        intro:  'Sebagai siswa, kamu dapat mengajukan peminjaman barang inventaris dan memantau statusnya.',
    },
    guru: {
        label:  'Guru',
        badge:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        iconBg: 'bg-emerald-500',
        intro:  'Sebagai guru, kamu dapat menyetujui peminjaman, memverifikasi pengembalian, dan melihat laporan.',
    },
    admin: {
        label:  'Admin',
        badge:  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        iconBg: 'bg-violet-500',
        intro:  'Sebagai admin, kamu memiliki akses penuh: manajemen pengguna, inventaris, master data, dan laporan.',
    },
} as const;

// ─── AccordionItem ────────────────────────────────────────────────────────────

function AccordionItem({ section, index }: { section: GuideSection; index: number }) {
    const [open, setOpen]       = useState(false);
    const [visible, setVisible] = useState(false);  // controls render after close anim
    const bodyRef               = useRef<HTMLDivElement>(null);

    function toggle() {
        if (!open) {
            setVisible(true);
            // small rAF so the element is in DOM before we remove max-h-0
            requestAnimationFrame(() => setOpen(true));
        } else {
            setOpen(false);
            // wait for transition to finish (300ms) then unmount
            setTimeout(() => setVisible(false), 300);
        }
    }

    return (
        <div
            className={[
                'glass-card overflow-hidden transition-all duration-300 ease-ios animate-fade-up',
                open ? 'ring-2 ring-primary/20 dark:ring-primary/15' : '',
            ].filter(Boolean).join(' ')}
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Header button */}
            <button
                type="button"
                onClick={toggle}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-accent/30 transition-colors duration-150 group"
                aria-expanded={open}
            >
                {/* Icon badge */}
                <div className={[
                    'flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 ease-spring',
                    open
                        ? 'bg-primary text-primary-foreground shadow-glow-blue-sm scale-105'
                        : 'bg-accent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                ].join(' ')}>
                    {section.icon}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className={['text-sm font-semibold transition-colors duration-150', open ? 'text-primary' : 'text-foreground'].join(' ')}>
                        {section.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {section.description}
                    </p>
                </div>

                {/* Chevron */}
                <ChevronDown className={[
                    'w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-ios',
                    open ? 'rotate-180 text-primary' : 'text-muted-foreground/60',
                ].join(' ')} />
            </button>

            {/* Body — CSS height transition for smooth open & close */}
            <div
                ref={bodyRef}
                className="transition-all duration-300 ease-ios overflow-hidden"
                style={{ maxHeight: open ? (bodyRef.current?.scrollHeight ?? 2000) + 'px' : '0px', opacity: open ? 1 : 0 }}
            >
                {visible && (
                    <div className="px-5 pb-5 border-t border-border/40">

                        {/* Steps */}
                        <ol className="space-y-3 mt-4">
                            {section.steps.map((step, i) => (
                                <li key={i} className="flex gap-3 items-start animate-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center mt-0.5 shadow-glow-blue-sm">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground/80 leading-snug">{step.text}</p>
                                        {step.note && (
                                            <div className="flex items-start gap-1.5 mt-1.5">
                                                <Info className="w-3 h-3 text-muted-foreground/60 flex-shrink-0 mt-px" />
                                                <p className="text-xs text-muted-foreground leading-snug">{step.note}</p>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>

                        {/* Tip box */}
                        {section.tip && (
                            <div className="mt-4 flex gap-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-700/30 rounded-2xl px-4 py-3 animate-fade-up">
                                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{section.tip}</p>
                            </div>
                        )}

                        {/* Link */}
                        {section.link && (
                            <div className="mt-4 animate-fade-up">
                                <Link
                                    to={section.link.to}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:gap-2 transition-all duration-150 px-3 py-1.5 rounded-xl hover:bg-primary/8 dark:hover:bg-primary/15 -ml-3"
                                >
                                    {section.link.label}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserGuidePage() {
    const user       = useAuthStore((s) => s.user);
    const role       = (user?.role ?? 'siswa') as 'siswa' | 'guru' | 'admin';
    const config     = ROLE_CONFIG[role];
    const mySections = GUIDE_SECTIONS.filter((s) => s.roles.includes(role));

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* ── Page Header ── */}
            <div className="glass-card px-6 py-5 flex items-start gap-4 animate-fade-up">
                {/* Icon */}
                <div className={['w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-glow-blue-sm', config.iconBg].join(' ')}>
                    <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h1 className="text-xl font-bold text-foreground tracking-tight">
                            Panduan Pengguna
                        </h1>
                        <span className={['badge-pill', config.badge].join(' ')}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{config.intro}</p>
                </div>
            </div>

            {/* ── Selfie info banner ── */}
            <div className="flex gap-3 bg-blue-50/80 dark:bg-blue-900/15 border border-blue-200/60 dark:border-blue-700/30 rounded-3xl px-5 py-4 animate-fade-up delay-100">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Foto Selfie Wajib</p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5 leading-relaxed">
                        Setiap peminjaman dan pengembalian membutuhkan foto selfie sebagai bukti identitas.
                        Pastikan foto jelas dan wajah terlihat.
                    </p>
                </div>
            </div>

            {/* ── Accordion sections ── */}
            <div className="animate-fade-up delay-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">
                    Panduan Langkah demi Langkah
                </p>
                <div className="space-y-2">
                    {mySections.map((section, i) => (
                        <AccordionItem key={section.id} section={section} index={i} />
                    ))}
                </div>
            </div>

            {/* ── Status Reference Table ── */}
            <div className="animate-fade-up delay-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-3 px-1">
                    Arti Status Peminjaman
                </p>
                <div className="glass-card overflow-hidden">
                    {STATUS_TABLE.map((row, i) => (
                        <div
                            key={row.status}
                            className={[
                                'grid grid-cols-[7rem_1fr] items-center gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-accent/30',
                                i < STATUS_TABLE.length - 1 ? 'border-b border-border/40' : '',
                            ].join(' ')}
                        >
                            <span className={['badge-pill justify-center text-center', row.color].join(' ')}>
                                {row.status}
                            </span>
                            <p className="text-sm text-muted-foreground leading-snug">{row.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer note ── */}
            <div className="flex gap-2 text-xs text-muted-foreground/50 pb-6 animate-fade-up delay-300">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                <p>Jika ada pertanyaan atau masalah, hubungi guru atau admin langsung. Panduan ini diperbarui sesuai perkembangan fitur sistem.</p>
            </div>
        </div>
    );
}
