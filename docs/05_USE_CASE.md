# 05 — USE CASE
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Daftar Aktor (Actors)

| Aktor | Deskripsi |
|---|---|
| **Siswa** | Pengguna yang mengajukan peminjaman, mengunggah selfie bukti, dan melakukan proses pengembalian barang |
| **Guru** | Pengelola inventaris harian. Bertanggung jawab atas persetujuan (approval) peminjaman, pemeriksaan fisik pengembalian barang, dan CRUD barang/kategori |
| **Admin** | Pengelola sistem tingkat tinggi. Memiliki hak akses Guru, ditambah hak manajemen akun pengguna (CRUD user) dan penghapusan data secara permanen |

---

## 2. Diagram Use Case (Mermaid)

```mermaid
usecaseDiagram
    direction LR
    actor Siswa
    actor Guru
    actor Admin

    Siswa --> (UC-01 Login Google)
    Siswa --> (UC-02 Lihat Catalog Barang)
    Siswa --> (UC-03 Pengajuan Peminjaman)
    Siswa --> (UC-04 Upload Selfie Ambil Barang)
    Siswa --> (UC-05 Upload Selfie Pengembalian)
    Siswa --> (UC-06 Batalkan Pengajuan)

    Guru --> (UC-01 Login Google)
    Guru --> (UC-02 Lihat Catalog Barang)
    Guru --> (UC-07 Approve/Reject Peminjaman)
    Guru --> (UC-08 Konfirmasi Pengembalian)
    Guru --> (UC-09 CRUD Barang)
    Guru --> (UC-10 CRUD Kategori)
    Guru --> (UC-11 Lihat Dashboard & Log)

    Admin --> (UC-01 Login Google)
    Admin --> (UC-07 Approve/Reject Peminjaman)
    Admin --> (UC-08 Konfirmasi Pengembalian)
    Admin --> (UC-09 CRUD Barang)
    Admin --> (UC-10 CRUD Kategori)
    Admin --> (UC-12 CRUD User)
    Admin --> (UC-13 Toggle Aktif User)
```

---

## 3. Spesifikasi Use Case Detail

### UC-01: Login via Google
- **Deskripsi:** Pengguna masuk ke dalam sistem menggunakan akun Google OAuth.
- **Aktor:** Siswa, Guru, Admin
- **Pre-kondisi:** Pengguna memiliki akun Google sekolah yang aktif.
- **Post-kondisi:** Sesi Sanctum terbuat, token disimpan di client, diarahkan ke dashboard masing-masing role.
- **Alur Utama:**
  1. Pengguna membuka aplikasi dan memilih "Login dengan Google".
  2. Pengguna memasukkan kredensial Google pada pop-up resmi.
  3. Google mengembalikan ID token ke aplikasi.
  4. Aplikasi mengirimkan ID token tersebut ke server backend.
  5. Backend memverifikasi token dan mencocokkan email.
  6. Backend mengembalikan Sanctum token beserta data user.
- **Alur Alternatif:**
  - *Akun dinonaktifkan:* Jika email cocok namun `is_active = false`, backend menolak token dan memberikan pesan error "Akun Anda dinonaktifkan".

---

### UC-02: Lihat Katalog Barang
- **Deskripsi:** Pengguna melihat daftar barang inventaris, menyaring berdasarkan kategori atau kondisi, serta mencari nama barang.
- **Aktor:** Siswa, Guru, Admin
- **Pre-kondisi:** Pengguna sudah login.
- **Alur Utama:**
  1. Pengguna membuka menu "Katalog Barang".
  2. Sistem menampilkan daftar barang (nama, kategori, stok, foto).
  3. Pengguna dapat mengetikkan nama barang di pencarian.
  4. Pengguna dapat memilih kategori pada filter.
  5. Sistem menyegarkan daftar barang sesuai pencarian/filter.

---

### UC-03: Pengajuan Peminjaman (Siswa)
- **Deskripsi:** Siswa mengajukan permohonan pinjam satu atau beberapa barang inventaris.
- **Aktor:** Siswa
- **Pre-kondisi:** Siswa sudah login dan memiliki status aktif.
- **Post-kondisi:** Transaksi peminjaman terbuat dengan status `pending`, stok barang belum berkurang.
- **Alur Utama:**
  1. Siswa memilih satu atau lebih barang dari katalog yang memiliki stok > 0.
  2. Siswa membuka form pengajuan peminjaman.
  3. Siswa mengisi form: tujuan peminjaman, tanggal ambil, dan rencana tanggal kembali.
  4. Siswa mengklik tombol "Kirim Pengajuan".
  5. Sistem memvalidasi input dan kecukupan stok secara real-time.
  6. Sistem menyimpan data pengajuan peminjaman dan mengubah status menjadi `pending`.
- **Alur Alternatif:**
  - *Stok tidak cukup:* Jika saat divalidasi stok barang habis/kurang, sistem membatalkan proses dan memunculkan toast warning "Stok tidak mencukupi".

---

### UC-04: Upload Selfie Ambil Barang (Siswa)
- **Deskripsi:** Siswa mengunggah foto selfie bersama barang sebagai bukti fisik pengambilan barang dari ruangan TKJ.
- **Aktor:** Siswa
- **Pre-kondisi:** Transaksi peminjaman berstatus `approved`.
- **Post-kondisi:** Foto tersimpan di server, status transaksi tetap `approved`.
- **Alur Utama:**
  1. Siswa membuka daftar peminjaman miliknya.
  2. Siswa memilih transaksi yang telah disetujui (`approved`).
  3. Siswa mengklik "Upload Bukti Ambil" dan memilih file gambar selfie.
  4. Siswa mengklik "Simpan Foto".
  5. Sistem memvalidasi format (JPG/PNG/WebP, <5MB) dan menyimpan file ke storage.
  6. Sistem mencatat log aktivitas upload foto pengambilan.

---

### UC-05: Upload Selfie Pengembalian (Siswa)
- **Deskripsi:** Siswa mengunggah foto selfie saat mengembalikan barang ke ruangan TKJ.
- **Aktor:** Siswa
- **Pre-kondisi:** Transaksi peminjaman berstatus `approved` (sudah diambil).
- **Post-kondisi:** Status transaksi otomatis berubah menjadi `returning` (menunggu konfirmasi pengembalian guru).
- **Alur Utama:**
  1. Siswa membuka daftar peminjaman miliknya dan memilih transaksi yang sedang aktif (`approved`).
  2. Siswa mengklik "Kembalikan Barang".
  3. Siswa mengunggah foto selfie saat mengembalikan barang ke lemari/meja praktikum.
  4. Sistem menyimpan foto tersebut ke storage.
  5. Sistem memperbarui status transaksi menjadi `returning`.
  6. Sistem mencatat log aktivitas pengajuan pengembalian.

---

### UC-06: Batalkan Pengajuan (Siswa)
- **Deskripsi:** Siswa membatalkan pengajuan peminjaman yang telah dikirim.
- **Aktor:** Siswa
- **Pre-kondisi:** Transaksi peminjaman masih berstatus `pending`.
- **Post-kondisi:** Status transaksi berubah menjadi `cancelled`.
- **Alur Utama:**
  1. Siswa membuka detail peminjaman miliknya yang berstatus `pending`.
  2. Siswa mengklik tombol "Batalkan Peminjaman".
  3. Sistem mengubah status peminjaman menjadi `cancelled`.
  4. Sistem mencatat log aktivitas pembatalan peminjaman.

---

### UC-07: Approve/Reject Peminjaman (Guru/Admin)
- **Deskripsi:** Guru menyetujui atau menolak pengajuan peminjaman siswa.
- **Aktor:** Guru, Admin
- **Pre-kondisi:** Terdapat transaksi berstatus `pending`.
- **Post-kondisi:** Jika disetujui, status menjadi `approved` dan stok berkurang. Jika ditolak, status menjadi `rejected` dan stok tidak berubah.
- **Alur Utama (Approve):**
  1. Guru membuka daftar pengajuan masuk.
  2. Guru memilih salah satu pengajuan `pending`.
  3. Guru mengklik tombol "Setujui" dan mengisi catatan (opsional).
  4. Sistem memverifikasi kembali ketersediaan stok saat itu.
  5. Sistem mengubah status peminjaman menjadi `approved`.
  6. Sistem memotong jumlah stok barang terkait secara otomatis.
- **Alur Utama (Reject):**
  1. Guru memilih pengajuan `pending`.
  2. Guru mengklik tombol "Tolak".
  3. Guru wajib mengisi input alasan penolakan.
  4. Sistem mengubah status menjadi `rejected` dan menyimpan alasan penolakan tersebut.

---

### UC-08: Konfirmasi Pengembalian (Guru/Admin)
- **Deskripsi:** Guru mengonfirmasi bahwa barang telah dikembalikan secara fisik dan siswa telah mengunggah selfie pengembalian.
- **Aktor:** Guru, Admin
- **Pre-kondisi:** Transaksi peminjaman berstatus `returning`.
- **Post-kondisi:** Status menjadi `returned`, stok barang bertambah kembali.
- **Alur Utama:**
  1. Guru membuka menu pengembalian masuk dan memilih peminjaman berstatus `returning`.
  2. Guru memeriksa foto selfie pengembalian siswa dan mencocokkan dengan fisik barang.
  3. Guru memilih kondisi akhir barang per item (`baik`, `rusak_ringan`, atau `rusak_berat`).
  4. Guru mengklik "Konfirmasi Pengembalian".
  5. Sistem mengubah status transaksi menjadi `returned`.
  6. Sistem menambahkan kembali stok barang ke inventaris sesuai jumlah pengembalian.
  7. Sistem memperbarui log aktivitas.

---

### UC-09: CRUD Barang (Guru/Admin)
- **Deskripsi:** Guru mengelola katalog barang inventaris jurusan.
- **Aktor:** Guru, Admin
- **Pre-kondisi:** Pengguna memiliki hak akses guru atau admin.
- **Alur Utama:**
  - *Create:* Guru mengisi form barang baru (nama, kategori, stok awal, foto) -> Sistem menyimpan ke database.
  - *Read:* Guru mencari/memfilter list barang -> Sistem menampilkan data.
  - *Update:* Guru memperbarui informasi barang atau menambah gambar galeri -> Sistem menyimpan perubahan.
  - *Delete (Admin Only):* Admin mengklik hapus -> Sistem memeriksa peminjaman aktif -> Jika aman, sistem melakukan soft delete.

---

### UC-10: CRUD Kategori (Guru/Admin)
- **Deskripsi:** Guru mengelola kategori pengelompokan barang inventaris.
- **Aktor:** Guru, Admin
- **Alur Utama:**
  - *Create:* Guru menginput nama kategori baru -> Sistem menyimpan data.
  - *Update:* Guru mengedit nama/deskripsi kategori -> Sistem memperbarui database.
  - *Delete (Admin Only):* Admin menghapus kategori -> Sistem memvalidasi apakah ada barang di kategori tersebut -> Jika kosong, kategori dihapus.

---

### UC-11: Lihat Dashboard & Log (Guru/Admin)
- **Deskripsi:** Guru memantau statistik sirkulasi barang serta log perubahan sistem.
- **Aktor:** Guru, Admin
- **Alur Utama:**
  1. Guru membuka halaman utama dashboard.
  2. Sistem menampilkan bagan statistik, jumlah barang menipis, dan transaksi pending.
  3. Guru membuka menu log aktivitas.
  4. Sistem menampilkan daftar kronologis aksi pengguna (siapa, melakukan apa, kapan).

---

### UC-12: CRUD User (Admin Only)
- **Deskripsi:** Admin mengelola akun pengguna sekolah yang terdaftar di sistem.
- **Aktor:** Admin
- **Pre-kondisi:** Pengguna yang login adalah Admin.
- **Alur Utama:**
  1. Admin membuka menu "Manajemen Pengguna".
  2. Admin dapat menambahkan user manual (nama, email, role, NIS/NIP).
  3. Admin dapat mengedit profil user atau mengubah role (misal: mempromosikan siswa menjadi guru).
  4. Sistem menyimpan data ke database `users`.

---

### UC-13: Toggle Aktif User (Admin Only)
- **Deskripsi:** Admin menonaktifkan atau mengaktifkan kembali akun pengguna.
- **Aktor:** Admin
- **Pre-kondisi:** Pengguna yang login adalah Admin.
- **Post-kondisi:** Jika diset tidak aktif, user tersebut tidak akan bisa login lagi meskipun token Google-nya valid.
- **Alur Utama:**
  1. Admin membuka detail data user di menu "Manajemen Pengguna".
  2. Admin menekan tombol toggle "Aktif/Nonaktif".
  3. Sistem memperbarui kolom `is_active` menjadi `true` atau `false`.
  4. Sistem mencatat log aktivitas.
  5. Sesi aktif user tersebut langsung dicabut (dihapus dari `personal_access_tokens`).
