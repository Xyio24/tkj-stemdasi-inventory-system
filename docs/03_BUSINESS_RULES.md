# 03 — BUSINESS RULES
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

> Dokumen ini mendefinisikan seluruh aturan bisnis yang harus ditegakkan oleh sistem.
> Setiap aturan bersifat **non-negotiable** kecuali ada keputusan eksplisit dari pemangku kepentingan.

---

## Kategori BR

| Kode Prefix | Kategori |
|---|---|
| `BR-AUTH` | Autentikasi & Otorisasi |
| `BR-USER` | Manajemen Pengguna |
| `BR-ITEM` | Manajemen Barang |
| `BR-CAT` | Manajemen Kategori |
| `BR-BRW` | Peminjaman (Borrowing) |
| `BR-PHO` | Foto & Upload |
| `BR-STK` | Stok & Inventaris |
| `BR-APR` | Approval & Workflow |
| `BR-RET` | Pengembalian |
| `BR-LOG` | Log & Audit Trail |
| `BR-DAT` | Integritas Data |

---

## BR-AUTH — Autentikasi & Otorisasi

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-AUTH-01** | Setiap pengguna yang mengakses sistem **wajib terautentikasi** menggunakan Sanctum Bearer Token, kecuali endpoint login | HTTP 401 Unauthorized |
| **BR-AUTH-02** | Token yang tidak valid, kedaluwarsa, atau sudah dicabut **harus ditolak** | HTTP 401 Unauthorized |
| **BR-AUTH-03** | Login hanya diizinkan melalui Google OAuth 2.0. ID token Google **wajib diverifikasi di sisi server** | Login gagal |
| **BR-AUTH-04** | Pengguna dengan `is_active = false` **tidak diizinkan login** meskipun memiliki token Google yang valid | Login gagal dengan pesan jelas |
| **BR-AUTH-05** | Role `siswa` hanya dapat mengakses resource miliknya sendiri (peminjaman, foto). Tidak boleh mengakses data pengguna lain | HTTP 403 Forbidden |
| **BR-AUTH-06** | Role `guru` dapat melihat **semua** data peminjaman dan inventaris, tetapi tidak dapat mengelola akun pengguna | HTTP 403 Forbidden |
| **BR-AUTH-07** | Role `admin` memiliki akses penuh ke seluruh sistem termasuk manajemen pengguna | — |
| **BR-AUTH-08** | Saat pengguna baru login pertama kali via Google, role otomatis diset ke `siswa`. Perubahan role hanya bisa dilakukan oleh `admin` | — |
| **BR-AUTH-09** | Endpoint yang memerlukan role tertentu harus divalidasi melalui middleware, bukan di dalam controller | HTTP 403 Forbidden |
| **BR-AUTH-10** | Logout harus menghapus token dari database (bukan hanya di sisi client) | Token masih valid jika tidak dihapus |

---

## BR-USER — Manajemen Pengguna

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-USER-01** | Email pengguna bersifat **unik** di seluruh sistem. Tidak boleh ada dua pengguna dengan email yang sama | HTTP 422 Unprocessable Entity |
| **BR-USER-02** | Pengguna yang dinonaktifkan (`is_active = false`) **tidak boleh dihapus** dari database. Data historis harus tetap terhubung | — |
| **BR-USER-03** | Pengguna yang memiliki peminjaman aktif (`approved` atau `returning`) **tidak dapat dinonaktifkan** | HTTP 409 Conflict |
| **BR-USER-04** | NIS/NIP bersifat opsional, tetapi jika diisi maka **harus unik** per role (NIS untuk siswa, NIP untuk guru) | HTTP 422 Unprocessable Entity |
| **BR-USER-05** | Hanya `admin` yang dapat mengubah role pengguna | HTTP 403 Forbidden |
| **BR-USER-06** | Admin tidak dapat mengubah role dirinya sendiri untuk mencegah lockout | HTTP 409 Conflict |

---

## BR-ITEM — Manajemen Barang

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-ITEM-01** | Nama barang bersifat **wajib** dan tidak boleh kosong | HTTP 422 Unprocessable Entity |
| **BR-ITEM-02** | Setiap barang **wajib memiliki kategori**. Tidak ada barang tanpa kategori | HTTP 422 Unprocessable Entity |
| **BR-ITEM-03** | `stock` tidak boleh lebih besar dari `stock_total` | HTTP 422 Unprocessable Entity |
| **BR-ITEM-04** | `stock` dan `stock_total` tidak boleh bernilai negatif | HTTP 422 Unprocessable Entity |
| **BR-ITEM-05** | Barang yang memiliki peminjaman dengan status `approved` atau `returning` **tidak dapat dihapus** | HTTP 409 Conflict |
| **BR-ITEM-06** | Penghapusan barang harus menggunakan **soft delete** (kolom `deleted_at`), bukan hard delete | — |
| **BR-ITEM-07** | Slug barang harus **unik** di seluruh sistem dan di-generate otomatis dari nama | — |
| **BR-ITEM-08** | Foto barang (cover dan galeri) harus disimpan di storage server, bukan dalam kolom database | — |
| **BR-ITEM-09** | Kondisi barang hanya boleh salah satu dari: `baik`, `rusak_ringan`, `rusak_berat` | HTTP 422 Unprocessable Entity |
| **BR-ITEM-10** | Stok barang **hanya boleh diubah melalui proses approval** (approve peminjaman atau approve pengembalian), bukan diedit langsung di form barang | — |

---

## BR-CAT — Manajemen Kategori

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-CAT-01** | Nama kategori bersifat **unik** di seluruh sistem | HTTP 422 Unprocessable Entity |
| **BR-CAT-02** | Kategori yang masih memiliki barang (aktif maupun soft-deleted) **tidak dapat dihapus** | HTTP 409 Conflict |
| **BR-CAT-03** | Slug kategori di-generate otomatis dan bersifat unik | — |

---

## BR-BRW — Peminjaman (Borrowing)

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-BRW-01** | Hanya pengguna dengan role `siswa` yang dapat membuat pengajuan peminjaman | HTTP 403 Forbidden |
| **BR-BRW-02** | Setiap pengajuan peminjaman **wajib memiliki minimal satu barang** | HTTP 422 Unprocessable Entity |
| **BR-BRW-03** | Setiap pengajuan peminjaman **wajib memiliki tujuan peminjaman** (minimal 10 karakter) | HTTP 422 Unprocessable Entity |
| **BR-BRW-04** | Tanggal pengambilan tidak boleh berada di masa lalu (harus ≥ hari ini) | HTTP 422 Unprocessable Entity |
| **BR-BRW-05** | Tanggal rencana kembali harus lebih besar dari tanggal pengambilan | HTTP 422 Unprocessable Entity |
| **BR-BRW-06** | Jumlah barang yang diminta tidak boleh melebihi stok tersedia saat pengajuan | HTTP 409 Conflict |
| **BR-BRW-07** | Jumlah setiap item yang diminta minimal 1 | HTTP 422 Unprocessable Entity |
| **BR-BRW-08** | Setiap transaksi peminjaman mendapat kode unik format `BRW-YYYYMMDD-XXXX` yang di-generate oleh sistem | — |
| **BR-BRW-09** | Status awal setiap pengajuan peminjaman adalah `pending` | — |
| **BR-BRW-10** | Siswa hanya dapat membatalkan peminjaman yang berstatus `pending`. Peminjaman yang sudah `approved` tidak dapat dibatalkan secara sepihak oleh siswa | HTTP 409 Conflict |
| **BR-BRW-11** | Siswa hanya dapat melihat peminjaman miliknya sendiri. Peminjaman siswa lain tidak boleh bisa diakses | HTTP 403 Forbidden |
| **BR-BRW-12** | Guru dan admin dapat melihat **seluruh** riwayat peminjaman dari semua siswa | — |
| **BR-BRW-13** | Satu siswa dapat memiliki lebih dari satu peminjaman aktif pada waktu yang sama | — |
| **BR-BRW-14** | Peminjaman dengan status terminal (`returned`, `rejected`, `cancelled`) **tidak dapat diubah statusnya** kembali | HTTP 409 Conflict |

---

## BR-PHO — Foto & Upload

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-PHO-01** | Format file yang diterima untuk semua upload foto adalah: JPG, JPEG, PNG, WebP | HTTP 422 Unprocessable Entity |
| **BR-PHO-02** | Ukuran maksimum setiap file foto adalah **5 MB** | HTTP 422 Unprocessable Entity |
| **BR-PHO-03** | Tipe MIME file harus divalidasi di sisi server, bukan hanya berdasarkan ekstensi | HTTP 422 Unprocessable Entity |
| **BR-PHO-04** | Semua file yang diupload disimpan dengan nama **UUID** (bukan nama asli) untuk keamanan | — |
| **BR-PHO-05** | Nama file asli disimpan di kolom `original_name` untuk referensi | — |
| **BR-PHO-06** | Foto selfie peminjaman dapat diunggah **setelah** peminjaman berstatus `approved` | HTTP 409 Conflict |
| **BR-PHO-07** | Upload foto selfie **pengembalian** hanya dapat dilakukan ketika status peminjaman adalah `approved` | HTTP 409 Conflict |
| **BR-PHO-08** | Upload foto selfie pengembalian secara otomatis mengubah status peminjaman dari `approved` ke `returning` | — |
| **BR-PHO-09** | Foto yang sudah diupload **tidak dapat dihapus** dari sistem (audit trail permanen) | HTTP 403 Forbidden |
| **BR-PHO-10** | File foto disimpan di direktori terstruktur: `borrowings/{id}/borrow/` dan `borrowings/{id}/return/` | — |

---

## BR-STK — Stok & Inventaris

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-STK-01** | Stok barang (`stock`) **tidak boleh pernah bernilai negatif** | Operasi dibatalkan, error 500 / rollback |
| **BR-STK-02** | `stock` tidak boleh lebih besar dari `stock_total` kapanpun | — |
| **BR-STK-03** | Stok hanya berkurang ketika **guru/admin APPROVE** pengajuan peminjaman. Saat pengajuan dibuat, stok belum berubah | — |
| **BR-STK-04** | Stok hanya bertambah ketika **guru/admin APPROVE PENGEMBALIAN**. Upload foto return tidak mengubah stok | — |
| **BR-STK-05** | Jika `stock = 0`, barang **tidak dapat dipinjam**. Sistem harus menolak pengajuan | HTTP 409 Conflict |
| **BR-STK-06** | Pengurangan dan penambahan stok harus dilakukan dalam **database transaction** untuk mencegah race condition | — |
| **BR-STK-07** | Sebelum approve, sistem harus **memvalidasi ulang stok** secara real-time karena mungkin sudah berubah sejak pengajuan dibuat | HTTP 409 Conflict |
| **BR-STK-08** | Jika barang dihapus (soft delete), stok barang tersebut tidak perlu dikembalikan karena data peminjaman aktif sudah dicek sebelumnya | — |

---

## BR-APR — Approval & Workflow

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-APR-01** | Hanya pengguna dengan role `guru` atau `admin` yang dapat menyetujui atau menolak peminjaman | HTTP 403 Forbidden |
| **BR-APR-02** | Guru/admin harus menyertakan **alasan penolakan** yang wajib diisi saat menolak peminjaman (minimal 10 karakter) | HTTP 422 Unprocessable Entity |
| **BR-APR-03** | Catatan saat approve bersifat **opsional** | — |
| **BR-APR-04** | Hanya peminjaman berstatus `pending` yang dapat di-approve atau di-reject | HTTP 409 Conflict |
| **BR-APR-05** | Timestamp approval (`approved_at`) dan identitas approver (`approved_by`) wajib dicatat | — |
| **BR-APR-06** | Timestamp rejection (`rejected_at`) dan alasan (`rejection_reason`) wajib dicatat | — |
| **BR-APR-07** | Approval peminjaman tidak dapat dibatalkan setelah dilakukan | — |
| **BR-APR-08** | Penolakan peminjaman tidak dapat diubah menjadi approval setelah dilakukan | — |

---

## BR-RET — Pengembalian

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-RET-01** | Proses pengembalian dimulai dengan siswa meng-upload foto selfie pengembalian | — |
| **BR-RET-02** | Hanya guru/admin yang dapat mengkonfirmasi (approve) pengembalian barang | HTTP 403 Forbidden |
| **BR-RET-03** | Hanya peminjaman berstatus `returning` yang dapat dikonfirmasi pengembaliannya | HTTP 409 Conflict |
| **BR-RET-04** | Saat mengkonfirmasi pengembalian, guru **wajib mengisi kondisi barang** saat kembali untuk setiap item | HTTP 422 Unprocessable Entity |
| **BR-RET-05** | Kondisi barang saat kembali (`item_condition_in`) dicatat di tabel `borrowing_items` | — |
| **BR-RET-06** | Timestamp konfirmasi pengembalian (`return_approved_at`) dan identitas approver wajib dicatat | — |
| **BR-RET-07** | Stok barang bertambah sejumlah `returned_quantity` per item setelah pengembalian dikonfirmasi | — |
| **BR-RET-08** | `returned_quantity` tidak boleh melebihi `quantity` yang dipinjam | HTTP 422 Unprocessable Entity |

---

## BR-LOG — Log & Audit Trail

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-LOG-01** | Setiap aksi berikut **wajib dicatat** ke `activity_logs`: login, logout, create barang, update barang, delete barang, create kategori, update kategori, delete kategori, buat peminjaman, approve peminjaman, reject peminjaman, cancel peminjaman, upload foto, approve return, create user, update user, nonaktifkan user | — |
| **BR-LOG-02** | Setiap log wajib mencatat: `action` (kode aksi), `description` (teks human-readable), `user_id`, `subject_type`, `subject_id`, `ip_address`, `created_at` | — |
| **BR-LOG-03** | Log **wajib menyimpan state sebelum dan sesudah** perubahan data dalam kolom `properties` (JSON format) | — |
| **BR-LOG-04** | Log aktivitas **tidak dapat dihapus** oleh siapapun termasuk admin | HTTP 403 Forbidden |
| **BR-LOG-05** | Log aktivitas tidak dapat diubah setelah dibuat (immutable) | — |
| **BR-LOG-06** | Jika user yang melakukan aksi sudah dihapus/nonaktif, `user_id` di log tetap ada (foreign key `ON DELETE SET NULL`) | — |

---

## BR-DAT — Integritas Data

| ID | Aturan | Konsekuensi Pelanggaran |
|---|---|---|
| **BR-DAT-01** | Data riwayat peminjaman (transaksi yang sudah selesai, ditolak, atau dibatalkan) **tidak boleh dihapus** dari database | — |
| **BR-DAT-02** | Foto selfie (bukti peminjaman dan pengembalian) **tidak boleh dihapus** dari storage maupun database | — |
| **BR-DAT-03** | Semua kolom timestamp (`created_at`, `updated_at`, `approved_at`, dsb.) harus diisi oleh sistem, bukan user | — |
| **BR-DAT-04** | Foreign key constraint harus ditegakkan di level database untuk menjaga integritas relasi | — |
| **BR-DAT-05** | Operasi yang mempengaruhi lebih dari satu tabel sekaligus (seperti approve yang mengubah status + stok + log) harus dalam satu **database transaction** | — |
| **BR-DAT-06** | Jika terjadi error dalam transaksi database, semua perubahan dalam transaksi tersebut harus di-rollback | — |

---

## Ringkasan Business Rules

| Kategori | Jumlah Rule |
|---|---|
| Autentikasi & Otorisasi | 10 |
| Manajemen Pengguna | 6 |
| Manajemen Barang | 10 |
| Manajemen Kategori | 3 |
| Peminjaman | 14 |
| Foto & Upload | 10 |
| Stok & Inventaris | 8 |
| Approval & Workflow | 8 |
| Pengembalian | 8 |
| Log & Audit Trail | 6 |
| Integritas Data | 6 |
| **TOTAL** | **89 Business Rules** |

---

## Status Flow State Machine

```
                    ┌─────────────────────────────────────┐
                    │   Siswa membuat pengajuan            │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                              ┌─────────┐
                              │ PENDING │◄─────────────────────────────────────┐
                              └────┬────┘                                      │
                                   │                                           │
                    ┌──────────────┼──────────────────┐                        │
                    │              │                  │                        │
                    ▼              ▼                  ▼                        │
              ┌──────────┐  ┌──────────┐   ┌────────────┐                     │
              │ APPROVED │  │ REJECTED │   │ CANCELLED  │  ← Terminal States  │
              └────┬─────┘  └──────────┘   └────────────┘                     │
                   │                                                           │
                   │  Siswa upload foto pengembalian                          │
                   ▼                                                           │
              ┌───────────┐                                                    │
              │ RETURNING │                                                    │
              └─────┬─────┘                                                   │
                    │                                                           │
                    │  Guru konfirmasi pengembalian                            │
                    ▼                                                           │
              ┌──────────┐                                                     │
              │ RETURNED │  ← Terminal State                                   │
              └──────────┘                                                     │
                                                                               │
 CATATAN:                                                                      │
 - PENDING → APPROVED  : Guru approve                                          │
 - PENDING → REJECTED  : Guru reject                                           │
 - PENDING → CANCELLED : Siswa cancel                                          │
 - APPROVED → RETURNING: Siswa upload foto return                              │
 - RETURNING → RETURNED: Guru konfirmasi return                                │
 - Semua terminal state TIDAK DAPAT berubah kembali ───────────────────────────┘
```

---

## Aturan Prioritas Konflik

Jika dua aturan tampak bertentangan, gunakan urutan prioritas berikut:

1. **Keamanan** (BR-AUTH) > segalanya
2. **Integritas data** (BR-DAT) > kenyamanan pengguna
3. **Audit trail** (BR-LOG) > performa
4. **Stok non-negatif** (BR-STK-01) > kecepatan proses
