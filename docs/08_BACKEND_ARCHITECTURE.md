# 08 — BACKEND ARCHITECTURE
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Pendahuluan Arsitektur Backend

Backend aplikasi dibangun menggunakan framework **Laravel 13** berbasis **PHP 8.3**. Untuk memenuhi kebutuhan fungsionalitas, performa, dan kemudahan pemeliharaan jangka panjang, backend ini mengadopsi varian dari **Clean / Layered Architecture** dengan alur kendali yang terarah dan tanggung jawab yang tersegregasi secara ketat.

---

## 2. Struktur Folder & Organisasi Kode

Organisasi direktori utama backend dirancang untuk memisahkan tanggung jawab HTTP, logika bisnis, transaksi database, dan komponen infrastruktur pendukung.

```
backend/
├── app/
│   ├── Actions/            # Logika bisnis terkapsul (Single Action Class)
│   ├── DTOs/               # Data Transfer Objects (Struktur pertukaran data)
│   ├── Enums/              # Enumeration bahasa PHP (Role, Status, Kondisi)
│   ├── Exceptions/         # Penanganan error kustom
│   ├── Http/
│   │   ├── Controllers/    # Menerima request HTTP, mendelegasikan ke Action/Service
│   │   ├── Middleware/     # Filter HTTP (Autentikasi, Verifikasi Role)
│   │   ├── Requests/       # Validasi parameter masukan (Form Request)
│   │   └── Resources/      # Serialisasi output JSON API
│   ├── Models/             # Representasi objek tabel database & Relasi ORM
│   ├── Policies/           # Otorisasi hak akses tingkat record (Authorization)
│   ├── Repositories/       # Abstraksi query database (Data Access)
│   └── Services/           # Logika orkestrasi & integrasi pihak ketiga (Google API)
├── bootstrap/
│   └── app.php             # Konfigurasi routing, middleware global, & exception handler
├── config/                 # Pengaturan konfigurasi aplikasi Laravel
├── database/
│   ├── migrations/         # DDL skema database
│   └── seeders/            # Seeder data awal
├── routes/
│   ├── api.php             # Seluruh endpoint REST API dilindungi Sanctum
│   └── web.php             # Hanya rute fall-through / health check
└── storage/                # Penyimpanan file lokal (Selfie, Cover)
```

---

## 3. Pembagian Lapisan Kerja (Architecture Layers)

### 3.1 HTTP Layer (Controller & Request)
- **Controller** hanya bertindak sebagai pintu gerbang lalu lintas HTTP.
- **Aturan Kerja:**
  - Controller dilarang melakukan query database langsung.
  - Controller dilarang memanipulasi logika bisnis atau alur stok.
  - Controller bertugas menerima request, memanggil validator (Form Request), mengirimkan DTO ke layer Action/Service, dan mengembalikan output JSON terstruktur melalui **API Resources**.

### 3.2 Data Validation Layer (Form Request)
- Setiap masukan dari client **wajib divalidasi** sebelum masuk ke controller.
- Menggunakan class kustom turunan dari `Illuminate\Foundation\Http\FormRequest`.
- **Tanggung Jawab:** Memeriksa tipe data, kehadiran field, keunikan email, batasan ukuran file, dan kondisi prasyarat dasar (misal: rencana kembali > rencana ambil).

### 3.3 Data Transfer Object (DTO) Layer
- DTO berfungsi sebagai wadah data yang aman (*type-safe*) yang mengalir melintasi berbagai lapisan kode.
- **Tanggung Jawab:**
  - Mengubah request mentah (*array*) menjadi objek dengan tipe data terdefinisi.
  - Mencegah penggunaan kunci array yang typo di layer bisnis.
  - Memudahkan unit testing karena input method tidak lagi terikat pada request HTTP.

### 3.4 Action Layer (Single Responsibility Business Logic)
- Setiap alur bisnis utama yang kompleks (seperti pengajuan peminjaman baru, persetujuan peminjaman, konfirmasi pengembalian) dibungkus ke dalam kelas **Action** tunggal (misalnya: `CreateBorrowingAction`).
- **Aturan Kerja:**
  - Menggunakan method tunggal seperti `execute()` atau `__invoke()`.
  - Berfungsi mengorkestrasi transaksi database, perhitungan stok, pemanggilan log aktivitas, dan pengiriman notifikasi.

### 3.5 Service Layer
- Digunakan untuk membungkus fungsionalitas integrasi eksternal atau utilitas pembantu.
- *Contoh Penggunaan:* `GoogleAuthService` bertugas melakukan HTTP handshake untuk memvalidasi token Google OAuth, mengekstrak profil, dan tidak bercampur dengan alur penyimpanan user database.

### 3.6 Repository Layer (Data Access Abstraction)
- Bertindak sebagai jembatan antara model Eloquent ORM dengan lapisan logika bisnis.
- **Tanggung Jawab:**
  - Mengisolasi penulisan query SQL rumit, builder scopes, pencarian teks, dan pemrosesan paginasi.
  - Jika terjadi penggantian query database atau optimasi indeks, perubahan hanya dilakukan pada kelas Repository terkait tanpa menyentuh layer bisnis/action.

### 3.7 Model & Policy Layer
- **Model:** Representasi tabel di database, casting tipe data (misalnya: status peminjaman dikonversi ke Enum PHP), dan deklarasi relasi antar-tabel.
- **Policy:** Lapisan otorisasi berbasis class. Menentukan apakah siswa yang sedang login diizinkan membatalkan transaksi atau mengunggah selfie untuk ID peminjaman tertentu.

---

## 4. Penanganan Infrastruktur & Integrasi

### 4.1 Dependency Injection (DI) & Service Container
- Seluruh kebutuhan dependency antar-lapisan diselesaikan secara otomatis oleh Laravel Service Container (*Implicit Dependency Injection*).
- Controller menginjeksikan Action, Action menginjeksikan Repository dan Service yang dibutuhkan di dalam constructor.

### 4.2 Middleware (HTTP Filtering)
- **Sanctum Auth Middleware:** Memeriksa token Bearer di header, memvalidasi masa berlaku, dan menetapkan sesi user aktif.
- **Role Middleware:** Kelas kustom yang memotong request untuk mencocokkan tipe pengguna (`siswa`, `guru`, `admin`) terhadap rute yang dituju.

### 4.3 Penanganan Error Global (Exception Handler)
- Sentralisasi penanganan kesalahan dikonfigurasi pada `bootstrap/app.php` menggunakan fitur `withExceptions`.
- Seluruh runtime error, kegagalan query database (`ModelNotFoundException`), kegagalan otorisasi (`AuthorizationException`), dan kegagalan validasi stok kustom akan dikonversi menjadi format JSON API yang seragam:
  `{ "success": false, "message": "Pesan Kesalahan", "errors": [...] }` dengan HTTP status code yang sesuai (403, 404, 409, 422).

### 4.4 File Storage (Penyimpanan Foto Bukti)
- Menggunakan sistem penyimpanan berbasis disk local Laravel.
- Direktori `storage/app/public` dihubungkan ke `public/storage` via symbolic link.
- **Keamanan:** File masukan diproses dengan pembersihan tipe MIME murni di level server, diubah namanya menjadi UUID, dan dilarang disimpan di folder publik tanpa otorisasi file stream jika membutuhkan tingkat privasi tinggi di masa depan.

### 4.5 Queue & Worker (Antrean Proses)
- Menggunakan database queue driver untuk menjamin skalabilitas server.
- Proses berat yang membutuhkan waktu respons lama (seperti pengiriman log aktivitas eksternal, pembersihan file sampah, atau notifikasi masa depan) didelegasikan ke kelas *Job* antrean yang diproses di latar belakang oleh Supervisor daemon.

### 4.6 Scheduler (Tugas Terjadwal)
- Pemanfaatan sistem scheduler internal Laravel (`app/Console/Kernel.php` atau rute scheduler di bootstrap).
- **Tugas Terjadwal:**
  - Memindai peminjaman yang melewati batas rencana tanggal pengembalian secara berkala setiap hari.
  - Menandai data transaksi terlambat.
  - Melakukan rotasi atau kompresi log aktivitas yang lama.

### 4.7 Logger & Audit Trail
- Logger aplikasi menggunakan daily log driver Laravel untuk melacak error runtime aplikasi.
- Untuk log aktivitas bisnis (audit trail tindakan pengguna), sistem merekam record ke tabel `activity_logs` melalui helper service khusus. Log bisnis ini menyimpan data perubahan secara detail (*before/after*) dalam format JSON.

---

## 5. Aturan & Best Practice Arsitektur Backend

1. **Thin Controllers, Rich Actions/Services**
   Controller dilarang keras memiliki lebih dari 15 baris kode. Tugas controller hanya mengurai request ke DTO, mengeksekusi Action, dan membalas dalam format Resource.
   
2. **Database Transaction for Multi-write**
   Setiap operasi tulis database yang menyangkut lebih dari satu tabel (misalnya menyetujui peminjaman: update status borrowing + kurangi stok item + catat log audit) **wajib** dibungkus dalam blok `DB::transaction()` untuk menjamin integritas data (atomisitas).

3. **No Database Modification via Model Directly**
   Logika pengurangan stok, verifikasi ketersediaan stok, dan manipulasi data transaksional sensitif tidak boleh ditulis ad-hoc di file controller. Harus melalui metode terpusat di layer bisnis (`Action` / `Service`).

4. **Strict Enumeration**
   Semua status transaksi peminjaman, role pengguna, dan kondisi barang harus menggunakan fitur **PHP Enums** untuk mencegah *magic strings* di dalam database maupun kode program.

5. **Type Safety**
   Wajib menggunakan parameter typing dan return type declaration di seluruh fungsi dan metode PHP.
