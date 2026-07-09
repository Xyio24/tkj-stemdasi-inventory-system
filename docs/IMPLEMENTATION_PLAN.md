# IMPLEMENTATION_PLAN.md — Inventory TKJ

> Rencana implementasi teknis yang terstruktur. Ikuti urutan fase ini untuk menghindari dependensi yang tertunda.
> Setiap tugas diberi kode untuk referensi mudah.

---

## Ringkasan Fase

| Fase | Nama | Fokus | Estimasi |
|---|---|---|---|
| 0 | Setup & Fondasi | Konfigurasi tooling, fix anomali | 1 hari |
| 1 | Backend Core | Database, auth, model | 3-4 hari |
| 2 | Backend API | Controller, service, API endpoints | 4-5 hari |
| 3 | Frontend Core | Layout, routing, auth | 2-3 hari |
| 4 | Frontend Fitur | Pages per modul | 5-7 hari |
| 5 | Integrasi & Polish | Testing, error handling, UX | 2-3 hari |
| 6 | Deployment | Server setup, CI/CD | 1-2 hari |

---

## FASE 0 — Setup & Perbaikan Anomali

> Selesaikan semua masalah setup sebelum menulis kode fitur.

### Backend

**[B0-01] Perbaiki struktur routes**
- Buat `backend/routes/api.php`
- Daftarkan di `bootstrap/app.php`:
  ```php
  ->withRouting(
      api: __DIR__.'/../routes/api.php',
      web: __DIR__.'/../routes/web.php',
      commands: __DIR__.'/../routes/console.php',
      health: '/up',
  )
  ```

**[B0-02] Generate APP_KEY**
```bash
php artisan key:generate
```

**[B0-03] Install Laravel Sanctum**
```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

**[B0-04] Install Google API Client**
```bash
composer require google/apiclient
```

**[B0-05] Konfigurasi CORS untuk React**
- Konfigurasi `config/cors.php`
- Set `allowed_origins` ke `http://localhost:5173`

**[B0-06] Setup .env**
- Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`
- Konfigurasi database MySQL

### Frontend

**[F0-01] Pindahkan shadcn output ke lokasi yang benar**
- Isi `src/lib/utils.ts` dengan konten dari `@/lib/utils.ts`
- Pindahkan `@/components/ui/button.tsx` → `src/components/ui/button.tsx`
- Hapus folder `@/` setelah konten dipindahkan
- Update `components.json` jika perlu

**[F0-02] Bersihkan template default Vite**
- Kosongkan/replace `src/App.tsx`
- Hapus konten CSS default dari `src/index.css` (baris 8-80, sisakan shadcn tokens)
- Hapus `src/App.css`
- Hapus `src/assets/react.svg`

**[F0-03] Setup environment variable frontend**
- Buat `frontend/.env.local`
  ```
  VITE_API_URL=http://localhost:8000/api
  VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  ```

---

## FASE 1 — Backend Core (Database & Model)

> Buat struktur database sebelum menulis satu pun baris API.

### Migrations (urutan penting)

**[B1-01] Modifikasi migration `create_users_table`**
Tambahkan kolom: `google_id`, `avatar`, `role`, `nis_nip`, `phone`, `is_active`.
Password menjadi nullable.

**[B1-02] Buat migration `create_categories_table`**
Kolom: `id`, `name`, `slug`, `description`, timestamps.

**[B1-03] Buat migration `create_items_table`**
Kolom: `id`, `category_id`, `name`, `slug`, `description`, `brand`, `model`, `stock`, `stock_total`, `stock_minimum`, `condition`, `location`, `is_available`, `image`, timestamps.
Foreign key ke categories.

**[B1-04] Buat migration `create_item_images_table`**
Kolom: `id`, `item_id`, `path`, `order`, timestamps.
Foreign key ke items (CASCADE).

**[B1-05] Buat migration `create_borrowings_table`**
Semua kolom sesuai DATABASE_SCHEMA.md.
Foreign keys ke users.

**[B1-06] Buat migration `create_borrowing_items_table`**
Kolom: `id`, `borrowing_id`, `item_id`, `quantity`, `returned_quantity`, `item_condition_out`, `item_condition_in`, `notes`, timestamps.

**[B1-07] Buat migration `create_borrowing_photos_table`**
Kolom sesuai DATABASE_SCHEMA.md.

**[B1-08] Buat migration `create_activity_logs_table`**
Kolom sesuai DATABASE_SCHEMA.md.

**[B1-09] Jalankan semua migration**
```bash
php artisan migrate:fresh
```

### Models

**[B1-10] Update model `User`**
- Tambah fillable: `google_id`, `avatar`, `role`, `nis_nip`, `phone`, `is_active`
- Tambah casts role ke enum
- Password nullable
- Tambah relasi: `borrowings()`, `approvedBorrowings()`, `activityLogs()`

**[B1-11] Buat model `Category`**
- Fillable, slug, relasi `items()`

**[B1-12] Buat model `Item`**
- Fillable, relasi: `category()`, `images()`, `borrowingItems()`
- Accessor: `isLowStock`, `isOutOfStock`

**[B1-13] Buat model `ItemImage`**
- Fillable, relasi `item()`

**[B1-14] Buat model `Borrowing`**
- Fillable, casts status ke enum
- Relasi: `user()`, `approvedBy()`, `returnApprovedBy()`, `items()`, `photos()`
- Accessor: `isOverdue`

**[B1-15] Buat model `BorrowingItem`**
- Fillable, relasi: `borrowing()`, `item()`

**[B1-16] Buat model `BorrowingPhoto`**
- Fillable, relasi: `borrowing()`, `uploadedBy()`

**[B1-17] Buat model `ActivityLog`**
- Fillable, cast `properties` ke array
- Relasi: `user()`

### Seeders

**[B1-18] Buat `AdminSeeder`**
- Buat 1 user admin dan 1 user guru untuk testing

**[B1-19] Buat `CategorySeeder`**
- Buat beberapa kategori sample

**[B1-20] Buat `ItemSeeder`**
- Buat beberapa barang sample per kategori

**[B1-21] Update `DatabaseSeeder`**
- Panggil semua seeder berurutan

```bash
php artisan db:seed
```

### Enum & Helper Classes

**[B1-22] Buat `App\Enums\UserRole`**
```php
enum UserRole: string {
    case SISWA = 'siswa';
    case GURU  = 'guru';
    case ADMIN = 'admin';
}
```

**[B1-23] Buat `App\Enums\BorrowingStatus`**
```php
enum BorrowingStatus: string {
    case PENDING   = 'pending';
    case APPROVED  = 'approved';
    case REJECTED  = 'rejected';
    case RETURNING = 'returning';
    case RETURNED  = 'returned';
    case CANCELLED = 'cancelled';
}
```

**[B1-24] Buat `App\Enums\ItemCondition`**

---

## FASE 2 — Backend API

### Middleware & Auth

**[B2-01] Buat middleware `CheckRole`**
```php
// app/Http/Middleware/CheckRole.php
// Validasi role user dari token Sanctum
// Daftarkan di bootstrap/app.php
```

**[B2-02] Buat `App\Services\GoogleAuthService`**
- Verifikasi Google ID token menggunakan Google API Client
- Ekstrak nama, email, google_id, avatar dari payload

**[B2-03] Buat `App\Http\Controllers\AuthController`**
- `googleLogin()` — verifikasi token, upsert user, return Sanctum token
- `logout()` — hapus token
- `me()` — return user data

**[B2-04] Buat `App\Http\Requests\Auth\GoogleLoginRequest`**

### Fitur Kategori

**[B2-05] Buat `App\Http\Controllers\CategoryController`**
- `index()`, `show()`, `store()`, `update()`, `destroy()`

**[B2-06] Buat `App\Http\Requests\Category\StoreCategoryRequest`**
**[B2-07] Buat `App\Http\Resources\CategoryResource`**

### Fitur Barang

**[B2-08] Buat `App\Http\Controllers\ItemController`**
- `index()` — dengan filter, search, pagination
- `show()` — dengan images
- `store()` — dengan upload foto
- `update()` — dengan upload foto
- `destroy()` — cek peminjaman aktif
- `uploadImage()` — upload galeri
- `deleteImage()` — hapus dari galeri

**[B2-09] Buat `App\Http\Requests\Item\StoreItemRequest`**
**[B2-10] Buat `App\Http\Requests\Item\UpdateItemRequest`**
**[B2-11] Buat `App\Http\Resources\ItemResource`**
**[B2-12] Buat `App\Services\ItemService`**
- Logic CRUD + stok + upload file

### Fitur Peminjaman — Siswa

**[B2-13] Buat `App\Http\Controllers\BorrowingController`**
- `index()` — filter by role (siswa: own, guru/admin: all)
- `show()` — dengan items & photos
- `store()` — buat pengajuan, validasi stok
- `cancel()` — batalkan pending
- `uploadPhoto()` — upload selfie, trigger RETURNING jika type=return

**[B2-14] Buat `App\Http\Requests\Borrowing\StoreBorrowingRequest`**
**[B2-15] Buat `App\Http\Requests\Borrowing\UploadPhotoRequest`**
**[B2-16] Buat `App\Http\Resources\BorrowingResource`**
**[B2-17] Buat `App\Services\BorrowingService`**
- `create()` — validasi stok, generate kode BRW, buat records
- `cancel()` — validasi status, update
- `uploadPhoto()` — simpan file, update status jika return

### Fitur Approval — Guru/Admin

**[B2-18] Buat `App\Http\Controllers\BorrowingAdminController`**
- `approve()` — validasi ulang stok, update status, kurangi stok (dalam transaction)
- `reject()` — update status, simpan alasan
- `approveReturn()` — update status, tambah stok, catat kondisi

**[B2-19] Buat `App\Http\Requests\Borrowing\ApproveBorrowingRequest`**
**[B2-20] Buat `App\Http\Requests\Borrowing\RejectBorrowingRequest`**
**[B2-21] Buat `App\Http\Requests\Borrowing\ApproveReturnRequest`**
**[B2-22] Buat `App\Services\BorrowingApprovalService`**
- Logika approve/reject/approve-return dengan DB::transaction

### Dashboard & Logs

**[B2-23] Buat `App\Http\Controllers\DashboardController`**
- Kumpulkan statistik agregat

**[B2-24] Buat `App\Http\Controllers\ActivityLogController`**
- Daftar log dengan filter & pagination

**[B2-25] Buat `App\Http\Resources\ActivityLogResource`**

### User Management

**[B2-26] Buat `App\Http\Controllers\UserController`**
- CRUD user
- `toggleActive()`

**[B2-27] Buat `App\Http\Requests\User\StoreUserRequest`**
**[B2-28] Buat `App\Http\Resources\UserResource`**

### Activity Log Helper

**[B2-29] Buat `App\Services\ActivityLogService`**
```php
// Dipanggil dari setiap service/controller setelah aksi penting
ActivityLogService::log(
    action: 'borrowing.approved',
    description: "Peminjaman {$borrowing->code} disetujui",
    subject: $borrowing,
    properties: ['before' => [...], 'after' => [...]]
);
```

### Policies (Otorisasi)

**[B2-30] Buat `App\Policies\BorrowingPolicy`**
- `cancel()` — hanya pemilik, status pending
- `view()` — pemilik atau guru/admin
- `approve()`, `reject()`, `approveReturn()` — guru/admin

**[B2-31] Daftarkan policy di `AppServiceProvider`**

### Form Request Base

**[B2-32] Update base `Controller.php`**
- Tambah helper method `successResponse()`, `errorResponse()`, `paginatedResponse()`

---

## FASE 3 — Frontend Core

### Fondasi

**[F3-01] Implementasi `src/lib/utils.ts`**
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**[F3-02] Implementasi `src/lib/axios.ts`**
```ts
// Axios instance dengan baseURL dari env
// Request interceptor: tambahkan Authorization header
// Response interceptor: handle 401 (redirect login), 403, 500
```

**[F3-03] Implementasi `src/lib/queryClient.ts`**
```ts
// TanStack Query QueryClient
// Default staleTime: 5 menit
// Default retry: 1
```

**[F3-04] Implementasi `src/types/index.ts`**
- TypeScript interfaces: `User`, `Category`, `Item`, `Borrowing`, `BorrowingItem`, `BorrowingPhoto`, `ActivityLog`
- Type: `UserRole`, `BorrowingStatus`, `ItemCondition`
- API response types: `ApiResponse<T>`, `PaginatedResponse<T>`

### Auth State

**[F3-05] Implementasi `src/store/authStore.ts`**
- Zustand store: `user`, `token`, `isAuthenticated`
- Actions: `setAuth()`, `clearAuth()`
- Persistensi ke localStorage

**[F3-06] Implementasi `src/api/auth.ts`**
```ts
export const loginWithGoogle = (token: string) => ...
export const logout = () => ...
export const getMe = () => ...
```

**[F3-07] Implementasi `src/hooks/useAuth.ts`**
- Wrap auth store
- Method: `login()`, `logout()`, `isRole()`

### Routing

**[F3-08] Implementasi `src/routes/index.tsx`**
- Setup React Router v7
- Route groups: public, siswa, guru/admin
- Protected route component berdasarkan role

**[F3-09] Implementasi `src/layouts/GuestLayout.tsx`**
- Layout untuk halaman login
- Redirect ke dashboard jika sudah login

**[F3-10] Implementasi `src/layouts/AuthLayout.tsx`**
- Protected route wrapper
- Redirect ke login jika tidak ada token
- Cek `is_active`

**[F3-11] Implementasi `src/layouts/DashboardLayout.tsx`**
- Sidebar navigasi
- Header (user info, logout)
- Main content area
- Responsive: sidebar collapse di mobile

**[F3-12] Update `src/App.tsx`**
- Bungkus dengan `QueryClientProvider`, `BrowserRouter`
- Render routes

**[F3-13] Implementasi komponen shadcn yang dibutuhkan**
Gunakan `npx shadcn add`:
- `button`, `input`, `label`, `form`
- `card`, `badge`, `separator`
- `table`, `dialog`, `sheet`
- `select`, `textarea`, `checkbox`
- `avatar`, `dropdown-menu`, `popover`
- `toast` / Sonner sudah terinstall
- `skeleton`

---

## FASE 4 — Frontend Fitur (Per Modul)

### Modul Auth

**[F4-01] `src/pages/auth/LoginPage.tsx`**
- Google Login Button (Google Sign-In SDK)
- Handle callback token
- Redirect berdasarkan role

**[F4-02] `src/api/auth.ts`** — isi implementasi

### Modul Dashboard

**[F4-03] `src/api/dashboard.ts`** — `getDashboardStats()`

**[F4-04] `src/pages/dashboard/DashboardPage.tsx`**
- Stat cards (Total Barang, Peminjaman Aktif, dll.)
- Grafik peminjaman (recharts / chart.js)
- Tabel peminjaman terbaru
- Feed aktivitas terbaru

### Modul Inventory

**[F4-05] `src/api/inventory.ts`** — CRUD items + categories

**[F4-06] `src/pages/inventory/ItemListPage.tsx`**
- Grid/list view barang
- Filter sidebar (kategori, kondisi, stok)
- Search bar
- Pagination

**[F4-07] `src/pages/inventory/ItemDetailPage.tsx`**
- Galeri foto
- Info detail
- Tombol "Pinjam" (siswa)

**[F4-08] `src/pages/inventory/ItemFormPage.tsx`** (guru/admin)
- Form create/edit
- Upload foto
- Validasi dengan Zod + React Hook Form

**[F4-09] `src/pages/inventory/CategoryPage.tsx`** (guru/admin)
- CRUD kategori dalam satu halaman

### Modul Peminjaman

**[F4-10] `src/api/borrowing.ts`** — CRUD borrowings

**[F4-11] `src/pages/borrowing/BorrowingListPage.tsx`**
- Siswa: daftar peminjaman sendiri + status badge
- Guru/Admin: semua peminjaman + filter + action approve/reject

**[F4-12] `src/pages/borrowing/BorrowingDetailPage.tsx`**
- Info lengkap transaksi
- Foto-foto
- Tombol aksi sesuai status & role

**[F4-13] `src/pages/borrowing/BorrowingFormPage.tsx`** (siswa)
- Pilih barang (search + add to cart style)
- Isi form tujuan, tanggal
- Preview sebelum submit

**[F4-14] `src/components/common/ApprovalDialog.tsx`** (guru/admin)
- Dialog approve dengan catatan
- Dialog reject dengan alasan wajib

### Modul Pengembalian

**[F4-15] Upload foto return (dalam BorrowingDetailPage)**
- Tombol "Kembalikan Barang" muncul saat status `approved`
- Dialog upload foto selfie
- Preview foto sebelum submit

**[F4-16] Konfirmasi return (guru/admin dalam BorrowingDetailPage)**
- View foto return
- Input kondisi per item
- Tombol "Konfirmasi Pengembalian"

### Modul User

**[F4-17] `src/pages/users/UserListPage.tsx`** (admin)
- Tabel user + filter role, status
- Toggle aktif/nonaktif

**[F4-18] `src/pages/users/UserFormPage.tsx`** (admin)
- Form create/edit user

### Modul Log & Riwayat

**[F4-19] `src/pages/settings/ActivityLogPage.tsx`** (guru/admin)
- Timeline log
- Filter tanggal, aksi, user

---

## FASE 5 — Integrasi & Polish

**[X5-01] Global error handling**
- Axios interceptor: toast error otomatis untuk 500
- React ErrorBoundary untuk crash rendering

**[X5-02] Loading states**
- Skeleton untuk semua list dan detail page
- Spinner untuk form submit

**[X5-03] Toast notifications**
- Gunakan Sonner untuk sukses/error feedback

**[X5-04] Empty states**
- Komponen EmptyState untuk list kosong

**[X5-05] Responsive design audit**
- Test di mobile 375px, tablet 768px, desktop 1440px
- Sidebar collapse otomatis di mobile

**[X5-06] Form validation UX**
- Error message inline di bawah setiap field
- Disable submit saat loading

**[X5-07] Testing backend**
```bash
php artisan test
```
- Feature test: auth, borrowing flow, stock calculation
- Unit test: services, business logic

**[X5-08] CORS & Cookie final check**
- Pastikan frontend bisa hit semua endpoint
- Pastikan file upload bekerja (multipart)

---

## FASE 6 — Deployment (Ubuntu 24 + Nginx)

**[D6-01] Persiapan server**
```bash
# Install dependencies
sudo apt update
sudo apt install php8.3 php8.3-fpm php8.3-mysql php8.3-mbstring \
     php8.3-xml php8.3-curl php8.3-zip php8.3-gd \
     nginx mariadb-server supervisor git
```

**[D6-02] Setup database production**
```sql
CREATE DATABASE inventory_tkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inventory_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON inventory_tkj.* TO 'inventory_user'@'localhost';
```

**[D6-03] Deploy backend**
```bash
cd /var/www
git clone <repo> inventory-tkj
cd inventory-tkj/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# Edit .env dengan konfigurasi production
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=AdminSeeder
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**[D6-04] Build frontend**
```bash
cd /var/www/inventory-tkj/frontend
npm install
npm run build
# Output: frontend/dist/
```

**[D6-05] Konfigurasi Nginx**
```nginx
# Backend API server
server {
    listen 80;
    server_name api.inventortkj.sch.id;
    root /var/www/inventory-tkj/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    client_max_body_size 10M;  # untuk file upload
}

# Frontend SPA
server {
    listen 80;
    server_name inventortkj.sch.id;
    root /var/www/inventory-tkj/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # penting untuk React Router
    }
}
```

**[D6-06] Konfigurasi Supervisor (Queue Worker)**
```ini
[program:inventory-queue]
command=php /var/www/inventory-tkj/backend/artisan queue:work --sleep=3 --tries=3
directory=/var/www/inventory-tkj/backend
user=www-data
autostart=true
autorestart=true
```

**[D6-07] Setup SSL**
- Gunakan Nginx Proxy Manager atau Certbot

**[D6-08] Setup permissions file storage**
```bash
chown -R www-data:www-data /var/www/inventory-tkj/backend/storage
chmod -R 775 /var/www/inventory-tkj/backend/storage
```

---

## Urutan Dependensi (Diagram)

```
[B0: Setup] ──────────────────────────────────────────┐
     │                                                 │
     ▼                                                 ▼
[B1: DB/Model] ──→ [B2: API]            [F0: Frontend Setup]
                        │                       │
                        │               [F3: Frontend Core]
                        │                       │
                        └───────────────→ [F4: Fitur Pages]
                                                │
                                        [X5: Integration]
                                                │
                                        [D6: Deployment]
```

---

## Checklist Quick Reference

### Backend Done When:
- [ ] `php artisan route:list` menampilkan semua 28+ endpoint
- [ ] Login Google berhasil return token
- [ ] CRUD barang + upload foto berfungsi
- [ ] Alur peminjaman end-to-end berfungsi (buat→approve→return foto→konfirmasi)
- [ ] Stok berkurang/bertambah dengan benar
- [ ] Activity log tercatat untuk setiap aksi

### Frontend Done When:
- [ ] Login Google redirect ke dashboard
- [ ] Halaman inventory menampilkan daftar barang dari API
- [ ] Siswa bisa buat pengajuan peminjaman
- [ ] Guru bisa approve/reject dari halaman peminjaman
- [ ] Siswa bisa upload foto return
- [ ] Guru bisa konfirmasi pengembalian
- [ ] Dashboard menampilkan statistik real
- [ ] Semua halaman responsif di mobile
