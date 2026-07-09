# 04 — USER FLOW
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

> Dokumen ini memetakan seluruh alur pengguna (user flow) dalam aplikasi menggunakan diagram alur ASCII.

---

## 1. Alur Autentikasi (Login & Sesi)

Alur masuk sistem bagi semua pengguna (Siswa, Guru, Admin).

```
[ Mulai ]
   │
   ▼
[ Halaman Login ]
   │
   ▼
( Klik "Login dengan Google" )
   │
   ▼
[ Consent Screen Google ]
   │
   ▼
{ Google Mengembalikan ID Token }
   │
   ▼
{ Kirim ID Token ke POST /api/auth/google }
   │
   ├───► [ Gagal Verifikasi ] ──► [ Tampilkan Error Login ] ──► [ Kembali ke Login ]
   │
   ▼
{ Token Valid }
   │
   ▼
{ Cek status user: is_active }
   ├───► [ is_active = false ] ──► [ Tampilkan Pesan "Akun Dinonaktifkan" ]
   │
   ▼
{ is_active = true }
   │
   ├─► [ User Baru ] ──► [ Buat User Baru (Role: Siswa) ]
   │                            │
   │                            ▼
   └─► [ User Lama ] ──► [ Update Data Profil (Avatar) ]
                                │
                                ▼
                  { Kembalikan Sanctum Token }
                                │
                                ▼
                    [ Arahkan berdasarkan Role ]
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   [ Role: Siswa ]         [ Role: Guru ]          [ Role: Admin ]
        │                       │                       │
        ▼                       ▼                       ▼
  [ Dashboard Siswa ]     [ Dashboard Guru ]      [ Dashboard Admin ]
```

---

## 2. Alur Peminjaman Barang (Siswa)

Proses dari memilih barang, mengajukan, hingga status menunggu persetujuan.

```
[ Dashboard Siswa ]
   │
   ▼
[ Halaman Cari Barang ] ◄─────────────────────────────────────────────┐
   │                                                                  │
   ▼                                                                  │
[ Filter / Search Kategori & Stok ]                                    │
   │                                                                  │
   ▼                                                                  │
( Pilih Barang )                                                      │
   │                                                                  │
   ▼                                                                  │
[ Detail Barang ]                                                     │
   │                                                                  │
   ├───► [ Stok = 0 ] ──► [ Tombol "Pinjam" Dinonaktifkan ] ──────────┤
   │                                                                  │
   ▼                                                                  │
{ Stok > 0 }                                                          │
   │                                                                  │
   ▼                                                                  │
( Klik "Tambah ke Keranjang Peminjaman" ) ─────────────────────────────┘
   │
   ▼
[ Buka Form Pengajuan Peminjaman ]
   │
   ▼
( Isi Form: Tujuan Peminjaman, Rencana Ambil & Rencana Kembali )
   │
   ▼
( Klik "Kirim Pengajuan" )
   │
   ▼
{ Validasi Sisi Server }
   │
   ├───► [ Validasi Gagal / Stok Tidak Cukup ] ──► [ Tampilkan Toast Error ] ──► [ Kembali ke Form ]
   │
   ▼
{ Validasi Sukses }
   │
   ▼
[ DB Transaction: Simpan Borrowing & Detail ]
   │
   ▼
[ Log: borrowing.created ]
   │
   ▼
[ Status: PENDING ]
   │
   ▼
[ Tampilkan Halaman Detail Peminjaman ]
```

---

## 3. Alur Persetujuan & Pengambilan (Guru / Admin)

Proses menyetujui pengajuan peminjaman dan siswa mengambil barang fisik dengan mengunggah foto selfie.

```
                  [ Dashboard Guru / Admin ]
                             │
                             ▼
                 [ Menu "Persetujuan" ]
                             │
                             ▼
                [ Pilih Transaksi PENDING ]
                             │
                             ▼
              [ Review Detail & Verifikasi Stok ]
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      ( Klik "Setujui" )             ( Klik "Tolak" )
            │                                 │
            │                                 ▼
            │                     ( Wajib Isi Alasan Reject )
            │                                 │
            ▼                                 ▼
  { Validasi Ulang Stok }             [ Update Status: REJECTED ]
            │                                 │
   ┌────────┴────────┐                        ▼
   │ Stok Kurang     │ Stok Ok        [ Log: borrowing.rejected ]
   ▼                 ▼                        │
[ Tampilkan   [ DB Transaction:               ▼
 Error ]       - Status: APPROVED       [ Selesai (Terminal State) ]
               - Kurangi Stok Barang
               - Log: approved ]
                     │
                     ▼
             [ Status: APPROVED ]
                     │
                     ▼
           [ Siswa Mengambil Barang ]
                     │
                     ▼
        [ Siswa Buka Detail Peminjaman ]
                     │
                     ▼
        ( Upload Foto Selfie Mengambil )
                     │
                     ▼
        [ Simpan Foto ke Storage ]
                     │
                     ▼
           [ Selesai Pengambilan ]
           ( Status Tetap: APPROVED )
```

---

## 4. Alur Pengembalian Barang & Konfirmasi (Siswa -> Guru)

Proses saat siswa mengembalikan barang dan guru memverifikasi kondisi fisik.

```
               [ Siswa Buka Detail Peminjaman APPROVED ]
                                 │
                                 ▼
                     ( Klik "Kembalikan Barang" )
                                 │
                                 ▼
                 ( Wajib Upload Foto Selfie Return )
                                 │
                                 ▼
                     [ Simpan Foto ke Storage ]
                                 │
                                 ▼
                   [ DB Transaction: ]
                   [ - Update Status: RETURNING ]
                   [ - Log: return.submitted ]
                                 │
                                 ▼
                       [ Status: RETURNING ]
                                 │
                                 ▼
                [ Guru Menerima Barang Fisik ]
                                 │
                                 ▼
                     [ Guru Buka Halaman Detail ]
                                 │
                                 ▼
                   [ Review Foto & Cek Fisik ]
                                 │
                                 ▼
               ( Pilih Kondisi Barang Per Item )
                                 │
                                 ▼
                 ( Klik "Konfirmasi Pengembalian" )
                                 │
                                 ▼
                       [ DB Transaction: ]
                       [ - Update Status: RETURNED ]
                       [ - Tambah Stok Barang ]
                       [ - Log: return.approved ]
                                 │
                                 ▼
                       [ Status: RETURNED ]
                                 │
                                 ▼
                     [ Selesai (Terminal State) ]
```

---

## 5. Alur CRUD Barang (Guru / Admin)

Proses penambahan, pengubahan, dan penghapusan barang inventaris.

```
                  [ Halaman Inventaris Barang ]
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
     ( Tambah Barang )     ( Edit Barang )       ( Hapus Barang )
          │                     │                     │
          ▼                     ▼                     ▼
     [ Form Tambah ]       [ Form Edit ]         { Cek Peminjaman Aktif }
          │                     │                     │
   ( Isi Data & Foto )   ( Ubah Data/Foto )           ├─► [ Ada Aktif ] ──► [ Tolak Hapus ]
          │                     │                     │
          ▼                     ▼                     ▼
   ( Klik "Simpan" )     ( Klik "Simpan" )       { Tidak Ada }
          │                     │                     │
          ▼                     ▼                     ▼
    [ DB Transaction ]    [ DB Transaction ]     [ Soft Delete (deleted_at) ]
    [ - Simpan Item ]     [ - Update Item ]      [ - Update stock = 0 ]
    [ - Log: item.create] [ - Log: item.update ] [ - Log: item.delete ]
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
                    [ Tampilkan Halaman List ]
```
