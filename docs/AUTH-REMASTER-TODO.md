# AUTH-REMASTER-TODO.md

> Checklist implementasi Auth System Remaster.
> Kerjakan berurutan per phase. Jangan lanjut ke phase berikutnya sebelum phase sebelumnya selesai.
> Lihat detail teknis di: `docs/AUTH-REMASTER-IMPLEMENTATION-PLAN.md`

---

## Phase 1 — Backend Foundation ✅ SELESAI

### Database & Model

- [x] **Migration baru** `add_auth_remaster_columns_to_users_table`
  - Tambah kolom `status` ENUM(`pending`, `active`, `blocked`) default `pending`
  - Tambah kolom `absen_number` TINYINT UNSIGNED nullable
  - Tambah kolom `avatar_type` ENUM(`generated`, `upload`) default `generated`
  - Tambah kolom `registration_notes` TEXT nullable
  - Tambah kolom `approved_by` FK → `users.id` nullable
  - Tambah kolom `approved_at` TIMESTAMP nullable
  - Isi data lama: `status = 'active'` untuk `is_active = true`, `'blocked'` untuk `false`
  - Tambah UNIQUE constraint `(class_id, absen_number)`
  - Tambah index `status`

- [x] **Update Model `User`**
  - Tambah kolom baru ke `$fillable`
  - Tambah cast `status` dan `avatar_type`
  - Tambah relasi `approvedBy()` → `belongsTo(User::class, 'approved_by')`
  - Ganti pengecekan `is_active` → `status === 'active'` di seluruh model/logic

- [x] **Update `RoleMiddleware`**
  - Ganti `$user->is_active` → `$user->status === 'active'`

### AuthController — Endpoint Baru

- [x] **`POST /api/auth/register`**
  - Validasi: nama (required), email (unique), password (min:8, confirmed), class_id (exists, kelas aktif), absen_number (unik per class_id)
  - Buat user: status = `pending`, avatar_type = `generated`
  - Response: sukses tanpa token (belum bisa login)
  - Activity log: `auth.register`

- [x] **`POST /api/auth/login`** (endpoint baru, bukan Google)
  - Validasi: email, password
  - Cek `status = 'active'` (tolak pending & blocked dengan pesan berbeda)
  - Verifikasi password dengan `Hash::check`
  - Return Sanctum token
  - Activity log: `auth.login`

- [x] **Modifikasi `POST /api/auth/google`**
  - Jika email **tidak ada** di DB → tolak 403 "Belum terdaftar"
  - Jika email ada, `google_id = null` → auto-bind google_id lalu login
  - Jika email ada, `google_id` match → login biasa
  - Tetap cek `status = 'active'`
  - Hapus logika auto-create user baru

- [x] **`POST /api/auth/bind-google`** (protected, semua role)
  - Input: Google ID token
  - Verifikasi token ke Google
  - Cek google_id dari token belum dipakai user lain
  - Update `google_id` user yang sedang login
  - Activity log: `auth.google_bound`

- [x] **`DELETE /api/auth/unbind-google`** (protected)
  - Cek user punya password sebelum unbind (jika tidak ada password, tolak)
  - Set `google_id = null`
  - Activity log: `auth.google_unbound`

---

## Phase 2 — Backend Admin & Profile ✅ SELESAI

### UserController — Endpoint Baru

- [x] **`GET /api/users?status=pending`** — filter pending di endpoint yang sudah ada
  - Atau buat endpoint terpisah `GET /api/users/pending` (admin only)

- [x] **`PATCH /api/users/{user}/approve`** (admin only)
  - Set `status = 'active'`
  - Isi `approved_by = Auth::id()`, `approved_at = now()`
  - Activity log: `user.approved`

- [x] **`PATCH /api/users/{user}/reject`** (admin only)
  - Input: `rejection_reason` (required, min:10)
  - Isi `registration_notes = rejection_reason`
  - Hapus record user (karena belum pernah aktif) atau set `status = 'blocked'`
  - Activity log: `user.rejected`

- [x] **`PATCH /api/users/{user}/block`** (admin only)
  - Set `status = 'blocked'`
  - Revoke semua token: `$user->tokens()->delete()`
  - Activity log: `user.blocked`

- [x] **`PATCH /api/users/{user}/unblock`** (admin only)
  - Set `status = 'active'`
  - Activity log: `user.unblocked`

- [x] **Update `PATCH /api/users/{user}`** (admin only)
  - Tambah field yang bisa diedit admin: `absen_number`, `class_id` (override kelas)
  - Validasi `absen_number` unik per `class_id` (exclude user itu sendiri)

### ProfileController — Baru

- [x] **Buat `ProfileController`**

- [x] **`GET /api/profile`** (protected)
  - Return user dengan relasi `studentClass.academicYear`
  - Include `avatar_url` (generated atau upload path)

- [x] **`PATCH /api/profile`** (protected)
  - Bisa update: `name`, `email`, `password`
  - Jika update password: wajib sertakan `current_password`, verifikasi dulu
  - Jika update email: cek unique (exclude diri sendiri)
  - Activity log: `profile.updated`

- [x] **`POST /api/profile/avatar`** (protected)
  - Upload file: `mimes:jpeg,jpg,png,webp`, max 5MB
  - Simpan ke `public/avatars/{user_id}/`
  - Update `avatar = path`, `avatar_type = 'upload'`
  - Hapus file lama jika ada
  - Activity log: `profile.avatar_uploaded`

- [x] **`DELETE /api/profile/avatar`** (protected)
  - Hapus file dari storage
  - Set `avatar = null`, `avatar_type = 'generated'`
  - Activity log: `profile.avatar_deleted`

### Routes

- [x] **Update `routes/api.php`**
  - Tambah: `POST /auth/register` (public)
  - Tambah: `POST /auth/login` (public)
  - Tambah: `POST /auth/bind-google` (protected)
  - Tambah: `DELETE /auth/unbind-google` (protected)
  - Tambah: `GET|PATCH /profile` (protected)
  - Tambah: `POST|DELETE /profile/avatar` (protected)
  - Tambah: `PATCH /users/{user}/approve` (admin)
  - Tambah: `PATCH /users/{user}/reject` (admin)
  - Tambah: `PATCH /users/{user}/block` (admin)
  - Tambah: `PATCH /users/{user}/unblock` (admin)

---

## Phase 3 — Frontend Auth ✅ SELESAI

### API Layer

- [x] **Update `api/auth.ts`**
  - Tambah: `registerUser(data)` → POST `/auth/register`
  - Tambah: `loginWithPassword(email, password)` → POST `/auth/login`
  - Tambah: `bindGoogle(token)` → POST `/auth/bind-google`
  - Tambah: `unbindGoogle()` → DELETE `/auth/unbind-google`

- [x] **Buat `api/profile.ts`**
  - `getProfile()` → GET `/profile`
  - `updateProfile(data)` → PATCH `/profile`
  - `uploadAvatar(formData)` → POST `/profile/avatar`
  - `deleteAvatar()` → DELETE `/profile/avatar`

- [x] **Update tipe `User` di `store/authStore.ts`**
  - Tambah: `status`, `absen_number`, `avatar_type`, `approved_at`
  - Update `student_class` include `academic_year`

### Auth Store

- [x] **Update `store/authStore.ts`**
  - Tambah aksi `loginWithPassword(email, password)`
  - Update tipe `User`
  - Handle error "pending" dan "blocked" dengan pesan berbeda

### Komponen

- [x] **Buat komponen `GeneratedAvatar`** di `components/common/GeneratedAvatar.tsx`
  - Props: `name: string`, `email: string`, `size?: number`
  - Warna background: hash dari email → pilih dari 8 warna
  - Inisial: 1-2 huruf dari nama

### Halaman

- [x] **Update halaman Login** (`pages/auth/Login.tsx`)
  - Tambah form email + password (dengan separator "atau")
  - Tambah link ke `/register`
  - Handle error Google login "belum terdaftar" → tampilkan pesan + link register
  - Handle error "pending" → pesan berbeda
  - Handle error "blocked" → pesan berbeda

- [x] **Buat halaman Register** (`pages/auth/Register.tsx`)
  - Form: nama lengkap, email, password, konfirmasi password
  - Dropdown angkatan (hanya aktif) → cascade ke dropdown kelas
  - Input nomor absen
  - Submit → tampilkan halaman sukses "Menunggu persetujuan admin"
  - Link kembali ke login

### Routing

- [x] **Update `routes/index.tsx`**
  - Tambah route `/register` di GuestLayout
  - Tambah route `/dashboard/profile` di DashboardLayout (Phase 4)

---

## Phase 4 — Frontend Admin & Profile ✅ SELESAI

### Halaman Users (Admin)

- [x] **Update `UserList.tsx`**
  - Tambah tab "Menunggu Persetujuan" di posisi paling kiri
  - Di tab ini: tampilkan nama, email, kelas yang dipilih, tanggal daftar
  - Tombol "Setujui" → panggil approve endpoint
  - Tombol "Tolak" → muncul input alasan → panggil reject endpoint
  - Ganti tombol "Blokir/Aktifkan" yang lama → pakai endpoint block/unblock baru
  - Tambah field `absen_number` yang bisa diedit admin

### Halaman Profil

- [x] **Buat halaman Profil** (`pages/profile/ProfilePage.tsx`)
  - Section foto profil: tampilkan `GeneratedAvatar` atau foto upload
  - Tombol upload foto / hapus foto
  - Form edit: nama, email
  - Form ganti password: current_password, new_password, konfirmasi
  - Section "Akun Google":
    - Jika belum di-bind: tampilkan "Belum terhubung" + tombol "Hubungkan ke Google"
    - Jika sudah di-bind: tampilkan email Google + tombol "Putuskan Hubungan"

### Navigasi

- [x] **Update `DashboardLayout.tsx`**
  - Tambah link "Profil Saya" di sidebar (semua role)
  - Avatar di sidebar pakai GeneratedAvatar

### Routing

- [x] **Update `routes/index.tsx`**
  - Tambah route `/dashboard/profile`

---

## Catatan

- Kerjakan phase secara berurutan
- Setiap endpoint backend harus ditest manual sebelum lanjut ke frontend
- User lama yang sudah ada tidak perlu approve ulang (sudah di-migrate ke `status = 'active'`)
- Setelah Phase 1 selesai, pastikan login Google yang lama masih berfungsi untuk user yang sudah ada
