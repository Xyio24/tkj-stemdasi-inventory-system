# DATABASE_SCHEMA.md — Inventory TKJ

> Dokumen ini merinci desain skema database lengkap untuk sistem Inventory dan Peminjaman Barang Jurusan TKJ.

---

## Ringkasan Tabel

| Tabel | Deskripsi |
|---|---|
| `users` | Pengguna aplikasi (Siswa, Guru, Admin) |
| `categories` | Kategori barang inventaris |
| `items` | Barang inventaris |
| `item_images` | Foto/gambar barang inventaris |
| `borrowings` | Header transaksi peminjaman |
| `borrowing_items` | Detail barang per transaksi peminjaman |
| `borrowing_photos` | Foto selfie peminjaman & pengembalian |
| `activity_logs` | Log seluruh aktivitas sistem |
| `personal_access_tokens` | Token Sanctum (dari package) |
| `sessions` | Session database Laravel (dari migrasi default) |
| `cache` | Cache database Laravel (dari migrasi default) |
| `jobs` | Queue jobs Laravel (dari migrasi default) |

---

## ERD (Entity Relationship Diagram)

```
users
 │
 ├──< borrowings (user_id)
 │         │
 │         ├──< borrowing_items (borrowing_id) >── items
 │         │                                          │
 │         └──< borrowing_photos (borrowing_id)       └──< categories
 │
 └── (approved_by → users.id via borrowings.approved_by)
 └── (return_approved_by → users.id via borrowings.return_approved_by)

activity_logs (polymorphic: subject_type / subject_id)
 └── user_id → users.id
```

---

## Skema Tabel Detail

### 1. `users`

Menyimpan semua pengguna: Siswa, Guru, dan Admin.

```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    google_id       VARCHAR(255) NULL UNIQUE,        -- Google OAuth ID
    avatar          VARCHAR(255) NULL,               -- URL foto dari Google
    role            ENUM('siswa', 'guru', 'admin') NOT NULL DEFAULT 'siswa',
    nis_nip         VARCHAR(30) NULL,                -- NIS untuk siswa, NIP untuk guru
    phone           VARCHAR(20) NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    password        VARCHAR(255) NULL,               -- NULL jika hanya OAuth
    remember_token  VARCHAR(100) NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL
);
```

**Catatan:**
- `password` nullable karena login via Google OAuth tidak memerlukan password.
- `google_id` diisi saat user pertama kali login via Google.
- `role` menentukan hak akses: `siswa` (peminjam), `guru`/`admin` (approver & manager).
- `is_active` untuk menonaktifkan akun tanpa menghapus data historis.

**Indexes:**
```sql
INDEX idx_users_role (role)
INDEX idx_users_google_id (google_id)
INDEX idx_users_is_active (is_active)
```

---

### 2. `categories`

Kategori pengelompokan barang.

```sql
CREATE TABLE categories (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL
);
```

**Contoh data:**
| name | slug |
|---|---|
| Perangkat Jaringan | perangkat-jaringan |
| Alat Kerja | alat-kerja |
| Komputer & Laptop | komputer-laptop |
| Kabel & Konektor | kabel-konektor |

---

### 3. `items`

Barang inventaris yang dapat dipinjam.

```sql
CREATE TABLE items (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id     BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT NULL,
    brand           VARCHAR(100) NULL,               -- Merek/merk barang
    model           VARCHAR(100) NULL,               -- Nomor model/seri
    stock           INT UNSIGNED NOT NULL DEFAULT 0, -- Stok tersedia untuk dipinjam
    stock_total     INT UNSIGNED NOT NULL DEFAULT 0, -- Total stok keseluruhan
    stock_minimum   INT UNSIGNED NOT NULL DEFAULT 1, -- Stok minimum alert
    condition       ENUM('baik', 'rusak_ringan', 'rusak_berat') NOT NULL DEFAULT 'baik',
    location        VARCHAR(100) NULL,               -- Lokasi penyimpanan
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,   -- Apakah bisa dipinjam
    image           VARCHAR(255) NULL,               -- Foto utama barang
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    CONSTRAINT fk_items_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT
);
```

**Aturan stok:**
- `stock` = jumlah yang tersedia untuk dipinjam saat ini
- `stock_total` = jumlah fisik total barang yang dimiliki
- `stock = stock_total - (jumlah yang sedang dipinjam)`
- Ketika `stock = 0`, barang tidak bisa dipinjam (`is_available` tetap TRUE, cek stok di business logic)

**Indexes:**
```sql
INDEX idx_items_category_id (category_id)
INDEX idx_items_is_available (is_available)
INDEX idx_items_condition (condition)
FULLTEXT INDEX idx_items_search (name, description, brand, model)
```

---

### 4. `item_images`

Gambar tambahan untuk barang (bisa lebih dari satu gambar per barang).

```sql
CREATE TABLE item_images (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id     BIGINT UNSIGNED NOT NULL,
    path        VARCHAR(255) NOT NULL,   -- Path file di storage
    order       INT UNSIGNED NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NULL,
    updated_at  TIMESTAMP NULL,

    CONSTRAINT fk_item_images_item
        FOREIGN KEY (item_id) REFERENCES items(id)
        ON DELETE CASCADE
);
```

---

### 5. `borrowings`

Header transaksi peminjaman. Satu record = satu sesi peminjaman (bisa multi-item).

```sql
CREATE TABLE borrowings (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code                    VARCHAR(30) NOT NULL UNIQUE, -- Kode unik: BRW-YYYYMMDD-XXXX
    user_id                 BIGINT UNSIGNED NOT NULL,    -- Siswa peminjam
    approved_by             BIGINT UNSIGNED NULL,        -- Guru/admin yang menyetujui
    return_approved_by      BIGINT UNSIGNED NULL,        -- Guru/admin yang setujui pengembalian

    status                  ENUM(
                                'pending',          -- Menunggu persetujuan guru
                                'approved',         -- Disetujui, barang keluar
                                'rejected',         -- Ditolak guru
                                'returning',        -- Siswa sudah upload foto return, menunggu approval
                                'returned',         -- Pengembalian disetujui
                                'cancelled'         -- Dibatalkan siswa (sebelum approved)
                            ) NOT NULL DEFAULT 'pending',

    purpose                 TEXT NULL,               -- Tujuan peminjaman
    notes                   TEXT NULL,               -- Catatan siswa

    borrow_date             DATE NOT NULL,           -- Tanggal rencana ambil
    expected_return_date    DATE NOT NULL,           -- Tanggal rencana kembali

    approved_at             TIMESTAMP NULL,          -- Kapan guru approve
    rejected_at             TIMESTAMP NULL,          -- Kapan guru reject
    rejection_reason        TEXT NULL,               -- Alasan penolakan

    returned_at             TIMESTAMP NULL,          -- Kapan siswa upload foto return
    return_approved_at      TIMESTAMP NULL,          -- Kapan guru approve pengembalian
    return_notes            TEXT NULL,               -- Catatan pengembalian dari guru

    created_at              TIMESTAMP NULL,
    updated_at              TIMESTAMP NULL,

    CONSTRAINT fk_borrowings_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_borrowings_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_borrowings_return_approved_by
        FOREIGN KEY (return_approved_by) REFERENCES users(id)
        ON DELETE SET NULL
);
```

**Status Flow Diagram:**
```
[Siswa buat peminjaman]
         │
         ▼
      PENDING
      /      \
     ▼        ▼
 APPROVED   REJECTED   ← Guru approve/reject
     │
     │  [Siswa upload selfie return]
     ▼
  RETURNING
     │
     │  [Guru approve pengembalian]
     ▼
  RETURNED

PENDING → CANCELLED   ← Siswa batalkan sebelum diapprove
```

**Indexes:**
```sql
INDEX idx_borrowings_user_id (user_id)
INDEX idx_borrowings_status (status)
INDEX idx_borrowings_code (code)
INDEX idx_borrowings_borrow_date (borrow_date)
INDEX idx_borrowings_approved_by (approved_by)
```

---

### 6. `borrowing_items`

Detail barang dalam satu transaksi peminjaman.

```sql
CREATE TABLE borrowing_items (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    borrowing_id        BIGINT UNSIGNED NOT NULL,
    item_id             BIGINT UNSIGNED NOT NULL,
    quantity            INT UNSIGNED NOT NULL DEFAULT 1,    -- Jumlah dipinjam
    returned_quantity   INT UNSIGNED NOT NULL DEFAULT 0,    -- Jumlah sudah dikembalikan
    item_condition_out  ENUM('baik', 'rusak_ringan', 'rusak_berat') NULL, -- Kondisi saat keluar
    item_condition_in   ENUM('baik', 'rusak_ringan', 'rusak_berat') NULL, -- Kondisi saat kembali
    notes               TEXT NULL,
    created_at          TIMESTAMP NULL,
    updated_at          TIMESTAMP NULL,

    CONSTRAINT fk_borrowing_items_borrowing
        FOREIGN KEY (borrowing_id) REFERENCES borrowings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_borrowing_items_item
        FOREIGN KEY (item_id) REFERENCES items(id)
        ON DELETE RESTRICT
);
```

**Indexes:**
```sql
INDEX idx_borrowing_items_borrowing_id (borrowing_id)
INDEX idx_borrowing_items_item_id (item_id)
```

---

### 7. `borrowing_photos`

Penyimpanan foto selfie saat peminjaman dan pengembalian.

```sql
CREATE TABLE borrowing_photos (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    borrowing_id    BIGINT UNSIGNED NOT NULL,
    type            ENUM('borrow', 'return') NOT NULL,  -- Jenis foto
    path            VARCHAR(255) NOT NULL,               -- Path file di storage
    original_name   VARCHAR(255) NULL,                  -- Nama file asli
    mime_type       VARCHAR(100) NULL,
    size            INT UNSIGNED NULL,                   -- Ukuran file dalam bytes
    uploaded_by     BIGINT UNSIGNED NULL,               -- User yang upload
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    CONSTRAINT fk_borrowing_photos_borrowing
        FOREIGN KEY (borrowing_id) REFERENCES borrowings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_borrowing_photos_user
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON DELETE SET NULL
);
```

**Indexes:**
```sql
INDEX idx_borrowing_photos_borrowing_id (borrowing_id)
INDEX idx_borrowing_photos_type (type)
```

---

### 8. `activity_logs`

Log semua aktivitas penting dalam sistem (audit trail).

```sql
CREATE TABLE activity_logs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NULL,           -- Siapa yang melakukan aksi
    action          VARCHAR(100) NOT NULL,          -- Nama aksi (e.g., 'borrowing.approved')
    description     TEXT NOT NULL,                 -- Deskripsi human-readable
    subject_type    VARCHAR(255) NULL,             -- Nama model yang dikenai aksi
    subject_id      BIGINT UNSIGNED NULL,          -- ID record yang dikenai aksi
    properties      JSON NULL,                     -- Data tambahan (before/after state)
    ip_address      VARCHAR(45) NULL,
    user_agent      TEXT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    CONSTRAINT fk_activity_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
);
```

**Contoh `action` values:**
| action | Keterangan |
|---|---|
| `auth.login` | User login |
| `auth.logout` | User logout |
| `item.created` | Barang baru ditambahkan |
| `item.updated` | Barang diedit |
| `item.deleted` | Barang dihapus |
| `category.created` | Kategori baru |
| `borrowing.created` | Peminjaman dibuat |
| `borrowing.approved` | Peminjaman diapprove guru |
| `borrowing.rejected` | Peminjaman ditolak |
| `borrowing.cancelled` | Peminjaman dibatalkan siswa |
| `return.submitted` | Siswa submit pengembalian |
| `return.approved` | Guru approve pengembalian |
| `user.created` | User baru dibuat admin |
| `user.updated` | Data user diupdate |
| `user.deactivated` | Akun dinonaktifkan |

**Contoh `properties` JSON:**
```json
{
  "before": { "status": "pending", "stock": 5 },
  "after":  { "status": "approved", "stock": 4 },
  "reason": "Disetujui untuk keperluan praktikum"
}
```

**Indexes:**
```sql
INDEX idx_activity_logs_user_id (user_id)
INDEX idx_activity_logs_action (action)
INDEX idx_activity_logs_subject (subject_type, subject_id)
INDEX idx_activity_logs_created_at (created_at)
```

---

## Relasi Antar Tabel

```
users           1 ──< N  borrowings          (user_id)
users           1 ──< N  borrowings          (approved_by)
users           1 ──< N  borrowings          (return_approved_by)
users           1 ──< N  activity_logs       (user_id)
users           1 ──< N  borrowing_photos    (uploaded_by)

categories      1 ──< N  items               (category_id)

items           1 ──< N  borrowing_items     (item_id)
items           1 ──< N  item_images         (item_id)

borrowings      1 ──< N  borrowing_items     (borrowing_id)
borrowings      1 ──< N  borrowing_photos    (borrowing_id)
```

---

## Aturan Stok (Stock Rules)

```
Saat borrowing APPROVED oleh guru:
  UPDATE items SET stock = stock - borrowing_items.quantity
  WHERE id = borrowing_items.item_id

Saat return APPROVED oleh guru:
  UPDATE items SET stock = stock + borrowing_items.returned_quantity
  WHERE id = borrowing_items.item_id

Constraint:
  stock >= 0           ALWAYS
  stock <= stock_total ALWAYS
```

---

## Storage / File Structure

Semua file upload disimpan di Laravel Storage (`storage/app/`), diakses via symbolic link:

```
storage/app/public/
├── items/
│   ├── {item_id}/
│   │   ├── cover.jpg         ← items.image
│   │   └── gallery/
│   │       ├── 01.jpg
│   │       └── 02.jpg        ← item_images.path
├── borrowings/
│   └── {borrowing_id}/
│       ├── borrow/
│       │   └── selfie.jpg    ← borrowing_photos (type=borrow)
│       └── return/
│           └── selfie.jpg    ← borrowing_photos (type=return)
```

**Aturan file upload:**
- Format diterima: `jpg`, `jpeg`, `png`, `webp`
- Ukuran maksimal: 5 MB
- Disimpan dengan nama tersamarkan (UUID) untuk keamanan
- Original filename disimpan di kolom `original_name`

---

## Pertimbangan Indeks & Performance

| Query Sering | Index yang Dibutuhkan |
|---|---|
| Filter borrowings by user | `borrowings.user_id` |
| Filter borrowings by status | `borrowings.status` |
| Filter items by category | `items.category_id` |
| Search items by name | FULLTEXT pada `items.name, description` |
| Activity log by date range | `activity_logs.created_at` |
| Activity log by subject | `activity_logs (subject_type, subject_id)` |
