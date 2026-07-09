import { useState } from 'react';
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
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    steps: Step[];
    link?: { to: string; label: string };
    tip?: string;
    roles: ('siswa' | 'guru' | 'admin')[];
}

// ─── Data panduan ─────────────────────────────────────────────────────────────

const GUIDE_SECTIONS: GuideSection[] = [
    // ── Semua role ──
    {
        id: 'register',
        icon: <UserPlus className="w-5 h-5" />,
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
        icon: <LogIn className="w-5 h-5" />,
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

    // ── Siswa ──
    {
        id: 'browse-items',
        icon: <Package className="w-5 h-5" />,
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
        icon: <ClipboardList className="w-5 h-5" />,
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
        icon: <Info className="w-5 h-5" />,
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
        icon: <RotateCcw className="w-5 h-5" />,
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

    // ── Guru & Admin ──
    {
        id: 'approve',
        icon: <CheckCircle2 className="w-5 h-5" />,
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
        icon: <ShieldCheck className="w-5 h-5" />,
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
        icon: <FileBarChart2 className="w-5 h-5" />,
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

    // ── Admin only ──
    {
        id: 'approve-user',
        icon: <Users className="w-5 h-5" />,
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
        icon: <Package className="w-5 h-5" />,
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
        icon: <Tag className="w-5 h-5" />,
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
        icon: <GraduationCap className="w-5 h-5" />,
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

// ─── Status badge tabel ───────────────────────────────────────────────────────

const STATUS_TABLE = [
    { status: 'Menunggu',     desc: 'Permohonan belum diproses guru/admin',     color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { status: 'Disetujui',    desc: 'Disetujui, barang bisa diambil',           color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { status: 'Dipinjam',     desc: 'Barang sedang dipinjam',                   color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { status: 'Pengembalian', desc: 'Proses pengembalian menunggu verifikasi',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    { status: 'Dikembalikan', desc: 'Peminjaman selesai',                       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { status: 'Ditolak',      desc: 'Permohonan ditolak oleh guru/admin',       color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    { status: 'Terlambat',    desc: 'Melewati tanggal pengembalian',            color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { status: 'Dibatalkan',   desc: 'Dibatalkan oleh peminjam',                 color: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
];

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
    siswa: {
        label: 'Siswa',
        color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        intro: 'Sebagai siswa, kamu dapat mengajukan peminjaman barang inventaris dan memantau statusnya.',
    },
    guru: {
        label: 'Guru',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        intro: 'Sebagai guru, kamu dapat menyetujui peminjaman, memverifikasi pengembalian, dan melihat laporan.',
    },
    admin: {
        label: 'Admin',
        color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        intro: 'Sebagai admin, kamu memiliki akses penuh: manajemen pengguna, inventaris, master data, dan laporan.',
    },
} as const;

// ─── AccordionItem ────────────────────────────────────────────────────────────

function AccordionItem({ section }: { section: GuideSection }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
            open
                ? 'border-indigo-300 dark:border-indigo-700 shadow-sm'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        }`}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                aria-expanded={open}
            >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    open
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                    {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {section.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                        {section.description}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Body */}
            {open && (
                <div className="px-5 pb-5 pt-1 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                    {/* Steps */}
                    <ol className="space-y-3 mt-4">
                        {section.steps.map((step, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{step.text}</p>
                                    {step.note && (
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1">
                                            <Info className="w-3 h-3 flex-shrink-0" />
                                            {step.note}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {/* Tip */}
                    {section.tip && (
                        <div className="mt-4 flex gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{section.tip}</p>
                        </div>
                    )}

                    {/* Link */}
                    {section.link && (
                        <div className="mt-4">
                            <Link
                                to={section.link.to}
                                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                            >
                                {section.link.label}
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserGuidePage() {
    const user = useAuthStore((s) => s.user);
    const role = (user?.role ?? 'siswa') as 'siswa' | 'guru' | 'admin';
    const config = ROLE_CONFIG[role];

    // Sections yang relevan untuk role ini
    const mySections = GUIDE_SECTIONS.filter((s) => s.roles.includes(role));

    // Siswa saja yang butuh lihat tabel status
    const showStatusTable = role === 'siswa' || role === 'guru' || role === 'admin';

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                    <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Panduan Pengguna
                        </h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {config.intro}
                    </p>
                </div>
            </div>

            {/* Quick info — foto selfie wajib */}
            <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
                <Camera className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Foto Selfie Wajib</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Setiap peminjaman dan pengembalian membutuhkan foto selfie sebagai bukti identitas. Pastikan foto jelas dan wajah terlihat.
                    </p>
                </div>
            </div>

            {/* Accordion sections */}
            <div>
                <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                    Panduan Langkah demi Langkah
                </h2>
                <div className="space-y-2">
                    {mySections.map((section) => (
                        <AccordionItem key={section.id} section={section} />
                    ))}
                </div>
            </div>

            {/* Status table */}
            {showStatusTable && (
                <div>
                    <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                        Arti Status Peminjaman
                    </h2>
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {STATUS_TABLE.map((row) => (
                                <div key={row.status} className="flex items-center gap-4 px-5 py-3">
                                    <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.color}`}>
                                        {row.status}
                                    </span>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{row.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer note */}
            <div className="flex gap-2 text-xs text-neutral-400 dark:text-neutral-600 pb-4">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <p>Jika ada pertanyaan atau masalah, hubungi guru atau admin langsung. Panduan ini diperbarui sesuai perkembangan fitur sistem.</p>
            </div>
        </div>
    );
}
