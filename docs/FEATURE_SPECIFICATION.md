# FEATURE_SPECIFICATION.md — Inventory TKJ

> Spesifikasi fungsional lengkap: apa yang dikerjakan aplikasi, siapa yang bisa melakukan apa, dan bagaimana alur kerjanya.

---

## Role & Hak Akses

| Fitur | Siswa | Guru | Admin |
|---|:---:|:---:|:---:|
| Login via Google | ✅ | ✅ | ✅ |
| Lihat daftar barang | ✅ | ✅ | ✅ |
| Lihat detail barang | ✅ | ✅ | ✅ |
| Buat pengajuan peminjaman | ✅ | — | — |
| Upload selfie peminjaman | ✅ | — | — |
| Lihat peminjaman sendiri | ✅ | — | — |
| Batalkan peminjaman pending | ✅ | — | — |
| Upload selfie pengembalian | ✅ | — | — |
| Lihat semua peminjaman | — | ✅ | ✅ |
| Approve/reject peminjaman | — | ✅ | ✅ |
| Approve pengembalian | — | ✅ | ✅ |
| CRUD Barang | — | ✅ | ✅ |
| CRUD Kategori | — | ✅ | ✅ |
| Hapus Barang | — | — | ✅ |
| Hapus Kategori | — | — | ✅ |
| CRUD User | — | — | ✅ |
| Dashboard & Statistik | — | ✅ | ✅ |
| Riwayat transaksi | — | ✅ | ✅ |
| Log Aktivitas | — | ✅ | ✅ |

---

## Fitur Detail

### F-01: Autentikasi — Google OAuth

**Aktor:** Semua user

**Alur Normal:**
1. User klik tombol "Login dengan Google"
2. Frontend redirect ke halaman consent Google (Google One Tap / Popup)
3. Google mengembalikan `id_token` ke frontend
4. Frontend kirim `id_token` ke backend `POST /api/auth/google`
5. Backend verifikasi token ke Google API
6. Jika email belum ada → buat akun baru dengan role default `siswa`
7. Jika email sudah ada → update `google_id` & `avatar` jika kosong
8. Backend kembalikan Sanctum token
9. Frontend simpan token di localStorage/memory
10. Redirect ke halaman sesuai role

**Alur Alternatif — Akun Nonaktif:**
- Jika `is_active = false` → tolak login dengan pesan "Akun Anda telah dinonaktifkan"

**Alur Logout:**
1. User klik "Keluar"
2. Frontend kirim `POST /api/auth/logout`
3. Backend hapus token Sanctum
4. Frontend hapus token lokal
5. Redirect ke halaman login

**Aturan:**
- Hanya email dengan domain sekolah yang diperbolehkan (opsional, dikonfigurasi di env)
- Role pertama kali selalu `siswa`, admin yang ubah ke `guru`/`admin`

---

### F-02: Melihat Daftar & Detail Barang

**Aktor:** Semua user (harus login)

**Daftar Barang:**
- Tampil dalam bentuk grid/list
- Informasi ditampilkan: nama, foto, kategori, stok tersedia, kondisi
- Filter tersedia: kategori, kondisi, ketersediaan (stok > 0)
- Pencarian: berdasarkan nama, brand, model
- Indikator stok: Tersedia / Terbatas / Habis

**Detail Barang:**
- Galeri foto (multi-image)
- Informasi lengkap: nama, brand, model, deskripsi, lokasi
- Stok tersedia vs total stok
- Kondisi barang
- Riwayat peminjaman barang (untuk guru/admin)

---

### F-03: Peminjaman Barang (Siswa)

**Aktor:** Siswa

**Alur Membuat Pengajuan:**
1. Siswa pilih barang yang ingin dipinjam
2. Siswa isi form peminjaman:
   - Tujuan peminjaman (wajib)
   - Tanggal rencana ambil
   - Tanggal rencana kembali
   - Catatan tambahan (opsional)
   - Pilih item + jumlah (bisa multi-item)
3. Sistem validasi stok mencukupi
4. Sistem buat record `borrowings` dengan status `pending`
5. Sistem buat kode unik `BRW-YYYYMMDD-XXXX`
6. Guru mendapat notifikasi (opsional: push notification / email)

**Validasi:**
- Stok barang harus ≥ jumlah yang diminta
- Tanggal ambil tidak boleh masa lalu
- Tanggal kembali harus setelah tanggal ambil
- Siswa tidak bisa punya 2 peminjaman `pending` untuk barang yang sama (bisa dikonfigurasi)

**Pembatalan (Cancel):**
- Hanya bisa dilakukan jika status masih `pending`
- Setelah approved, tidak bisa dibatalkan

---

### F-04: Upload Selfie Peminjaman (Siswa)

**Aktor:** Siswa

**Kapan:** Setelah peminjaman berstatus `approved` dan siswa sudah mengambil barang secara fisik.

**Alur:**
1. Siswa buka detail peminjaman yang sudah diapprove
2. Siswa upload foto selfie sambil memegang barang
3. Sistem simpan foto ke storage
4. Status peminjaman tetap `approved` (foto selfie borrow bukan trigger status)
5. Foto tersimpan sebagai bukti pengambilan barang

**Aturan:**
- Satu peminjaman bisa punya beberapa foto borrow (multiple upload)
- Format: JPG, PNG, WebP — maksimal 5MB
- Nama file disimpan sebagai UUID, bukan nama asli

---

### F-05: Pengembalian Barang (Siswa)

**Aktor:** Siswa

**Kapan:** Ketika siswa ingin mengembalikan barang (status peminjaman harus `approved`).

**Alur:**
1. Siswa buka detail peminjaman
2. Siswa klik "Kembalikan Barang"
3. Siswa upload foto selfie saat pengembalian
4. Sistem simpan foto, status berubah ke `returning`
5. Guru mendapat notifikasi untuk konfirmasi pengembalian
6. Guru review foto & kondisi barang
7. Guru approve pengembalian → status `returned`, stok bertambah

**Aturan:**
- Foto pengembalian wajib diunggah sebelum status bisa berubah ke `returning`
- Satu kali upload foto return sudah cukup untuk trigger perubahan status

---

### F-06: Approval Peminjaman (Guru/Admin)

**Aktor:** Guru, Admin

**Alur Approve:**
1. Guru lihat daftar peminjaman berstatus `pending`
2. Guru buka detail pengajuan
3. Guru review: nama peminjam, barang, jumlah, tujuan, tanggal
4. Guru klik "Setujui" dengan catatan opsional
5. Sistem:
   - Ubah status ke `approved`
   - Catat `approved_by`, `approved_at`
   - Kurangi stok barang sesuai jumlah yang disetujui
   - Catat ke `activity_logs`
6. Siswa mendapat notifikasi

**Alur Reject:**
1. Guru klik "Tolak"
2. Guru wajib isi alasan penolakan
3. Sistem:
   - Ubah status ke `rejected`
   - Catat `rejection_reason`, `rejected_at`
   - Stok TIDAK berubah
   - Catat ke `activity_logs`

**Validasi stok saat approve:**
- Cek ulang stok real-time sebelum approve
- Jika stok tidak cukup (karena approval lain lebih dulu) → tampilkan peringatan

---

### F-07: Approval Pengembalian (Guru/Admin)

**Aktor:** Guru, Admin

**Alur:**
1. Guru lihat daftar peminjaman berstatus `returning`
2. Guru buka detail, lihat foto selfie pengembalian
3. Guru periksa kondisi barang secara fisik
4. Guru isi kondisi barang yang kembali per item (`baik`, `rusak_ringan`, `rusak_berat`)
5. Guru klik "Konfirmasi Pengembalian"
6. Sistem:
   - Ubah status ke `returned`
   - Catat `return_approved_by`, `return_approved_at`
   - Tambah stok barang sesuai `returned_quantity`
   - Update `item_condition_in` di `borrowing_items`
   - Catat ke `activity_logs`

---

### F-08: CRUD Barang (Guru/Admin)

**Aktor:** Guru, Admin

**Create:**
- Nama barang, kategori, brand, model, deskripsi
- Stok awal & total stok
- Kondisi, lokasi penyimpanan
- Upload foto utama + galeri foto

**Read (List):**
- Tabel dengan kolom: foto, nama, kategori, stok, kondisi, aksi
- Filter, search, sort
- Pagination

**Update:**
- Semua field yang ada saat create
- Bisa tambah/hapus foto galeri
- Perubahan stok via adjustment (bukan langsung edit angka — untuk audit trail)

**Delete (Admin only):**
- Hanya bisa hapus jika tidak ada peminjaman aktif (status `approved` atau `returning`)
- Peminjaman historis (returned/rejected) boleh tetap ada
- Soft delete direkomendasikan

**Adjustment Stok (Guru/Admin):**
- Fitur untuk menambah atau mengurangi stok fisik karena alasan non-peminjaman (kerusakan, penambahan unit)
- Wajib isi alasan
- Tercatat di activity_logs

---

### F-09: CRUD Kategori (Guru/Admin)

**Aktor:** Guru, Admin

**Create/Update:**
- Nama kategori (unik)
- Deskripsi opsional
- Slug di-generate otomatis dari nama

**Delete (Admin only):**
- Tidak bisa hapus jika masih ada barang di kategori ini

---

### F-10: CRUD User (Admin)

**Aktor:** Admin

**Create:**
- Buat user manual (tanpa OAuth)
- Nama, email, role, NIS/NIP, nomor HP
- Password sementara
- User bisa login dengan password atau kemudian link ke Google

**Update:**
- Edit data profil
- Ubah role
- Reset password

**Nonaktifkan:**
- Toggle `is_active`
- User tidak bisa login
- Data historis tetap tersimpan

---

### F-11: Dashboard (Guru/Admin)

**Aktor:** Guru, Admin

**Widget yang ditampilkan:**
| Widget | Data |
|---|---|
| Total Barang | Jumlah semua barang aktif |
| Total Kategori | Jumlah kategori |
| Total User | Jumlah user aktif |
| Peminjaman Aktif | Count status `approved` |
| Menunggu Persetujuan | Count status `pending` |
| Menunggu Konfirmasi Kembali | Count status `returning` |
| Barang Stok Rendah | Count items dengan `stock <= stock_minimum` |
| Grafik Peminjaman | Chart 7/30 hari terakhir |
| Peminjaman Terbaru | 5-10 peminjaman terbaru |
| Aktivitas Terbaru | 10 log aktivitas terakhir |

---

### F-12: Riwayat (Guru/Admin)

**Aktor:** Guru, Admin

**Fitur:**
- Daftar semua transaksi peminjaman sepanjang waktu
- Filter: status, user, tanggal, barang
- Export ke Excel/CSV (opsional, fase berikutnya)
- Detail setiap transaksi dengan foto-foto

---

### F-13: Log Aktivitas (Guru/Admin)

**Aktor:** Guru, Admin

**Tampilan:**
- Timeline aktivitas dengan timestamp
- Filter: jenis aksi, user, tanggal
- Setiap log menampilkan: siapa, melakukan apa, kapan, pada data apa
- Detail perubahan data (before/after) untuk aksi update

---

## Business Rules Lengkap

### Aturan Stok

```
BR-STOCK-01: Jika stock = 0, siswa tidak bisa mengajukan peminjaman barang tersebut.
BR-STOCK-02: Stok berkurang HANYA saat guru/admin APPROVE peminjaman.
BR-STOCK-03: Stok bertambah HANYA saat guru/admin APPROVE PENGEMBALIAN.
BR-STOCK-04: Stok tidak pernah boleh menjadi negatif.
BR-STOCK-05: Pengurangan/penambahan stok harus dilakukan dalam database transaction.
```

### Aturan Status Peminjaman

```
BR-STATUS-01: Status PENDING → hanya bisa ke APPROVED, REJECTED, atau CANCELLED.
BR-STATUS-02: Status APPROVED → hanya bisa ke RETURNING.
BR-STATUS-03: Status RETURNING → hanya bisa ke RETURNED.
BR-STATUS-04: Status REJECTED, RETURNED, CANCELLED → tidak bisa berubah (terminal state).
BR-STATUS-05: Hanya pemilik peminjaman yang bisa CANCEL (dari PENDING → CANCELLED).
BR-STATUS-06: Hanya guru/admin yang bisa APPROVE atau REJECT.
BR-STATUS-07: Transisi APPROVED → RETURNING dipicu oleh upload foto return oleh siswa.
```

### Aturan Foto

```
BR-PHOTO-01: Foto selfie borrow WAJIB diupload setelah peminjaman diapprove (sebelum mengambil barang).
BR-PHOTO-02: Foto selfie return WAJIB diupload saat siswa mengembalikan barang.
BR-PHOTO-03: Upload foto return otomatis mengubah status APPROVED → RETURNING.
BR-PHOTO-04: Semua foto TIDAK BOLEH dihapus dari sistem (audit trail permanen).
BR-PHOTO-05: Format foto: JPG, JPEG, PNG, WebP. Maksimal 5MB.
```

### Aturan Log Aktivitas

```
BR-LOG-01: Setiap aksi create, update, delete, approve, reject wajib tercatat di activity_logs.
BR-LOG-02: Log menyimpan state SEBELUM dan SESUDAH perubahan (via properties JSON).
BR-LOG-03: Log TIDAK BOLEH dihapus oleh siapapun.
BR-LOG-04: Log menyimpan IP address dan user agent sebagai forensik.
```

### Aturan Autentikasi

```
BR-AUTH-01: Semua endpoint API (kecuali login Google) wajib menggunakan Sanctum token.
BR-AUTH-02: Token invalid/expired → kembalikan 401 Unauthorized.
BR-AUTH-03: User dengan is_active=false tidak bisa login.
BR-AUTH-04: Siswa hanya bisa melihat peminjaman milik sendiri (bukan milik orang lain).
BR-AUTH-05: Guru/Admin bisa melihat semua data.
```

---

## Notifikasi (Future Enhancement)

| Event | Penerima | Channel |
|---|---|---|
| Peminjaman baru diajukan | Semua guru/admin | In-app notification |
| Peminjaman diapprove | Siswa peminjam | In-app notification |
| Peminjaman ditolak | Siswa peminjam | In-app notification |
| Pengembalian disubmit | Semua guru/admin | In-app notification |
| Pengembalian dikonfirmasi | Siswa peminjam | In-app notification |
| Stok barang rendah | Admin | In-app notification |

---

## Validasi Form — Ringkasan

### Form Buat Peminjaman
| Field | Aturan |
|---|---|
| `purpose` | Required, min 10 karakter |
| `borrow_date` | Required, date, tidak masa lalu |
| `expected_return_date` | Required, date, setelah borrow_date |
| `items` | Required, array min 1 item |
| `items[].item_id` | Required, exists di tabel items |
| `items[].quantity` | Required, integer, min 1, ≤ stok tersedia |

### Form Tambah Barang
| Field | Aturan |
|---|---|
| `category_id` | Required, exists |
| `name` | Required, max 255 karakter |
| `stock` | Required, integer ≥ 0 |
| `stock_total` | Required, integer ≥ stock |
| `condition` | Required, in: baik, rusak_ringan, rusak_berat |
| `image` | Optional, mimes: jpg,jpeg,png,webp, max 5MB |

### Form Reject Peminjaman
| Field | Aturan |
|---|---|
| `rejection_reason` | Required, min 10 karakter |

### Form Approve Return
| Field | Aturan |
|---|---|
| `items` | Required, array |
| `items[].borrowing_item_id` | Required, exists |
| `items[].returned_quantity` | Required, integer, ≥ 1 |
| `items[].item_condition_in` | Required, in: baik, rusak_ringan, rusak_berat |
