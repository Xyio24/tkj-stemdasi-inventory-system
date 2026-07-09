# 02 — REQUIREMENTS
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## A. FUNCTIONAL REQUIREMENTS

Functional requirements mendeskripsikan **apa yang harus bisa dilakukan oleh sistem**.

### FR-01 — Autentikasi & Manajemen Sesi

| ID | Requirement |
|---|---|
| FR-01.1 | Sistem harus mengizinkan pengguna login menggunakan akun Google (Google OAuth 2.0) |
| FR-01.2 | Sistem harus memverifikasi ID token Google ke server Google API sebelum membuat sesi |
| FR-01.3 | Sistem harus membuat akun baru secara otomatis jika email Google belum terdaftar, dengan role default `siswa` |
| FR-01.4 | Sistem harus mengembalikan Sanctum Bearer Token setelah login berhasil |
| FR-01.5 | Sistem harus menghapus token saat pengguna logout |
| FR-01.6 | Sistem harus menolak login pengguna dengan `is_active = false` dan menampilkan pesan yang sesuai |
| FR-01.7 | Sistem harus melindungi semua endpoint API dengan autentikasi kecuali endpoint login |
| FR-01.8 | Sistem harus mengembalikan HTTP 401 untuk token yang tidak valid atau sudah kedaluwarsa |

---

### FR-02 — Manajemen Barang

| ID | Requirement |
|---|---|
| FR-02.1 | Sistem harus menampilkan daftar semua barang inventaris dengan paginasi |
| FR-02.2 | Sistem harus mengizinkan pencarian barang berdasarkan nama, brand, dan model |
| FR-02.3 | Sistem harus mengizinkan filter barang berdasarkan kategori, kondisi, dan ketersediaan stok |
| FR-02.4 | Sistem harus menampilkan detail barang: nama, brand, model, deskripsi, stok, kondisi, lokasi, foto |
| FR-02.5 | Sistem harus mengizinkan guru/admin menambah barang baru dengan foto utama |
| FR-02.6 | Sistem harus mengizinkan guru/admin mengedit data barang |
| FR-02.7 | Sistem harus mengizinkan admin menghapus barang yang tidak memiliki peminjaman aktif |
| FR-02.8 | Sistem harus mengizinkan guru/admin mengunggah beberapa foto untuk setiap barang (galeri) |
| FR-02.9 | Sistem harus mengizinkan guru/admin menghapus foto dari galeri barang |
| FR-02.10 | Sistem harus menolak upload foto dengan ukuran lebih dari 5MB |
| FR-02.11 | Sistem harus menolak upload file selain JPG, JPEG, PNG, dan WebP |
| FR-02.12 | Sistem harus secara otomatis membuat slug unik dari nama barang |

---

### FR-03 — Manajemen Kategori

| ID | Requirement |
|---|---|
| FR-03.1 | Sistem harus mengizinkan guru/admin menambah kategori baru |
| FR-03.2 | Sistem harus mengizinkan guru/admin mengedit nama dan deskripsi kategori |
| FR-03.3 | Sistem harus mengizinkan admin menghapus kategori yang tidak memiliki barang |
| FR-03.4 | Sistem harus secara otomatis membuat slug unik dari nama kategori |
| FR-03.5 | Sistem harus menampilkan jumlah barang di setiap kategori |

---

### FR-04 — Pengajuan Peminjaman

| ID | Requirement |
|---|---|
| FR-04.1 | Sistem harus mengizinkan siswa mengajukan peminjaman dengan satu atau lebih barang dalam satu transaksi |
| FR-04.2 | Sistem harus memvalidasi ketersediaan stok sebelum pengajuan diterima |
| FR-04.3 | Sistem harus menolak pengajuan jika stok barang tidak mencukupi |
| FR-04.4 | Sistem harus mewajibkan siswa mengisi tujuan peminjaman |
| FR-04.5 | Sistem harus mewajibkan tanggal rencana pengambilan dan rencana pengembalian |
| FR-04.6 | Sistem harus menolak tanggal pengambilan yang sudah lewat (past date) |
| FR-04.7 | Sistem harus menolak tanggal pengembalian yang lebih awal dari tanggal pengambilan |
| FR-04.8 | Sistem harus membuat kode unik untuk setiap transaksi dengan format `BRW-YYYYMMDD-XXXX` |
| FR-04.9 | Sistem harus menetapkan status awal peminjaman sebagai `pending` |
| FR-04.10 | Sistem harus mengizinkan siswa membatalkan peminjaman yang masih berstatus `pending` |

---

### FR-05 — Upload Foto Selfie

| ID | Requirement |
|---|---|
| FR-05.1 | Sistem harus mengizinkan siswa mengunggah foto selfie setelah peminjaman berstatus `approved` |
| FR-05.2 | Sistem harus mengizinkan siswa mengunggah foto selfie saat mengembalikan barang |
| FR-05.3 | Sistem harus secara otomatis mengubah status peminjaman dari `approved` ke `returning` setelah foto pengembalian berhasil diunggah |
| FR-05.4 | Sistem harus menyimpan semua foto secara permanen dan tidak mengizinkan penghapusan |
| FR-05.5 | Sistem harus menyimpan metadata foto: ukuran, tipe MIME, nama file asli |
| FR-05.6 | Sistem harus menyimpan foto dengan nama file UUID (bukan nama asli) untuk keamanan |

---

### FR-06 — Workflow Approval

| ID | Requirement |
|---|---|
| FR-06.1 | Sistem harus mengizinkan guru/admin melihat semua peminjaman berstatus `pending` |
| FR-06.2 | Sistem harus mengizinkan guru/admin menyetujui peminjaman dengan catatan opsional |
| FR-06.3 | Sistem harus secara otomatis mengurangi stok barang ketika peminjaman disetujui |
| FR-06.4 | Sistem harus memvalidasi ulang ketersediaan stok pada saat approve |
| FR-06.5 | Sistem harus mengizinkan guru/admin menolak peminjaman dengan alasan yang wajib diisi |
| FR-06.6 | Sistem harus mencatat siapa yang menyetujui/menolak beserta timestamp-nya |
| FR-06.7 | Sistem harus mengizinkan guru/admin melihat semua peminjaman berstatus `returning` |
| FR-06.8 | Sistem harus mengizinkan guru/admin mengkonfirmasi pengembalian barang |
| FR-06.9 | Sistem harus mengizinkan guru/admin mencatat kondisi barang saat dikembalikan per item |
| FR-06.10 | Sistem harus secara otomatis menambah stok barang ketika pengembalian dikonfirmasi |

---

### FR-07 — Dashboard & Pelaporan

| ID | Requirement |
|---|---|
| FR-07.1 | Sistem harus menampilkan dashboard bagi guru/admin dengan statistik ringkasan |
| FR-07.2 | Dashboard harus menampilkan total barang, total kategori, total pengguna aktif |
| FR-07.3 | Dashboard harus menampilkan jumlah peminjaman aktif, pending, dan returning |
| FR-07.4 | Dashboard harus menampilkan jumlah barang dengan stok di bawah minimum |
| FR-07.5 | Dashboard harus menampilkan daftar 10 peminjaman terbaru |
| FR-07.6 | Dashboard harus menampilkan 10 log aktivitas terbaru |
| FR-07.7 | Sistem harus menampilkan riwayat semua transaksi dengan filter dan pencarian |

---

### FR-08 — Log Aktivitas

| ID | Requirement |
|---|---|
| FR-08.1 | Sistem harus mencatat log untuk setiap aksi create, update, delete, approve, dan reject |
| FR-08.2 | Setiap log harus menyimpan: nama aksi, deskripsi, user yang melakukan, timestamp, IP address |
| FR-08.3 | Setiap log harus menyimpan state data sebelum dan sesudah perubahan dalam format JSON |
| FR-08.4 | Sistem harus mengizinkan guru/admin melihat log aktivitas dengan filter |
| FR-08.5 | Log aktivitas tidak boleh dapat dihapus oleh siapapun |

---

### FR-09 — Manajemen Pengguna

| ID | Requirement |
|---|---|
| FR-09.1 | Sistem harus mengizinkan admin membuat akun pengguna baru secara manual |
| FR-09.2 | Sistem harus mengizinkan admin mengedit data pengguna (nama, NIS/NIP, nomor HP, role) |
| FR-09.3 | Sistem harus mengizinkan admin mengubah role pengguna |
| FR-09.4 | Sistem harus mengizinkan admin menonaktifkan akun pengguna tanpa menghapus data |
| FR-09.5 | Sistem harus menampilkan daftar pengguna dengan filter berdasarkan role dan status aktif |

---

## B. NON-FUNCTIONAL REQUIREMENTS

### NFR-01 — Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-01.1 | Waktu respons API untuk list dan detail | < 500ms pada kondisi normal |
| NFR-01.2 | Waktu respons API untuk operasi write (create/update/delete) | < 1 detik |
| NFR-01.3 | Waktu upload foto selfie (5MB, koneksi 10Mbps) | < 5 detik |
| NFR-01.4 | Waktu load halaman awal frontend (First Contentful Paint) | < 2 detik |
| NFR-01.5 | Waktu build frontend untuk production | < 60 detik |
| NFR-01.6 | Throughput API minimal | 100 concurrent users |
| NFR-01.7 | Database query untuk list dengan paginasi | < 100ms |
| NFR-01.8 | Database query untuk statistik dashboard | < 300ms |

**Strategi pencapaian performance:**
- Query N+1 dihindari dengan Eloquent `with()` (eager loading)
- Paginasi wajib untuk semua endpoint list
- Index database pada kolom yang sering di-query
- Config/route caching di production (`php artisan config:cache`)
- Static asset Vite di-hash untuk browser caching efektif

---

### NFR-02 — Scalability

| ID | Requirement |
|---|---|
| NFR-02.1 | Arsitektur stateless — server tidak menyimpan state sesi; semua autentikasi via token |
| NFR-02.2 | Database connection pooling harus dikonfigurasi untuk menghindari exhaustion |
| NFR-02.3 | File upload disimpan terpisah dari aplikasi (storage) sehingga bisa dipindah ke object storage |
| NFR-02.4 | Queue jobs menggunakan database driver, siap diupgrade ke Redis |
| NFR-02.5 | Sistem harus mampu menampung hingga 500 pengguna terdaftar |
| NFR-02.6 | Sistem harus mampu menyimpan minimal 5 tahun riwayat transaksi |
| NFR-02.7 | Sistem harus bisa ditingkatkan (scale up) server tanpa perubahan kode |

---

### NFR-03 — Security

| ID | Requirement |
|---|---|
| NFR-03.1 | Semua komunikasi antara client dan server harus menggunakan HTTPS (TLS 1.2+) |
| NFR-03.2 | Token autentikasi harus menggunakan Sanctum dengan penyimpanan di database |
| NFR-03.3 | Verifikasi Google ID token harus dilakukan di sisi server, bukan client |
| NFR-03.4 | Semua input user harus divalidasi di sisi server (Laravel Form Request) |
| NFR-03.5 | SQL injection harus dicegah menggunakan Eloquent ORM dan query binding |
| NFR-03.6 | Cross-Site Scripting (XSS) harus dicegah melalui output escaping |
| NFR-03.7 | File upload harus divalidasi tipe MIME di sisi server, bukan hanya ekstensi |
| NFR-03.8 | File yang diupload harus disimpan di luar direktori `public` kecuali via symbolic link |
| NFR-03.9 | Nama file upload harus diubah menjadi UUID untuk mencegah path traversal |
| NFR-03.10 | CORS harus dikonfigurasi dengan whitelist domain yang spesifik |
| NFR-03.11 | Role-based access control (RBAC) harus diterapkan di level middleware API |
| NFR-03.12 | Siswa tidak boleh mengakses data peminjaman milik siswa lain |
| NFR-03.13 | Informasi sensitif (password, token) tidak boleh ada di response API |
| NFR-03.14 | APP_KEY Laravel harus diset dan dijaga kerahasiaannya |
| NFR-03.15 | File `.env` tidak boleh dapat diakses melalui web server |
| NFR-03.16 | Rate limiting harus diterapkan pada endpoint login untuk mencegah brute force |
| NFR-03.17 | Security header HTTP harus dikonfigurasi di Nginx (X-Frame-Options, X-Content-Type-Options) |

---

### NFR-04 — Maintainability

| ID | Requirement |
|---|---|
| NFR-04.1 | Kode backend harus mengikuti PSR-12 dan diformat dengan Laravel Pint |
| NFR-04.2 | Kode frontend harus menggunakan TypeScript strict mode |
| NFR-04.3 | Arsitektur backend harus menggunakan pola berlapis: Controller → Service → Repository → Model |
| NFR-04.4 | Setiap fungsi/method harus memiliki tanggung jawab tunggal (Single Responsibility Principle) |
| NFR-04.5 | Business logic harus berada di layer Service, bukan di Controller |
| NFR-04.6 | Semua API response harus menggunakan format yang konsisten (ApiResource) |
| NFR-04.7 | Migrasi database harus reversible (ada method `down()`) |
| NFR-04.8 | Variabel environment harus menggunakan `.env` (tidak ada hardcode di kode) |
| NFR-04.9 | Pesan error harus deskriptif dan berbahasa Indonesia |
| NFR-04.10 | Semua endpoint harus memiliki validasi Form Request yang eksplisit |
| NFR-04.11 | Log error level `error` dan `critical` harus tersimpan di file log harian |
| NFR-04.12 | Dokumentasi dalam folder `docs/` harus diperbarui setiap ada perubahan signifikan |

---

### NFR-05 — Usability

| ID | Requirement |
|---|---|
| NFR-05.1 | Antarmuka harus responsif dan dapat digunakan di layar mobile (≥ 375px) |
| NFR-05.2 | Pesan error validasi form harus ditampilkan secara inline di bawah field terkait |
| NFR-05.3 | Setiap aksi sukses harus memberikan feedback visual (toast notification) |
| NFR-05.4 | Setiap halaman list harus menampilkan skeleton loading saat data sedang dimuat |
| NFR-05.5 | Tombol submit harus disabled selama proses pengiriman untuk mencegah double submit |
| NFR-05.6 | Seluruh teks antarmuka menggunakan Bahasa Indonesia |
| NFR-05.7 | Status peminjaman harus ditampilkan dengan warna badge yang berbeda |

---

### NFR-06 — Reliability & Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-06.1 | Uptime aplikasi | ≥ 99% (kecuali maintenance terjadwal) |
| NFR-06.2 | Queue worker harus otomatis restart jika crash (via Supervisor) | Ya |
| NFR-06.3 | Backup database harus dilakukan setiap hari | Harian pukul 02:00 |
| NFR-06.4 | Backup harus disimpan minimal 30 hari | 30 hari |
| NFR-06.5 | Operasi stok (kurangi/tambah) harus menggunakan database transaction | Ya |
| NFR-06.6 | Tidak boleh ada data corruption akibat concurrent request pada stok | Ya (DB lock) |

---

### NFR-07 — Compatibility

| ID | Requirement |
|---|---|
| NFR-07.1 | Frontend harus kompatibel dengan Chrome 110+, Firefox 110+, Edge 110+ |
| NFR-07.2 | Backend harus berjalan di PHP 8.3+ |
| NFR-07.3 | Database harus kompatibel dengan MySQL 8.0+ atau MariaDB 10.11+ |
| NFR-07.4 | API harus mengembalikan JSON dengan `Content-Type: application/json` |
| NFR-07.5 | Sistem harus berjalan di Ubuntu 24.04 LTS |

---

### NFR-08 — Data Retention

| ID | Requirement |
|---|---|
| NFR-08.1 | Data peminjaman (riwayat) harus disimpan selamanya dan tidak boleh dihapus |
| NFR-08.2 | Foto selfie (bukti) harus disimpan selamanya dan tidak boleh dihapus |
| NFR-08.3 | Log aktivitas harus disimpan selamanya dan tidak boleh dihapus |
| NFR-08.4 | User yang dinonaktifkan tidak dihapus, data historis tetap terhubung |
| NFR-08.5 | Barang yang dihapus harus menggunakan soft delete |

---

## C. RINGKASAN REQUIREMENTS MATRIX

| Kategori | Total | Wajib | Penting | Diinginkan |
|---|---|---|---|---|
| Autentikasi | 8 | 8 | 0 | 0 |
| Manajemen Barang | 12 | 10 | 2 | 0 |
| Manajemen Kategori | 5 | 4 | 1 | 0 |
| Peminjaman | 10 | 10 | 0 | 0 |
| Upload Selfie | 6 | 6 | 0 | 0 |
| Approval Workflow | 10 | 10 | 0 | 0 |
| Dashboard | 7 | 5 | 2 | 0 |
| Log Aktivitas | 5 | 5 | 0 | 0 |
| Manajemen User | 5 | 4 | 1 | 0 |
| **Performance** | 8 | 6 | 2 | 0 |
| **Scalability** | 7 | 4 | 3 | 0 |
| **Security** | 17 | 17 | 0 | 0 |
| **Maintainability** | 12 | 8 | 4 | 0 |
| **Usability** | 7 | 5 | 2 | 0 |
| **Reliability** | 6 | 6 | 0 | 0 |
| **Compatibility** | 5 | 5 | 0 | 0 |
| **Data Retention** | 5 | 5 | 0 | 0 |
| **TOTAL** | **135** | **118** | **17** | **0** |
