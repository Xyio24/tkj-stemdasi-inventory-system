# PROJECT_CONTEXT.md — Inventory TKJ

> **Status**: Project dalam fase setup awal. Struktur folder sudah terbentuk, namun sebagian besar file masih kosong (placeholder). Implementasi aktual belum dimulai.

---

## 1. Arsitektur Aplikasi

### Pola Arsitektur
Aplikasi ini menggunakan arsitektur **Decoupled SPA (Single Page Application)**:

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│                                                      │
│   ┌──────────────────────────────────────────────┐   │
│   │        Frontend — React 19 + Vite            │   │
│   │         Port: 5173 (dev)                     │   │
│   │                                              │   │
│   │  React Router → Pages → Components          │   │
│   │  TanStack Query → API Layer → Axios          │   │
│   └─────────────────┬────────────────────────────┘   │
│                     │ HTTP / REST API                 │
└─────────────────────┼───────────────────────────────-┘
                      │
┌─────────────────────▼──────────────────────────────┐
│                   SERVER                            │
│                                                     │
│   ┌────────────────────────────────────────────┐   │
│   │        Backend — Laravel 13 (API)          │   │
│   │         Port: 8000 (dev)                   │   │
│   │                                            │   │
│   │  Routes → Controller → Service            │   │
│   │         → Repository → Model              │   │
│   └────────────────┬───────────────────────────┘   │
│                    │                               │
│   ┌────────────────▼───────────────────────────┐   │
│   │         Database — MySQL                   │   │
│   │         DB: inventory_tkj                  │   │
│   └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Pola Layer Backend (Layered Architecture)
Backend menggunakan pola berlapis **Controller → Service → Repository → Model**:

| Layer | Direktori | Tanggung Jawab |
|---|---|---|
| Controller | `app/Http/Controllers/` | Menerima request, validasi input, memanggil Service |
| Service | `app/Services/` | Business logic utama |
| Repository | `app/Repositories/` | Abstraksi akses database |
| Action | `app/Actions/` | Single-purpose action classes |
| DTO | `app/DTOs/` | Data Transfer Objects antar layer |
| Policy | `app/Policies/` | Otorisasi akses resource |
| Model | `app/Models/` | Eloquent ORM, relasi database |

### Pola Komunikasi API
- **Backend** hanya mengekspos REST API (`api/*` prefix) — tidak menggunakan Inertia/Livewire.
- **Frontend** berkomunikasi via Axios dengan TanStack Query untuk caching & state manajemen server.
- Error JSON otomatis dikembalikan untuk semua request ke `api/*` (dikonfigurasi di `bootstrap/app.php`).

---

## 2. Struktur Folder

### Root Workspace
```
Inventory TKJ/
├── backend/          # Laravel 13 API Server
├── frontend/         # React 19 + Vite SPA
└── docs/             # Dokumentasi proyek
```

### Backend (`backend/`)
```
backend/
├── app/
│   ├── Actions/              # Single-purpose action classes (kosong)
│   ├── DTOs/                 # Data Transfer Objects (kosong)
│   ├── Http/
│   │   └── Controllers/
│   │       └── Controller.php  # Base abstract controller
│   ├── Models/
│   │   └── User.php            # Model Eloquent User
│   ├── Policies/             # Authorization policies (kosong)
│   ├── Providers/
│   │   └── AppServiceProvider.php
│   ├── Repositories/         # Repository pattern (kosong)
│   └── Services/             # Business logic (kosong)
├── bootstrap/
│   ├── app.php               # Application bootstrapper (Laravel 11+ style)
│   └── providers.php
├── config/                   # File konfigurasi Laravel standar
│   ├── app.php, auth.php, cache.php, database.php
│   ├── filesystems.php, logging.php, mail.php
│   ├── queue.php, services.php, session.php
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   └── 0001_01_01_000002_create_jobs_table.php
│   └── seeders/
│       └── DatabaseSeeder.php
├── resources/
│   ├── css/app.css           # CSS Tailwind v4 (untuk welcome page Laravel)
│   ├── js/app.js             # Entry JS minimal
│   └── views/
│       └── welcome.blade.php # Default Laravel welcome page
├── routes/
│   ├── console.php           # Artisan console routes
│   └── web.php               # Web routes (hanya welcome page)
├── .env                      # Konfigurasi environment aktif
├── .env.example              # Template environment
├── composer.json             # PHP dependencies
├── package.json              # Node dependencies backend (Vite + Tailwind v4)
├── vite.config.js            # Vite config backend (untuk asset Laravel)
└── phpunit.xml               # Konfigurasi testing PHPUnit
```

### Frontend (`frontend/`)
```
frontend/
├── @/                        # ⚠️ ANOMALI — folder literal "@" (shadcn artifact)
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx    # shadcn Button component
│   └── lib/
│       └── utils.ts          # cn() helper (clsx + tailwind-merge)
├── public/                   # Static assets publik
├── src/
│   ├── api/                  # HTTP call functions (semua kosong)
│   │   ├── auth.ts
│   │   ├── borrowing.ts
│   │   ├── dashboard.ts
│   │   └── inventory.ts
│   ├── assets/               # Asset statis (react.svg dll)
│   ├── components/           # Komponen React
│   │   ├── common/           # Komponen umum (kosong)
│   │   ├── layout/           # Komponen layout (kosong)
│   │   └── ui/               # UI components shadcn (kosong)
│   ├── hooks/                # Custom React hooks (kosong)
│   ├── layouts/              # Layout wrappers (file ada tapi kosong)
│   │   ├── AuthLayout.tsx    # ⚠️ Kosong
│   │   ├── DashboardLayout.tsx # ⚠️ Kosong
│   │   └── GuestLayout.tsx   # ⚠️ Kosong
│   ├── lib/                  # Utilitas library (file ada tapi kosong)
│   │   ├── axios.ts          # ⚠️ Kosong — perlu konfigurasi Axios instance
│   │   ├── queryClient.ts    # ⚠️ Kosong — perlu inisialisasi TanStack Query
│   │   └── utils.ts          # ⚠️ Kosong — harusnya berisi cn() helper
│   ├── pages/                # Halaman-halaman aplikasi (semua kosong)
│   │   ├── auth/
│   │   ├── borrowing/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── return/
│   │   ├── settings/
│   │   └── users/
│   ├── providers/            # React context providers (kosong)
│   ├── routes/               # Konfigurasi routing (kosong)
│   ├── services/             # Service layer frontend (kosong)
│   ├── store/                # State management (kosong)
│   ├── types/                # TypeScript type definitions (kosong)
│   ├── utils/                # Utility functions (kosong)
│   ├── App.css               # ⚠️ CSS default Vite (belum dibersihkan)
│   ├── App.tsx               # ⚠️ Masih template default Vite (belum diimplementasi)
│   ├── index.css             # CSS utama + Tailwind + shadcn CSS variables
│   ├── main.tsx              # Entry point React
│   └── vite-env.d.ts         # Vite type declarations
├── components.json           # Konfigurasi shadcn/ui
├── eslint.config.js          # ESLint (flat config, TypeScript)
├── index.html                # HTML entry point
├── package.json              # Node dependencies frontend
├── postcss.config.js         # PostCSS (Tailwind + Autoprefixer)
├── tailwind.config.js        # Tailwind CSS v3 config
├── tsconfig.json             # TypeScript project references
├── tsconfig.app.json         # TypeScript config untuk src/
├── tsconfig.node.json        # TypeScript config untuk vite.config.ts
└── vite.config.ts            # Vite config frontend
```

---

## 3. Dependency yang Digunakan

### Backend (PHP / Composer)

#### `require` (Production)
| Package | Versi | Kegunaan |
|---|---|---|
| `php` | ^8.3 | PHP runtime |
| `laravel/framework` | ^13.8 | Framework utama Laravel |
| `laravel/tinker` | ^3.0 | REPL interaktif Artisan |

#### `require-dev` (Development)
| Package | Versi | Kegunaan |
|---|---|---|
| `fakerphp/faker` | ^1.23 | Fake data untuk seeder/factory |
| `laravel/pail` | ^1.2.5 | Log viewer CLI real-time |
| `laravel/pao` | ^1.0.6 | Process allocation helper |
| `laravel/pint` | ^1.27 | PHP code formatter (PSR-12) |
| `mockery/mockery` | ^1.6 | Mocking library untuk testing |
| `nunomaduro/collision` | ^8.6 | Error reporting yang lebih baik |
| `phpunit/phpunit` | ^12.5.12 | Testing framework |

> **Catatan**: Backend **belum menginstal** `laravel/sanctum` untuk autentikasi API — ini perlu ditambahkan sebelum implementasi auth.

### Frontend (Node.js / npm)

#### `dependencies` (Runtime)
| Package | Versi | Kegunaan |
|---|---|---|
| `@fontsource-variable/geist` | ^5.2.9 | Font Geist Variable |
| `@hookform/resolvers` | ^5.4.0 | Resolvers untuk React Hook Form (Zod) |
| `@tanstack/react-query` | ^5.101.2 | Server state management & data fetching |
| `axios` | ^1.18.1 | HTTP client |
| `class-variance-authority` | ^0.7.1 | Utility untuk variasi class CSS (CVA) |
| `clsx` | ^2.1.1 | Utility untuk conditional class names |
| `lucide-react` | ^1.23.0 | Icon library |
| `radix-ui` | ^1.6.1 | Headless UI primitives |
| `react` | ^19.1.1 | UI library |
| `react-dom` | ^19.1.1 | React DOM renderer |
| `react-hook-form` | ^7.81.0 | Form management |
| `react-router-dom` | ^7.18.1 | Client-side routing |
| `shadcn` | ^4.13.0 | shadcn CLI untuk menambahkan komponen |
| `sonner` | ^2.0.7 | Toast notifications |
| `tailwind-merge` | ^3.6.0 | Merge Tailwind class tanpa konflik |
| `tw-animate-css` | ^1.4.0 | Animasi CSS untuk Tailwind |
| `zod` | ^4.4.3 | Schema validation & type inference |

#### `devDependencies` (Development)
| Package | Versi | Kegunaan |
|---|---|---|
| `@eslint/js` | ^9.36.0 | ESLint JS rules |
| `@types/node` | ^26.1.0 | TypeScript types untuk Node.js |
| `@types/react` | ^19.1.13 | TypeScript types untuk React |
| `@types/react-dom` | ^19.1.9 | TypeScript types untuk ReactDOM |
| `@vitejs/plugin-react` | ^5.0.3 | Plugin Vite untuk React (Babel) |
| `autoprefixer` | ^10.5.2 | PostCSS autoprefixer |
| `eslint` | ^9.36.0 | Linter JavaScript/TypeScript |
| `eslint-plugin-react-hooks` | ^5.2.0 | ESLint rules untuk React Hooks |
| `eslint-plugin-react-refresh` | ^0.4.20 | ESLint rules untuk React Fast Refresh |
| `globals` | ^16.4.0 | Global variables untuk ESLint |
| `postcss` | ^8.5.16 | CSS transformer |
| `tailwindcss` | ^3.4.17 | Utility-first CSS framework |
| `typescript` | ~5.8.3 | TypeScript compiler |
| `typescript-eslint` | ^8.44.0 | ESLint plugin untuk TypeScript |
| `vite` | ^7.1.7 | Build tool & dev server |

---

## 4. Konvensi Coding

### Backend (PHP / Laravel)

| Aspek | Konvensi |
|---|---|
| **Namespace** | PSR-4, prefix `App\` |
| **Penamaan Class** | PascalCase |
| **Penamaan Method** | camelCase |
| **Penamaan Model** | Singular PascalCase (`User`, `Item`, `Borrowing`) |
| **Penamaan Migration** | snake_case deskriptif (`create_items_table`) |
| **Penamaan Controller** | `{Resource}Controller` (resource-based) |
| **Penamaan Service** | `{Resource}Service` |
| **Penamaan Repository** | `{Resource}Repository` |
| **Penamaan DTO** | `{Resource}Data` atau `{Action}{Resource}DTO` |
| **Penamaan Action** | `{Verb}{Noun}Action` (e.g., `CreateItemAction`) |
| **API Response** | JSON selalu untuk route `api/*` |
| **Code Style** | Laravel Pint (PSR-12) |
| **PHP Version** | PHP 8.3+ (menggunakan PHP Attributes, named arguments) |

### Frontend (TypeScript / React)

| Aspek | Konvensi |
|---|---|
| **Komponen** | PascalCase, file `.tsx` |
| **Hooks** | camelCase dengan prefix `use`, file `.ts` |
| **Utilities/Helpers** | camelCase, file `.ts` |
| **Types/Interfaces** | PascalCase, file `.ts` di `src/types/` |
| **Import path** | Alias `@/` → `src/` |
| **CSS** | Tailwind CSS classes via `cn()` utility |
| **Form** | React Hook Form + Zod schema validation |
| **State server** | TanStack Query (bukan useState/useEffect manual) |
| **State client** | Zustand atau React Context (via `src/store/`) |
| **Naming file** | PascalCase untuk komponen, camelCase untuk lainnya |
| **TypeScript** | Strict mode aktif, `noUnusedLocals`, `noUnusedParameters` |

---

## 5. Daftar Modul Aplikasi

### Modul Backend (API)

| Modul | Endpoint Prefix | Deskripsi |
|---|---|---|
| **Auth** | `/api/auth` | Login, logout, register, user profile |
| **Dashboard** | `/api/dashboard` | Statistik ringkasan (total item, peminjaman aktif, dll.) |
| **Inventory** | `/api/inventory` | CRUD barang inventaris |
| **Borrowing** | `/api/borrowing` | CRUD peminjaman barang |
| **Return** | `/api/return` | Proses pengembalian barang |
| **Users** | `/api/users` | Manajemen pengguna (admin) |
| **Settings** | `/api/settings` | Pengaturan aplikasi |

### Modul Frontend (Pages)

| Modul | Route | Layout | Deskripsi |
|---|---|---|---|
| **Auth** | `/login`, `/register` | `GuestLayout` | Halaman autentikasi |
| **Dashboard** | `/dashboard` | `DashboardLayout` | Ringkasan statistik |
| **Inventory** | `/inventory` | `DashboardLayout` | Daftar & kelola barang |
| **Borrowing** | `/borrowing` | `DashboardLayout` | Daftar & buat peminjaman |
| **Return** | `/return` | `DashboardLayout` | Proses pengembalian |
| **Users** | `/users` | `DashboardLayout` | Manajemen pengguna |
| **Settings** | `/settings` | `DashboardLayout` | Pengaturan aplikasi |

### Estimasi Struktur Role
- **Admin**: Akses penuh ke semua modul
- **Petugas/Staff**: Akses ke inventory, borrowing, return
- **Siswa/User**: Hanya bisa mengajukan peminjaman & melihat status

---

## 6. Urutan Implementasi (Recommended)

### Phase 1 — Backend Foundation
1. Buat `routes/api.php` dan daftarkan di `bootstrap/app.php`
2. Install Laravel Sanctum: `composer require laravel/sanctum`
3. Tambahkan kolom ke migration users (`role`, `phone`, `nis_nip`)
4. Buat model-model inti: `Item`, `Category`, `Borrowing`, `BorrowingItem`
5. Buat migrations untuk semua model di atas
6. Buat seeders untuk data awal (admin, kategori, sample items)
7. Implementasi `AuthController` (login/logout/me endpoint)
8. Implementasi Resource Controllers per modul

### Phase 2 — Frontend Foundation
1. Bersihkan template default Vite (`App.tsx`, `App.css`, sisa konten default di `index.css`)
2. Pindahkan shadcn output dari folder `@/` fisik ke `src/` (isi ulang `src/lib/utils.ts`, `src/components/ui/`)
3. Implementasi `src/lib/axios.ts` — Axios instance dengan baseURL & interceptors
4. Implementasi `src/lib/queryClient.ts` — TanStack Query client
5. Implementasi layouts: `GuestLayout`, `AuthLayout`, `DashboardLayout`
6. Implementasi routing di `src/routes/`
7. Implementasi API layer di `src/api/`

### Phase 3 — Fitur per Modul _(ikuti urutan dependensi)_
1. **Auth** — Login page, session handling, redirect logic
2. **Dashboard** — Ringkasan statistik
3. **Inventory** — CRUD barang (list, create, edit, delete, detail)
4. **Borrowing** — Buat & daftar peminjaman
5. **Return** — Proses pengembalian
6. **Users** — Manajemen pengguna (admin only)
7. **Settings** — Konfigurasi aplikasi

### Phase 4 — Polish & QA
1. Error handling global (Axios interceptors + React ErrorBoundary)
2. Loading states & skeleton screens
3. Form validation messages
4. Responsive design
5. Testing (PHPUnit backend + manual frontend)

---

## Audit: Temuan & Catatan Penting

### Masalah Kritis

| # | File/Lokasi | Masalah |
|---|---|---|
| 1 | `frontend/@/` | **Folder `@` literal di filesystem** — shadcn CLI salah target output. Harusnya output ke `frontend/src/`. Komponen `button.tsx` dan `utils.ts` ada di sini, bukan di `src/`. |
| 2 | `frontend/src/lib/utils.ts` | **File kosong** — `cn()` helper belum ada di lokasi yang dikonfigurasi shadcn (`@/lib/utils` → `src/lib/utils`). |
| 3 | `frontend/src/App.tsx` | **Masih template default Vite** — belum diimplementasi sama sekali. |
| 4 | `backend/routes/` | **Tidak ada `api.php`** — tidak ada route API yang terdefinisi. |
| 5 | `backend/` | **Tidak ada auth package** — Sanctum/Passport belum diinstall. |
| 6 | `backend/.env` | **`APP_KEY` kosong** — aplikasi tidak bisa berjalan tanpa key. |

### Masalah Konfigurasi

| # | File | Masalah |
|---|---|---|
| 7 | `frontend/tailwind.config.js` | **`theme.extend` kosong** — tidak ada mapping CSS variables shadcn ke Tailwind theme (warna `primary`, `secondary`, dll. tidak tersedia sebagai class Tailwind). |
| 8 | `frontend/src/index.css` | **Dua blok `:root` global konflik** — ada gaya default Vite (baris 8-20) dan shadcn tokens (baris 82-163). Perlu dihapus bagian Vite default. |
| 9 | `frontend/src/App.css` | **File tidak berguna** — hanya berisi gaya demo Vite, akan dihapus saat App.tsx diimplementasi. |
| 10 | `backend/vite.config.js` | **Ini untuk Laravel Blade**, bukan React SPA. Wajar, tapi perlu dipastikan tidak konflik port/proses saat keduanya jalan. |

### Pengamatan Positif

| Aspek | Catatan |
|---|---|
| **Struktur folder frontend** | Sudah mengikuti best practice (api, components, hooks, layouts, lib, pages, providers, routes, services, store, types, utils) |
| **TypeScript config** | Strict mode, proper project references, ESNext target — konfigurasi sangat baik |
| **Backend layer architecture** | Action, DTO, Repository, Service sudah dipersiapkan — clean architecture |
| **shadcn components.json** | Konfigurasi lengkap dan benar (style, aliases, tailwind, tsx) |
| **ESLint config** | Flat config modern dengan TypeScript ESLint, react-hooks, react-refresh |
| **Laravel bootstrap/app.php** | JSON error response otomatis untuk `api/*` sudah dikonfigurasi |
| **Dependency selection** | Stack (React 19, TanStack Query, Zod, RHF, shadcn, Sonner) sangat solid dan modern |
| **Database** | MySQL dikonfigurasi di `.env` dengan `inventory_tkj` |

---

## Referensi Konfigurasi Cepat

### Dev Server
```bash
# Backend (dari direktori backend/)
composer run dev
# atau manual:
php artisan serve   # port 8000

# Frontend (dari direktori frontend/)
npm run dev         # Vite port 5173
```

### Path Alias Frontend
- `@/` → `frontend/src/` (dikonfigurasi di `vite.config.ts` & `tsconfig.app.json`)

### shadcn UI Config (`components.json`)
- **Style**: `radix-nova`
- **Base Color**: `neutral`
- **CSS Variables**: aktif
- **Icon Library**: `lucide-react`
- **Components path**: `@/components` → `src/components`
- **Utils path**: `@/lib/utils` → `src/lib/utils`
- **UI path**: `@/components/ui` → `src/components/ui`

### Database
- **Driver**: MySQL
- **Host**: `127.0.0.1:3306`
- **Database**: `inventory_tkj`
- **Username**: `root`
