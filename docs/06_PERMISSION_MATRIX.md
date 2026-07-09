# 06 — PERMISSION MATRIX
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

> Dokumen ini mendefinisikan matriks otorisasi akses ke setiap rute API (endpoint) berdasarkan role pengguna.

---

## 1. Kode Hak Akses (Access Level)

| Simbol | Keterangan | Detail |
|---|---|---|
| **✅** | **Allowed** | Akses penuh (dapat membaca, menulis, mengubah, atau menghapus) |
| **❌** | **Denied** | Akses ditolak sepenuhnya (mengembalikan HTTP 403 Forbidden) |
| **Own** | **Owner Only** | Akses diizinkan **hanya** jika data tersebut milik user yang bersangkutan |

---

## 2. Matriks Rute API (Endpoint Matrix)

### Autentikasi
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `POST` | `/api/auth/google` | ✅ | ✅ | ✅ | Guest (Public) |
| `POST` | `/api/auth/logout` | ✅ | ✅ | ✅ | `auth:sanctum` |
| `GET` | `/api/auth/me` | ✅ | ✅ | ✅ | `auth:sanctum` |

### Katalog Barang & Kategori (Umum)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `GET` | `/api/items` | ✅ | ✅ | ✅ | `auth:sanctum` |
| `GET` | `/api/items/{id}` | ✅ | ✅ | ✅ | `auth:sanctum` |
| `GET` | `/api/categories` | ✅ | ✅ | ✅ | `auth:sanctum` |
| `GET` | `/api/categories/{id}` | ✅ | ✅ | ✅ | `auth:sanctum` |

### Manajemen Kategori & Barang (Write Operations)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `POST` | `/api/categories` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `PUT` | `/api/categories/{id}` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `DELETE` | `/api/categories/{id}` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `POST` | `/api/items` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `PUT` | `/api/items/{id}` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `DELETE` | `/api/items/{id}` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `POST` | `/api/items/{id}/images` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `DELETE` | `/api/items/{id}/images/{imgId}` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |

### Alur Transaksi Peminjaman (Siswa)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `POST` | `/api/borrowings` | ✅ | ❌ | ❌ | `auth:sanctum`, `role:siswa` |
| `PATCH` | `/api/borrowings/{id}/cancel` | **Own** | ❌ | ❌ | `auth:sanctum`, `role:siswa`, Policy |
| `POST` | `/api/borrowings/{id}/photos` | **Own** | ❌ | ❌ | `auth:sanctum`, `role:siswa`, Policy |

### Manajemen Peminjaman (Guru & Admin)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `GET` | `/api/borrowings` | **Own** | ✅ | ✅ | `auth:sanctum` (Siswa terfilter via Query) |
| `GET` | `/api/borrowings/{id}` | **Own** | ✅ | ✅ | `auth:sanctum`, Policy |
| `PATCH` | `/api/admin/borrowings/{id}/approve` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `PATCH` | `/api/admin/borrowings/{id}/reject` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `PATCH` | `/api/admin/borrowings/{id}/approve-return`| ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |

### Dashboard & Logs (Guru & Admin)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `GET` | `/api/dashboard` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |
| `GET` | `/api/activity-logs` | ❌ | ✅ | ✅ | `auth:sanctum`, `role:guru,admin` |

### Manajemen Pengguna (Admin Only)
| Method | Endpoint | Siswa | Guru | Admin | Middleware / Guard |
|---|---|:---:|:---:|:---:|---|
| `GET` | `/api/users` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `POST` | `/api/users` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `GET` | `/api/users/{id}` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `PUT` | `/api/users/{id}` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |
| `PATCH` | `/api/users/{id}/toggle-active` | ❌ | ❌ | ✅ | `auth:sanctum`, `role:admin` |

---

## 3. Matriks Menu & Elemen UI (Frontend)

Keamanan UI di sisi React (untuk menyembunyikan/menampilkan tombol atau halaman).

| Menu / Halaman | Elemen UI | Siswa | Guru | Admin |
|---|---|:---:|:---:|:---:|
| **Katalog Barang** | Tombol "Pinjam Barang" | ✅ | ❌ | ❌ |
| | Tombol "Tambah/Edit/Hapus" | ❌ | ✅ | ✅ (Hapus Only Admin) |
| **Peminjaman Saya** | Halaman Daftar Transaksi Sendiri | ✅ | ❌ | ❌ |
| | Tombol "Upload Selfie Bukti" | ✅ | ❌ | ❌ |
| | Tombol "Batalkan" (Pending) | ✅ | ❌ | ❌ |
| **Persetujuan Masuk** | Halaman Daftar Request Pending | ❌ | ✅ | ✅ |
| | Tombol "Setujui" / "Tolak" | ❌ | ✅ | ✅ |
| **Pengembalian Masuk**| Halaman Daftar Request Returning | ❌ | ✅ | ✅ |
| | Form Cek Kondisi & Tombol Confirm| ❌ | ✅ | ✅ |
| **Dashboard** | Kartu Ringkasan & Grafik Statistik | ❌ | ✅ | ✅ |
| **Log Sistem** | Halaman Audit Trail | ❌ | ✅ | ✅ |
| **Pengguna** | Halaman CRUD User | ❌ | ❌ | ✅ |
