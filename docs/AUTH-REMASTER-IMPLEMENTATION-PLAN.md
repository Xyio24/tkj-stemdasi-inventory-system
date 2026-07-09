# AUTH-REMASTER-IMPLEMENTATION-PLAN.md

## Inventory TKJ — Auth System Remaster

> Dokumen ini mendefinisikan rencana implementasi lengkap untuk sistem autentikasi baru.
> Mencakup registrasi mandiri siswa, login dual-mode (Google + email/password),
> Google account binding, manajemen profil, dan approval sistem oleh admin.

---

## 1. Latar Belakang & Masalah

### Kondisi Saat Ini
- Login hanya via Google OAuth
- Setiap akun Google yang valid **otomatis terdaftar** saat pertama login
- Tidak ada filter — siapapun bisa akses sistem
- Tidak ada halaman profil user
- Tidak ada nomor absen siswa

### Masalah yang Diselesaikan
- Sistem terbuka untuk semua orang
- Siswa tidak bisa mendaftar sendiri dengan data yang terstruktur
- Tidak ada approval workflow untuk akun baru
- User tidak bisa mengelola profilnya sendiri

---

## 2. Keputusan Desain

| Aspek | Keputusan |
|---|---|
| **Register** | Form manual: nama, email, password, kelas (aktif), nomor absen |
| **Status setelah register** | `pending` — harus di-approve admin dulu |
| **Login mode** | Dual: Google OAuth **atau** email + password |
| **Google binding** | Bisa di-bind dari halaman profil. Setelah bind, password tetap bisa dipakai |
| **Foto profil default** | Generated: inisial nama + background warna dari hash email (tidak perlu file) |
| **Upload foto profil** | User bisa upload foto custom dari halaman profil |
| **Nomor absen** | Unik per kelas (bukan global) |
| **Kelas saat register** | Hanya kelas dari angkatan yang aktif |
| **Admin/Guru register** | Tidak lewat form — dibuat manual via seeder/tinker |
| **Approval** | Admin approve/reject di halaman Users (tab "Pending") |

---

## 3. Perubahan Database

### 3.1 Kolom Baru di Tabel `users`

| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `status` | ENUM | No | `pending` | `pending`, `active`, `blocked` |
| `absen_number` | TINYINT UNSIGNED | Yes | NULL | Nomor absen, unik per kelas |
| `avatar_type` | ENUM | No | `generated` | `generated` atau `upload` |
| `registration_notes` | TEXT | Yes | NULL | Catatan dari admin saat approve/reject |
| `approved_by` | FK → users.id | Yes | NULL | Admin yang approve |
| `approved_at` | TIMESTAMP | Yes | NULL | Waktu approve |

> **Catatan:** Kolom `is_active` yang sudah ada akan digantikan oleh `status` yang lebih ekspresif.
> Migration akan mengisi `status = 'active'` untuk semua user lama yang `is_active = true`,
> dan `status = 'blocked'` untuk yang `is_active = false`.

### 3.2 Unique Constraint Baru

```sql
UNIQUE (class_id, absen_number)
-- Nomor absen unik per kelas, bukan global
```

### 3.3 Perubahan `google_id`
Tidak ada perubahan struktur. `google_id` tetap nullable — user yang register via form tidak punya google_id sampai di-bind.

---

## 4. Perubahan Backend

### 4.1 Migration Baru

**File:** `add_auth_remaster_columns_to_users_table.php`

```
- Tambah kolom: status, absen_number, avatar_type, registration_notes, approved_by, approved_at
- Isi data lama: status = 'active' jika is_active = true, 'blocked' jika false
- Tambah unique constraint: (class_id, absen_number)
- Tambah index: status
```

### 4.2 Update Model `User`

```
- Tambah kolom baru ke $fillable
- Tambah cast: status (enum), avatar_type (enum)
- Tambah relasi: approvedBy() → belongsTo(User)
- Tambah accessor: getAvatarUrlAttribute() — return upload URL atau generated URL
- Hapus is_active dari logika auth (ganti dengan status check)
```

### 4.3 Endpoint Baru di `AuthController`

#### `POST /api/auth/register`
- Validasi: nama, email (unique), password (min 8), class_id (exists, kelas aktif), absen_number (unique per kelas)
- Buat user dengan status `pending`
- Kirim response sukses — tidak langsung login
- Tidak perlu email verification (sekolah context)

#### `POST /api/auth/login`
- Input: email + password
- Cek status = `active` (bukan pending/blocked)
- Return Sanctum token
- Log: `auth.login`

#### `POST /api/auth/google` (modifikasi)
- Cari user by `google_id` DULU → jika ketemu, langsung login (menangani akun yang di-bind ke Google dengan email berbeda dari email sistem)
- Jika tidak ketemu by `google_id`, cari by `email`
- Jika email belum ada → **tolak dengan pesan** "Email ini belum terdaftar. Silakan daftar terlebih dahulu." (tidak lagi auto-create)
- Jika email ada tapi `google_id` null → **bind** google_id ke akun, lalu login
- Jika email ada dan `google_id` sudah match → login biasa
- Tetap cek status = `active`

#### `POST /api/auth/bind-google` (protected)
- User yang sudah login (email/password) bisa bind akunnya ke Google
- Input: Google ID token
- **Constraint email**: email dari Google token **harus sama** dengan email user yang sedang login — mencegah user A menghubungkan akun Google milik user B ke akunnya
- Validasi: google_id dari token belum dipakai akun lain
- Update `google_id` di record user

#### `DELETE /api/auth/unbind-google` (protected)
- Lepas binding Google dari akun
- Hanya bisa jika user punya password (tidak boleh unbind jika tidak ada password — akan lockout)

### 4.4 Endpoint Baru di `UserController`

#### `GET /api/users/pending` (admin only)
- List user dengan status `pending`
- Untuk ditampilkan di tab "Menunggu Persetujuan" di halaman Users

#### `PATCH /api/users/{user}/approve` (admin only)
- Set status = `active`
- Isi `approved_by` dan `approved_at`
- Log: `user.approved`

#### `PATCH /api/users/{user}/reject` (admin only)
- Set status = `blocked` (atau hapus record jika belum pernah aktif)
- Isi `registration_notes` dengan alasan penolakan
- Log: `user.rejected`

#### `PATCH /api/users/{user}/block` (admin only)
- Set status = `blocked`
- Revoke semua token aktif milik user
- Log: `user.blocked`

#### `PATCH /api/users/{user}/unblock` (admin only)
- Set status = `active`
- Log: `user.unblocked`

### 4.5 Endpoint Profil (`ProfileController` baru)

#### `GET /api/profile` (protected)
- Return data profil user yang sedang login (dengan relasi class + academic_year)

#### `PATCH /api/profile` (protected)
- Update: nama, email, password (dengan current_password verification)
- Jika email berubah → cek unique

#### `POST /api/profile/avatar` (protected)
- Upload foto profil
- Simpan ke `storage/app/public/avatars/{user_id}/`
- Update `avatar` dan `avatar_type = 'upload'`

#### `DELETE /api/profile/avatar` (protected)
- Hapus foto upload
- Reset `avatar` ke null, `avatar_type = 'generated'`

### 4.6 Update `RoleMiddleware`

Saat ini middleware cek `is_active`. Update untuk cek `status = 'active'`.

---

## 5. Perubahan Frontend

### 5.1 Halaman Baru

#### `/register` — Halaman Registrasi Siswa
- Form: nama lengkap, email, password, konfirmasi password
- Dropdown: angkatan (hanya aktif) → setelah pilih angkatan, dropdown kelas muncul (filter per angkatan)
- Input: nomor absen
- Setelah submit: tampilkan halaman sukses "Akun kamu sedang menunggu persetujuan admin"
- Link ke halaman login

#### `/dashboard/profile` — Halaman Profil User
- Tampilkan: foto profil (generated/upload), nama, email, kelas, angkatan, nomor absen
- Form edit: nama, email, password (dengan current_password)
- Upload/hapus foto profil
- Section "Google Account": tampilkan status binding, tombol Bind/Unbind Google

### 5.2 Halaman yang Dimodifikasi

#### `/login` — Tambah Form Email/Password
- Saat ini hanya ada tombol "Login dengan Google"
- Tambah form email + password di bawah (dengan separator "atau")
- Tambah link ke halaman register

#### `/dashboard/users` — Tambah Tab "Menunggu Persetujuan"
- Tab baru di paling kiri: "Menunggu Persetujuan" dengan badge counter
- Setiap row di tab ini punya tombol Approve dan Reject
- Reject memunculkan input alasan penolakan

### 5.3 Komponen Baru

#### `GeneratedAvatar`
```
Props: name, email, size
Output: div dengan background warna (dari hash email) dan inisial nama
Warna: 8 warna predefined, dipilih berdasarkan charCode email[0] % 8
```

#### Navigasi
- Tambah link "Profil" di sidebar (semua role)
- Tambah link ke `/dashboard/profile`

### 5.4 Update Auth Store (`authStore`)

```
- Tambah aksi: loginWithPassword(email, password)
- Update: googleLogin() — handle case "belum terdaftar"
- Tambah: bindGoogle(token)
- Update tipe User: tambah status, absen_number, avatar_type, student_class lengkap
```

---

## 6. Alur Lengkap Per Skenario

### 6.1 Registrasi Siswa Baru
```
Siswa buka /register
→ Isi form (nama, email, password, angkatan aktif, kelas, absen)
→ Submit → POST /api/auth/register
→ Backend: buat user status=pending
→ Frontend: tampilkan halaman "Menunggu Persetujuan"
→ Admin buka /dashboard/users → tab "Menunggu Persetujuan"
→ Admin klik Approve → PATCH /api/users/{id}/approve
→ Siswa bisa login
```

### 6.2 Login Email + Password
```
User buka /login → isi email + password
→ POST /api/auth/login
→ Backend: cek password, cek status=active
→ Return token → simpan di authStore → redirect /dashboard
```

### 6.3 Login Google (akun sudah terdaftar)
```
User klik "Login dengan Google" → Google popup → dapat ID token
→ POST /api/auth/google dengan token
→ Backend: verifikasi token → cari email → cek google_id match → cek status=active
→ Return token → simpan di authStore → redirect /dashboard
```

### 6.4 Login Google (akun belum di-bind)
```
User klik "Login dengan Google" → Google popup → dapat ID token
→ POST /api/auth/google
→ Backend: email ditemukan tapi google_id = null
→ Backend: bind google_id ke akun → login seperti biasa
→ Return token
```

### 6.5 Login Google (email belum terdaftar)
```
User klik "Login dengan Google"
→ POST /api/auth/google
→ Backend: email tidak ditemukan di DB
→ Return 403: "Email ini belum terdaftar. Silakan daftar terlebih dahulu."
→ Frontend: tampilkan error + link ke /register
```

### 6.6 Bind Google dari Profil
```
User login dengan email/password → buka /dashboard/profile
→ Section "Google Account" → klik "Hubungkan ke Google"
→ Google popup → dapat ID token
→ POST /api/auth/bind-google dengan token
→ Backend: verifikasi token → cek google_id belum dipakai → update google_id
→ Frontend: tampilkan "Akun Google berhasil dihubungkan"
```

---

## 7. Urutan Implementasi

### Phase 1 — Backend Foundation
1. Migration: kolom baru di users + unique constraint absen
2. Update Model User
3. `AuthController`: endpoint register + login email/password
4. `AuthController`: modifikasi google login (tidak auto-create)
5. Update `RoleMiddleware` untuk pakai `status`

### Phase 2 — Backend Admin & Profile
6. `UserController`: endpoint approve, reject, block, unblock
7. `ProfileController`: GET profile, PATCH profile, upload/delete avatar
8. `AuthController`: bind-google + unbind-google

### Phase 3 — Frontend Auth
9. Update `authStore`: tambah loginWithPassword, update types
10. Update halaman Login: tambah form email/password
11. Buat halaman Register
12. Komponen `GeneratedAvatar`

### Phase 4 — Frontend Admin & Profile
13. Update `UserList`: tambah tab "Menunggu Persetujuan" + tombol approve/reject
14. Buat halaman Profil (`/dashboard/profile`)
15. Update routing
16. Update navigasi sidebar

---

## 8. Catatan Teknis Penting

### Generated Avatar
Tidak menggunakan file — di-render sebagai HTML/CSS murni:
```
warna = COLORS[sum(charCodes(email)) % COLORS.length]
inisial = kata pertama[0] + (kata kedua ada ? kata kedua[0] : '')
```

### Password Hashing
Laravel sudah handle via `bcrypt` karena `password` di-cast `hashed` di model.

### Token Revocation saat Block
Saat admin blokir user, semua Sanctum token user tersebut harus di-delete:
```php
$user->tokens()->delete();
```

### Backward Compatibility
User yang sudah ada (login Google sebelumnya) akan di-migrate ke `status = 'active'` otomatis. Mereka tidak perlu approve ulang.

### Absen Number Validation
Validasi di backend menggunakan Rule::unique dengan scope:
```php
Rule::unique('users')->where(fn($q) => $q->where('class_id', $request->class_id))
```
