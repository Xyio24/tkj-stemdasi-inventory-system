# 01 — PROJECT OVERVIEW
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Tujuan Aplikasi

Sistem Inventaris dan Peminjaman Barang Jurusan Teknik Komputer dan Jaringan (TKJ) adalah aplikasi web yang dirancang untuk **mendigitalisasi dan mengotomasi seluruh proses pengelolaan aset dan peminjaman barang** di lingkungan jurusan TKJ.

### Tujuan Utama

| # | Tujuan | Keterangan |
|---|---|---|
| 1 | **Transparansi** | Setiap barang, transaksi, dan persetujuan tercatat secara digital dan dapat ditelusuri |
| 2 | **Akuntabilitas** | Bukti foto selfie memastikan tanggung jawab fisik peminjaman dan pengembalian |
| 3 | **Efisiensi** | Menghilangkan proses manual berbasis kertas yang lambat dan rawan kesalahan |
| 4 | **Kontrol Stok** | Stok barang dikelola secara real-time dan otomatis berubah saat approval |
| 5 | **Audit Trail** | Seluruh aktivitas sistem terekam dalam log yang tidak dapat dihapus |

### Masalah yang Diselesaikan

Sebelum sistem ini ada, pengelolaan barang di Jurusan TKJ menghadapi masalah:

- ❌ Pencatatan manual di buku/kertas yang mudah rusak dan hilang
- ❌ Tidak ada visibilitas real-time ketersediaan barang
- ❌ Tidak ada bukti fisik/foto saat barang dipinjam atau dikembalikan
- ❌ Proses approval lambat dan tidak terstruktur
- ❌ Tidak ada riwayat lengkap siapa meminjam apa dan kapan
- ❌ Stok barang sering tidak sinkron antara catatan dan kondisi nyata

---

## 2. Ruang Lingkup

### Dalam Ruang Lingkup (In Scope)

| Area | Cakupan |
|---|---|
| **Autentikasi** | Login via Google OAuth, manajemen sesi dengan Sanctum |
| **Manajemen Barang** | CRUD barang, foto barang, manajemen stok, kategorisasi |
| **Manajemen Kategori** | CRUD kategori untuk pengelompokan barang |
| **Peminjaman** | Pengajuan multi-item, validasi stok, kode unik transaksi |
| **Approval** | Workflow persetujuan dua tahap (peminjaman + pengembalian) |
| **Foto Bukti** | Upload selfie saat meminjam dan mengembalikan barang |
| **Pengembalian** | Proses konfirmasi pengembalian oleh guru dengan pencatatan kondisi |
| **Dashboard** | Statistik ringkasan, grafik, dan notifikasi pending |
| **Riwayat** | Seluruh histori transaksi yang dapat difilter |
| **Log Aktivitas** | Audit trail semua aksi dalam sistem |
| **Manajemen User** | CRUD user, assignment role, nonaktifkan akun |

### Di Luar Ruang Lingkup (Out of Scope)

- ❌ Sistem notifikasi email/SMS/push notification (dapat ditambahkan di fase berikutnya)
- ❌ Integrasi dengan sistem akademik sekolah
- ❌ Modul keuangan / denda keterlambatan
- ❌ Aplikasi mobile native (iOS/Android)
- ❌ Barcode / QR Code scanning barang
- ❌ Multi-jurusan / multi-sekolah
- ❌ Laporan PDF/Excel export (fase berikutnya)

---

## 3. Target Pengguna

### 3.1 Siswa

**Profil:**
- Siswa aktif Jurusan TKJ (kelas X, XI, XII)
- Usia 15–18 tahun
- Familiar dengan smartphone dan aplikasi berbasis web
- Memiliki akun Google dari sekolah

**Kebutuhan:**
- Melihat barang apa saja yang tersedia untuk dipinjam
- Mengajukan peminjaman dengan mudah
- Mengetahui status peminjaman mereka secara real-time
- Melakukan proses pengembalian dengan upload foto bukti

**Tingkat kemampuan teknis:** Menengah

---

### 3.2 Guru / Tenaga Pendidik

**Profil:**
- Guru tetap atau honorer di Jurusan TKJ
- Bertanggung jawab atas keamanan dan ketersediaan barang
- Memiliki akun Google dari sekolah

**Kebutuhan:**
- Melihat semua pengajuan peminjaman yang menunggu persetujuan
- Menyetujui atau menolak peminjaman dengan alasan
- Mengkonfirmasi pengembalian barang
- Mengelola data barang dan kategori
- Melihat laporan dan riwayat transaksi

**Tingkat kemampuan teknis:** Menengah

---

### 3.3 Admin

**Profil:**
- Staf TU atau koordinator jurusan yang ditunjuk
- Memiliki akses penuh ke seluruh sistem
- Bertanggung jawab atas integritas data

**Kebutuhan:**
- Semua kebutuhan guru
- Mengelola akun pengguna (tambah, edit, nonaktifkan)
- Mengatur role dan hak akses user
- Menghapus data yang tidak valid
- Melihat log aktivitas lengkap

**Tingkat kemampuan teknis:** Tinggi

---

## 4. Fitur Utama

### 4.1 Untuk Siswa

```
┌─────────────────────────────────────────────────────────┐
│                    FITUR SISWA                          │
├─────────────────────────────────────────────────────────┤
│  🔑 Login dengan Google                                 │
│  📦 Lihat daftar & detail barang                        │
│  🛒 Ajukan peminjaman multi-item                        │
│  📸 Upload selfie saat meminjam                         │
│  📊 Pantau status peminjaman                            │
│  🔄 Kembalikan barang + upload selfie                   │
│  ❌ Batalkan peminjaman (status pending)                 │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Untuk Guru & Admin

```
┌─────────────────────────────────────────────────────────┐
│                    FITUR GURU / ADMIN                   │
├─────────────────────────────────────────────────────────┤
│  📊 Dashboard dengan statistik real-time                │
│  ✅ Approve / Reject pengajuan peminjaman               │
│  ✅ Konfirmasi pengembalian barang                       │
│  📦 CRUD Barang + upload foto galeri                    │
│  🏷️  CRUD Kategori                                      │
│  📜 Riwayat transaksi lengkap                           │
│  🔍 Log aktivitas sistem                                │
├─────────────────────────────────────────────────────────┤
│                    FITUR ADMIN ONLY                     │
├─────────────────────────────────────────────────────────┤
│  👥 CRUD Pengguna                                       │
│  🔑 Kelola role (Siswa / Guru / Admin)                  │
│  🚫 Nonaktifkan akun pengguna                           │
│  🗑️  Hapus data (barang, kategori)                      │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Ringkasan Fitur Lengkap

| Fitur | Deskripsi | Prioritas |
|---|---|---|
| Google OAuth Login | Autentikasi aman tanpa password terpisah | P0 — Wajib |
| Daftar & Detail Barang | Browse katalog dengan filter dan pencarian | P0 — Wajib |
| Pengajuan Peminjaman | Form multi-item dengan validasi stok real-time | P0 — Wajib |
| Upload Selfie | Bukti foto saat pinjam dan kembali | P0 — Wajib |
| Workflow Approval | Guru approve/reject dengan alasan | P0 — Wajib |
| Konfirmasi Pengembalian | Guru konfirmasi + catat kondisi barang | P0 — Wajib |
| Manajemen Stok | Stok otomatis berkurang/bertambah saat approval | P0 — Wajib |
| Dashboard | Widget statistik dan data terbaru | P1 — Penting |
| Log Aktivitas | Audit trail semua perubahan | P1 — Penting |
| Manajemen User | CRUD user & role oleh admin | P1 — Penting |
| Riwayat Transaksi | Filter histori peminjaman | P1 — Penting |
| Manajemen Kategori | Pengelompokan barang | P1 — Penting |
| Galeri Foto Barang | Multi-foto per barang | P2 — Diinginkan |
| Export Laporan | PDF/Excel histori | P3 — Masa depan |
| Notifikasi Email | Notif email approval | P3 — Masa depan |

---

## 5. Teknologi

### 5.1 Backend

| Teknologi | Versi | Peran |
|---|---|---|
| **Laravel** | 13.x | Framework PHP utama, REST API |
| **PHP** | 8.3+ | Runtime bahasa pemrograman |
| **MySQL / MariaDB** | 10.11+ | Database relasional |
| **Laravel Sanctum** | 4.x | Token-based API authentication |
| **Google API Client** | 2.x | Verifikasi Google OAuth token |
| **Laravel Pint** | 1.x | Code formatter (PSR-12) |
| **PHPUnit** | 12.x | Unit & feature testing |

**Arsitektur Backend:**
```
Route → Middleware (Auth, Role) → Controller → Service → Repository → Model → Database
                                         ↓
                                   ActivityLog (setiap aksi)
```

### 5.2 Frontend

| Teknologi | Versi | Peran |
|---|---|---|
| **React** | 19.x | UI library |
| **TypeScript** | 5.8+ | Type safety |
| **Vite** | 7.x | Build tool & dev server |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **shadcn/ui** | 4.x | Komponen UI berbasis Radix |
| **React Router** | 7.x | Client-side routing |
| **Axios** | 1.x | HTTP client |
| **TanStack Query** | 5.x | Server state management & caching |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 4.x | Schema validation |
| **Sonner** | 2.x | Toast notifications |
| **Lucide React** | 1.x | Icon library |

**Arsitektur Frontend:**
```
App.tsx
  └── QueryClientProvider
        └── BrowserRouter
              ├── GuestLayout   → /login
              └── DashboardLayout → /dashboard, /inventory, /borrowing, ...
                    ├── Sidebar Navigation
                    ├── Header
                    └── <Outlet> (Page Content)
                          ├── Page Component
                          │     ├── useQuery / useMutation (TanStack Query)
                          │     │     └── api/*.ts (Axios)
                          │     └── Components (shadcn/ui)
                          └── ...
```

### 5.3 Deployment

| Teknologi | Versi | Peran |
|---|---|---|
| **Ubuntu Server** | 24.04 LTS | Sistem operasi server |
| **Nginx** | 1.26+ | Web server & reverse proxy |
| **PHP-FPM** | 8.3 | PHP process manager |
| **Supervisor** | 4.x | Process manager untuk queue worker |
| **Certbot** | Latest | SSL/TLS certificate |
| **Git** | 2.x | Version control & deployment |

### 5.4 Diagram Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy)                      │
│           SSL Termination · Rate Limiting                    │
├──────────────────┬───────────────────────────────────────────┤
│  inventortkj.    │  api.inventortkj.                         │
│  sch.id          │  sch.id                                   │
│                  │                                           │
│  ┌────────────┐  │  ┌─────────────────────────────────────┐  │
│  │  React SPA │  │  │   Laravel API (PHP-FPM)             │  │
│  │  (Static)  │  │  │                                     │  │
│  │  /dist     │  │  │   ┌───────────┐  ┌──────────────┐  │  │
│  └────────────┘  │  │   │ Sanctum   │  │   Storage    │  │  │
│                  │  │   │ Auth      │  │   (Uploads)  │  │  │
│                  │  │   └───────────┘  └──────────────┘  │  │
│                  │  └──────────────────────┬──────────────┘  │
│                  │                         │                  │
│                  │                         ▼                  │
│                  │             ┌───────────────────┐          │
│                  │             │   MariaDB         │          │
│                  │             │   inventory_tkj   │          │
│                  │             └───────────────────┘          │
│                  │                                            │
│                  │             ┌───────────────────┐          │
│                  │             │ Supervisor        │          │
│                  │             │ Queue Worker      │          │
│                  │             └───────────────────┘          │
└──────────────────┴────────────────────────────────────────────┘

          ┌─────────────────────────────┐
          │   Google OAuth 2.0 API      │
          │   (Token Verification)      │
          └─────────────────────────────┘
```

---

## 6. Constraint & Asumsi

### Constraint

| Constraint | Keterangan |
|---|---|
| Login hanya via Google | Tidak ada login username/password untuk siswa |
| Bahasa Indonesia | Seluruh UI dan pesan dalam Bahasa Indonesia |
| Satu sekolah | Sistem tidak dirancang multi-tenant |
| Internet wajib | Tidak ada mode offline |
| Browser modern | Chrome, Firefox, Edge terbaru |

### Asumsi

- Setiap pengguna memiliki akun Google (email sekolah)
- Guru/Admin dibuat manual oleh admin sistem
- Setiap peminjaman memerlukan persetujuan guru sebelum barang keluar
- Foto selfie wajib sebagai bukti fisik
- Stok barang hanya dimanipulasi melalui sistem (tidak ada entry manual di DB)

---

## 7. Glossary

| Istilah | Definisi |
|---|---|
| **Peminjaman** | Transaksi pinjam meminjam barang inventaris |
| **Borrowing** | Nama teknis untuk entitas peminjaman di sistem |
| **Approval** | Proses persetujuan oleh guru/admin |
| **Selfie** | Foto yang diambil peminjam bersama barang sebagai bukti |
| **Stok** | Jumlah barang yang tersedia untuk dipinjam saat ini |
| **Stok Total** | Jumlah fisik keseluruhan barang yang dimiliki jurusan |
| **Status Pending** | Peminjaman sudah diajukan, menunggu persetujuan guru |
| **Status Approved** | Peminjaman disetujui, barang sudah keluar |
| **Status Returning** | Siswa sudah upload foto return, menunggu konfirmasi guru |
| **Status Returned** | Pengembalian dikonfirmasi, stok sudah bertambah |
| **Activity Log** | Catatan audit trail semua perubahan data dalam sistem |
| **Role** | Peran pengguna: `siswa`, `guru`, `admin` |
| **NIS** | Nomor Induk Siswa |
| **NIP** | Nomor Induk Pegawai (untuk guru) |
