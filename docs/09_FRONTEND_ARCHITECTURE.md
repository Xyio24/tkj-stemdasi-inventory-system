# 09 — FRONTEND ARCHITECTURE
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Pendahuluan Arsitektur Frontend

Frontend aplikasi dikembangkan sebagai **Single Page Application (SPA)** berbasis **React 19** dan menggunakan **Vite 7** sebagai bundler utama. Implementasi arsitektur ini berfokus pada pemisahan state, performa rendering yang optimal melalui *lazy loading*, tipe data yang aman menggunakan *TypeScript*, serta desain UI modern yang konsisten memakai *Tailwind CSS* dan *shadcn/ui*.

---

## 2. Struktur Folder Terbaik

Struktur folder mengadopsi pola **Feature-Based / Domain-Driven** yang digabungkan dengan pola komponen reusable di level global untuk skalabilitas jangka panjang.

```
frontend/
├── public/                 # Aset statis (logo, favicon)
├── src/
│   ├── api/                # Integrasi API (Axios Services)
│   ├── components/
│   │   ├── common/         # Komponen global reusable (Button, Input, Table)
│   │   └── ui/             # Komponen primitif dari shadcn/ui
│   ├── hooks/              # Custom React Hooks tingkat global
│   ├── layouts/            # Komponen tata letak halaman (Guest, Auth, Dashboard)
│   ├── lib/                # Konfigurasi utilitas (Axios, Query Client, cn helper)
│   ├── pages/              # Halaman utama aplikasi (dikelompokkan per modul)
│   │   ├── auth/           # Login, Logout
│   │   ├── dashboard/      # Statistik Guru/Admin/Siswa
│   │   ├── inventory/      # List, Detail, Form Barang & Kategori
│   │   └── borrowing/      # Form Pinjam, List Transaksi, Detail Approval
│   ├── routes/             # Konfigurasi routing & Route Guards
│   ├── store/              # State management global (Zustand Stores)
│   ├── types/              # Definisi interface TypeScript global
│   ├── App.tsx             # Entry point komponen React
│   ├── index.css           # CSS Global & CSS Variables shadcn
│   └── main.tsx            # Pemasangan DOM awal React
├── components.json         # Konfigurasi shadcn/ui
├── postcss.config.js       # Konfigurasi preprocessor CSS
├── tailwind.config.js      # Konfigurasi tema & variabel Tailwind
├── tsconfig.json           # Aturan kompilasi TypeScript
└── vite.config.ts          # Pengaturan bundler Vite & Port
```

---

## 3. State Management

Sistem memisahkan manajemen state ke dalam tiga kategori utama:

### 3.1 Local State (`useState`)
Digunakan secara eksklusif untuk UI state internal komponen yang tidak memengaruhi komponen lain. Misalnya: status open/close dialog, input pencarian sementara, atau state loading internal tombol.

### 3.2 Server State (TanStack Query / React Query v5)
Seluruh data yang berasal dari database backend (seperti katalog barang, detail peminjaman, log aktivitas) dikelola menggunakan **TanStack Query**.
- **Kelebihan:** Otomatisasi caching, background refetching (saat window focus atau navigasi ulang), sinkronisasi status loading/error, dan mekanisme optimis update saat mutasi stok.
- **Konfigurasi Global:**
  - `staleTime`: Default 5 menit.
  - `gcTime` (Cache Time): Default 10 menit.
  - `retry`: Maksimal 1 kali gagal sebelum menampilkan pesan error ke pengguna.

### 3.3 Client State Global (Zustand)
Digunakan untuk menyimpan data persisten ringan yang diakses di banyak layout berbeda.
- **Kasus Penggunaan:**
  - Sesi login pengguna (Token Sanctum, Data User profil, Role).
  - Status collapse/expand Sidebar navigasi utama.
- **Penyimpanan:** Store untuk autentikasi wajib diintegrasikan dengan middleware Zustand `persist` agar tersimpan secara otomatis di `localStorage` client untuk mencegah logout saat refresh halaman.

---

## 4. Integrasi & Koneksi API (Axios)

- **Instansiasi Terpusat:** Menggunakan satu instance Axios kustom dengan konfigurasi `baseURL` yang merujuk pada environment variable (`VITE_API_URL`).
- **Interceptors:**
  - **Request Interceptor:** Secara otomatis menyuntikkan token Bearer dari Zustand store ke header `Authorization` di setiap request HTTP yang keluar.
  - **Response Interceptor:** 
    - Mendeteksi error HTTP 401 (Unauthorized) untuk langsung menghapus sesi token di client dan mengarahkan pengguna kembali ke halaman `/login`.
    - Mengonversi pesan kesalahan validasi backend (422) ke format string tunggal yang ramah bagi Toast notification.

---

## 5. Routing, Guards, & Lazy Loading

Sistem navigasi dikelola oleh **React Router v7** dengan struktur declaratif.

### 5.1 Route Guards (Protected & Public Route)
- **Public Route (Guest Only):** Menjaga agar rute seperti `/login` tidak bisa diakses jika pengguna sudah memiliki token aktif (otomatis dialihkan ke dashboard).
- **Protected Route (Auth Required):** Memblokir akses ke rute aplikasi jika pengguna belum login.
- **Role Guard:** Komponen wrapper tingkat tinggi yang memeriksa array `role` pengguna sebelum merender halaman. Jika siswa mencoba mengetikkan URL `/admin/users` secara manual, sistem langsung memotong dan menampilkan halaman `403 Forbidden` atau mengalihkannya kembali ke `/dashboard`.

### 5.2 Lazy Loading (Code Splitting)
- Semua halaman (`pages/*`) **wajib diimpor menggunakan `React.lazy()`** agar bundle aplikasi terpecah menjadi chunk kecil yang hanya dimuat saat diakses pertama kali.
- Selama transisi loading chunk, layout dibungkus menggunakan komponen `React.Suspense` dengan fallback visual berupa **Skeleton Screen** yang menyerupai bentuk halaman asli (bukan blank spinner).

---

## 6. Struktur Tata Letak (Layouts)

Aplikasi memiliki tiga layout utama untuk konsistensi UI:

1. **Guest Layout:** Minimalis, tanpa header/sidebar, berfokus penuh pada card login.
2. **Dashboard Layout (Auth Layout):**
   - **Sidebar:** Navigasi vertikal yang responsif (menyusut di mobile, permanen di desktop). Menu disesuaikan secara dinamis berdasarkan role pengguna yang login.
   - **Header:** Menampilkan breadcrumbs rute saat ini, info user profil (avatar dari Google), dan tombol Logout.
   - **Main Content Area:** Area tempat `<Outlet>` React Router merender konten halaman spesifik.

---

## 7. Reusable Components & Custom Hooks

- **Komponen Reusable (`components/common/`):** Komponen fungsional generik seperti `DataTable` dengan paginasi bawaan, dialog konfirmasi modal, widget filter pencarian, dan badge status peminjaman.
- **Custom Hooks (`hooks/`):** 
  - `useAuth`: Mengekstrak logika otorisasi, pengecekan role, dan aksi login/logout.
  - Custom Query Hooks (misal: `useItems`, `useBorrowingDetail`): Membungkus query TanStack Query agar penulisan saringan filter/refetching terpusat dan tidak berantakan di level komponen visual.

---

## 8. Standar Naming Convention (Konvensi Penamaan)

1. **Folder & Files Komponen:** Menggunakan format **PascalCase** (misal: `ItemCard.tsx`, `DashboardLayout.tsx`).
2. **Halaman (Pages):** Menggunakan nama berakhiran **Page** (misal: `ItemListPage.tsx`, `LoginPage.tsx`).
3. **Hooks:** Menggunakan prefix **use** dengan camelCase (misal: `useAuth.ts`, `useItemsQuery.ts`).
4. **Style / CSS:** Menggunakan penamaan utility class Tailwind. Untuk styling kustom menggunakan variabel CSS shadcn (`var(--background)`).
5. **Types / Interfaces:** Menggunakan PascalCase (misal: `UserInterface`, `BorrowingStatus`).
