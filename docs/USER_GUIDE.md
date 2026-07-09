# Panduan Pengguna — Inventory TKJ

Sistem manajemen inventaris dan peminjaman peralatan laboratorium TKJ SMKN 2 Singosari.

---

## Daftar Isi

- [Akun & Autentikasi](#akun--autentikasi)
- [Panduan Siswa](#panduan-siswa)
- [Panduan Guru](#panduan-guru)
- [Panduan Admin](#panduan-admin)

---

## Akun & Autentikasi

### Mendaftar Akun (Siswa Baru)

1. Buka halaman `/register`
2. Isi nama lengkap, email, password, dan konfirmasi password
3. Pilih **Angkatan** yang sesuai
4. Pilih **Kelas** dari angkatan yang dipilih
5. Isi **Nomor Absen**
6. Klik **Daftar**
7. Akun akan berstatus **Menunggu Persetujuan** — tunggu admin menyetujui sebelum bisa login

### Login

**Dengan Email & Password:**
1. Buka halaman `/login`
2. Masukkan email dan password
3. Klik **Masuk**

**Dengan Google:**
1. Klik tombol **Masuk dengan Google**
2. Pilih akun Google yang terdaftar di sistem

> Catatan: Login Google hanya bisa digunakan jika akun Google sudah dihubungkan ke akun sistem.

### Lupa Password

Hubungi admin untuk reset password.

---

## Panduan Siswa

Siswa hanya dapat mengajukan peminjaman dan memantau status peminjaman.

### Melihat Daftar Barang

1. Klik menu **Barang** di sidebar
2. Gunakan kolom pencarian untuk mencari barang berdasarkan nama, merek, atau model
3. Klik nama barang untuk melihat detail stok dan kondisi

### Mengajukan Peminjaman

1. Klik menu **Peminjaman** di sidebar
2. Klik tombol **+ Buat Peminjaman**
3. Isi **Tujuan Peminjaman** (wajib)
4. Pilih **Tanggal Pinjam** dan **Tanggal Kembali**
5. Tambahkan barang yang ingin dipinjam:
   - Klik **Tambah Barang**
   - Cari dan pilih barang
   - Tentukan jumlah
6. Upload **foto selfie** (bukti identitas peminjam)
7. Klik **Kirim Permohonan**
8. Status awal: **Menunggu Persetujuan Guru**

> Pastikan stok barang tersedia sebelum mengajukan.

### Memantau Status Peminjaman

Status peminjaman yang mungkin muncul:

| Status | Keterangan |
|---|---|
| Menunggu | Menunggu persetujuan guru/admin |
| Disetujui | Sudah disetujui, barang bisa diambil |
| Dipinjam | Barang sedang dipinjam |
| Pengembalian | Proses pengembalian sedang diverifikasi |
| Dikembalikan | Peminjaman selesai |
| Ditolak | Permohonan ditolak |
| Terlambat | Melewati tanggal pengembalian |

### Mengembalikan Barang

1. Buka detail peminjaman yang ingin dikembalikan
2. Klik tombol **Kembalikan Barang**
3. Upload **foto selfie** saat pengembalian
4. Konfirmasi pengembalian
5. Tunggu verifikasi dari guru/admin

### Membatalkan Peminjaman

Peminjaman hanya bisa dibatalkan selama masih berstatus **Menunggu**.

1. Buka detail peminjaman
2. Klik **Batalkan**
3. Konfirmasi pembatalan

---

## Panduan Guru

Guru memiliki akses ke semua fitur siswa ditambah approval peminjaman dan laporan.

### Menyetujui / Menolak Peminjaman

1. Klik menu **Peminjaman** di sidebar
2. Filter status **Menunggu** untuk melihat permohonan yang perlu diproses
3. Klik peminjaman untuk melihat detail
4. Klik **Setujui** atau **Tolak**
5. Jika menolak, isi alasan penolakan

### Memverifikasi Pengembalian

1. Buka detail peminjaman dengan status **Pengembalian**
2. Periksa foto selfie pengembalian
3. Verifikasi kondisi barang yang dikembalikan per item
4. Klik **Konfirmasi Kembali**

### Melihat Laporan

Menu **Laporan** tersedia untuk guru dan admin:

- **Lap. Peminjaman** — rekap semua transaksi peminjaman dengan filter tanggal, status, dan user
- **Lap. Pengembalian** — rekap pengembalian barang
- **Lap. Inventaris** — kondisi dan stok semua barang

Semua laporan dapat diekspor ke **Excel** atau **PDF**.

---

## Panduan Admin

Admin memiliki akses penuh ke semua fitur sistem.

### Manajemen Pengguna

#### Menyetujui Pendaftaran Siswa

1. Klik menu **Pengguna** di sidebar
2. Pilih tab **Menunggu Persetujuan**
3. Periksa data calon pengguna
4. Klik **Setujui** atau **Tolak** (dengan alasan)

#### Blokir / Aktifkan Pengguna

1. Buka halaman **Pengguna**
2. Cari pengguna yang ingin diblokir
3. Klik tombol **Blokir** atau **Aktifkan**

#### Edit Data Pengguna

Admin dapat mengubah role, kelas, nomor absen, NIS/NIP, dan nomor telepon pengguna.

### Manajemen Inventaris

#### Tambah Barang Baru

1. Klik menu **Barang**
2. Klik **+ Tambah Barang**
3. Isi data: nama, kategori, deskripsi, merek, model, stok total, stok minimum, kondisi, lokasi
4. Upload foto cover dan galeri (opsional)
5. Klik **Simpan**

#### Edit Barang

1. Klik ikon pensil di baris barang yang ingin diedit
2. Ubah data yang diperlukan
3. Klik **Simpan Perubahan**

#### Hapus Barang

1. Klik ikon hapus di baris barang
2. Konfirmasi penghapusan

> Barang yang sedang dipinjam tidak dapat dihapus.

#### Penyesuaian Kondisi Stok

Untuk mengubah kondisi stok (misal dari Baik → Rusak Ringan):

1. Buka halaman **Barang**
2. Klik **Sesuaikan Kondisi** pada barang yang ingin diubah
3. Pilih kondisi asal dan kondisi tujuan
4. Isi jumlah dan catatan (opsional)
5. Konfirmasi

### Manajemen Kategori

1. Klik menu **Kategori**
2. Tambah, edit, atau hapus kategori barang

### Manajemen Master Data

#### Tahun Ajaran

1. Klik menu **Tahun Ajaran**
2. Tambah tahun ajaran baru
3. Aktifkan atau nonaktifkan tahun ajaran (maksimal 3 aktif bersamaan)

#### Kelas

1. Klik menu **Kelas**
2. Pilih tahun ajaran
3. Tambah atau hapus kelas

> Kelas yang masih memiliki siswa tidak dapat dihapus.

---

## Tips & Catatan Penting

- **Foto selfie wajib** saat peminjaman dan pengembalian sebagai bukti identitas
- **Stok minimum** adalah batas peringatan — admin akan melihat alert saat stok di bawah nilai ini
- **Nomor absen** bersifat unik per kelas — tidak boleh ada duplikasi
- **Google login** hanya bisa digunakan setelah akun Google dihubungkan melalui halaman Profil
- Semua aktivitas penting tercatat di **log aktivitas** yang bisa dilihat admin di dashboard

---

*Dokumen ini diperbarui sesuai perkembangan fitur sistem.*
