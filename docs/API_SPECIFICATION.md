# API_SPECIFICATION.md — Inventory TKJ

> Spesifikasi REST API lengkap untuk backend Laravel 13 + Sanctum.
> Base URL: `http://localhost:8000/api` (dev) · `https://api.inventortkj.sch.id/api` (prod)

---

## Konvensi Umum

### Authentication
Semua endpoint protected menggunakan **Laravel Sanctum Bearer Token**:
```
Authorization: Bearer {token}
```

### Request Format
```
Content-Type: application/json
Accept: application/json
```

### Response Format — Success
```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": { ... }
}
```

### Response Format — Success dengan Pagination
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  }
}
```

### Response Format — Error
```json
{
  "success": false,
  "message": "Pesan error",
  "errors": {
    "field": ["Pesan validasi"]
  }
}
```

### HTTP Status Codes
| Code | Keterangan |
|---|---|
| 200 | OK — Berhasil |
| 201 | Created — Data berhasil dibuat |
| 204 | No Content — Berhasil tanpa response body |
| 400 | Bad Request — Input tidak valid |
| 401 | Unauthorized — Tidak terautentikasi |
| 403 | Forbidden — Tidak memiliki izin |
| 404 | Not Found — Data tidak ditemukan |
| 409 | Conflict — Konflik data (stok habis, dll.) |
| 422 | Unprocessable Entity — Validasi gagal |
| 500 | Internal Server Error |

### Role & Permission
| Role | Kode | Akses |
|---|---|---|
| Siswa | `siswa` | Buat peminjaman, upload foto, lihat status |
| Guru | `guru` | Approve/reject, CRUD barang, lihat semua data |
| Admin | `admin` | Semua akses + manajemen user |

---

## Endpoint Groups

### 1. Authentication

#### `POST /api/auth/google`
Login via Google OAuth. Tidak memerlukan token.

**Request Body:**
```json
{
  "token": "google_id_token_dari_frontend"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "1|sanctum_token_string...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "Budi Santoso",
      "email": "budi@students.sch.id",
      "role": "siswa",
      "avatar": "https://lh3.googleusercontent.com/...",
      "nis_nip": "2023001"
    }
  }
}
```

---

#### `POST /api/auth/logout`
Logout — hapus token aktif. **Auth required.**

**Response 200:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

#### `GET /api/auth/me`
Mendapatkan data user yang sedang login. **Auth required.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@students.sch.id",
    "role": "siswa",
    "avatar": "https://...",
    "nis_nip": "2023001",
    "phone": "08123456789",
    "is_active": true,
    "created_at": "2024-07-01T08:00:00Z"
  }
}
```

---

### 2. Categories

#### `GET /api/categories`
Daftar semua kategori. **Auth required.**

**Query Params:**
| Param | Type | Default | Keterangan |
|---|---|---|---|
| `search` | string | - | Cari nama kategori |
| `per_page` | int | 15 | Jumlah per halaman |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Perangkat Jaringan",
      "slug": "perangkat-jaringan",
      "description": "...",
      "items_count": 12,
      "created_at": "2024-07-01T08:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/categories`
Buat kategori baru. **Auth: guru/admin.**

**Request Body:**
```json
{
  "name": "Perangkat Jaringan",
  "description": "Deskripsi opsional"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Kategori berhasil dibuat",
  "data": { "id": 1, "name": "Perangkat Jaringan", "slug": "perangkat-jaringan", ... }
}
```

---

#### `GET /api/categories/{id}`
Detail kategori. **Auth required.**

#### `PUT /api/categories/{id}`
Update kategori. **Auth: guru/admin.**

**Request Body:** sama dengan POST.

#### `DELETE /api/categories/{id}`
Hapus kategori. **Auth: admin.**
> Gagal (409) jika masih ada barang aktif di kategori ini.

---

### 3. Items (Barang)

#### `GET /api/items`
Daftar barang inventaris. **Auth required.**

**Query Params:**
| Param | Type | Default | Keterangan |
|---|---|---|---|
| `search` | string | - | Cari nama/brand/model |
| `category_id` | int | - | Filter per kategori |
| `condition` | string | - | Filter kondisi: `baik`, `rusak_ringan`, `rusak_berat` |
| `available` | bool | - | Hanya tampilkan stok > 0 |
| `per_page` | int | 15 | Jumlah per halaman |
| `sort` | string | `name` | Urutan: `name`, `stock`, `created_at` |
| `order` | string | `asc` | `asc` atau `desc` |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": { "id": 1, "name": "Perangkat Jaringan" },
      "name": "Cisco Switch 24 Port",
      "slug": "cisco-switch-24-port",
      "brand": "Cisco",
      "model": "WS-C2960X-24TS-L",
      "stock": 3,
      "stock_total": 5,
      "condition": "baik",
      "location": "Gudang TKJ A",
      "is_available": true,
      "image": "https://api.../storage/items/1/cover.jpg",
      "created_at": "..."
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/items`
Tambah barang baru. **Auth: guru/admin.**

**Request:** `multipart/form-data`
| Field | Type | Required | Keterangan |
|---|---|---|---|
| `category_id` | int | ✅ | ID kategori |
| `name` | string | ✅ | Nama barang |
| `description` | string | ❌ | Deskripsi |
| `brand` | string | ❌ | Merek |
| `model` | string | ❌ | Nomor model/seri |
| `stock` | int | ✅ | Stok awal |
| `stock_total` | int | ✅ | Total stok fisik |
| `stock_minimum` | int | ❌ | Default: 1 |
| `condition` | string | ✅ | `baik`, `rusak_ringan`, `rusak_berat` |
| `location` | string | ❌ | Lokasi penyimpanan |
| `image` | file | ❌ | Foto utama (max 5MB) |

**Response 201:** item object lengkap.

---

#### `GET /api/items/{id}`
Detail barang termasuk galeri foto. **Auth required.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cisco Switch 24 Port",
    "images": [
      { "id": 1, "path": "https://...", "order": 0 }
    ],
    ...
  }
}
```

---

#### `PUT /api/items/{id}`
Update data barang. **Auth: guru/admin.**
Request format sama dengan POST.

#### `DELETE /api/items/{id}`
Hapus barang. **Auth: admin.**
> Gagal (409) jika masih ada peminjaman aktif untuk barang ini.

---

#### `POST /api/items/{id}/images`
Upload gambar tambahan barang. **Auth: guru/admin.**

**Request:** `multipart/form-data`
| Field | Type | Required |
|---|---|---|
| `images[]` | file[] | ✅ |

---

#### `DELETE /api/items/{id}/images/{imageId}`
Hapus gambar barang. **Auth: guru/admin.**

---

### 4. Borrowings (Peminjaman)

#### `GET /api/borrowings`
Daftar peminjaman. **Auth required.**
- Siswa: hanya melihat peminjaman miliknya sendiri.
- Guru/Admin: melihat semua peminjaman.

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `status` | string | Filter status: `pending`, `approved`, dll. |
| `user_id` | int | Filter per user (guru/admin only) |
| `date_from` | date | Filter tanggal dari |
| `date_to` | date | Filter tanggal sampai |
| `search` | string | Cari kode atau nama peminjam |
| `per_page` | int | Default: 15 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "BRW-20240701-0001",
      "user": { "id": 2, "name": "Budi Santoso", "nis_nip": "2023001" },
      "status": "pending",
      "items_count": 2,
      "borrow_date": "2024-07-01",
      "expected_return_date": "2024-07-03",
      "created_at": "..."
    }
  ],
  "meta": { ... }
}
```

---

#### `POST /api/borrowings`
Buat pengajuan peminjaman baru. **Auth: siswa.**

**Request Body:**
```json
{
  "purpose": "Untuk praktikum jaringan kelas XI",
  "borrow_date": "2024-07-01",
  "expected_return_date": "2024-07-03",
  "notes": "Catatan opsional",
  "items": [
    { "item_id": 1, "quantity": 2 },
    { "item_id": 3, "quantity": 1 }
  ]
}
```

**Validasi:**
- `borrow_date` tidak boleh di masa lalu
- `expected_return_date` harus setelah `borrow_date`
- Setiap item harus memiliki stok yang cukup
- Siswa tidak boleh punya peminjaman aktif (status `approved`) untuk item yang sama

**Response 201:**
```json
{
  "success": true,
  "message": "Pengajuan peminjaman berhasil dikirim",
  "data": {
    "id": 1,
    "code": "BRW-20240701-0001",
    "status": "pending",
    ...
  }
}
```

---

#### `GET /api/borrowings/{id}`
Detail peminjaman lengkap. **Auth required.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "BRW-20240701-0001",
    "user": { ... },
    "status": "approved",
    "purpose": "Praktikum jaringan",
    "borrow_date": "2024-07-01",
    "expected_return_date": "2024-07-03",
    "approved_at": "2024-07-01T09:00:00Z",
    "approved_by": { "id": 5, "name": "Pak Andi" },
    "items": [
      {
        "id": 1,
        "item": { "id": 1, "name": "Cisco Switch 24 Port" },
        "quantity": 2,
        "returned_quantity": 0,
        "item_condition_out": "baik"
      }
    ],
    "photos": {
      "borrow": [{ "id": 1, "url": "https://..." }],
      "return": []
    }
  }
}
```

---

#### `PATCH /api/borrowings/{id}/cancel`
Batalkan peminjaman. **Auth: siswa (pemilik).**
> Hanya bisa jika status masih `pending`.

**Response 200:** borrowing object dengan status `cancelled`.

---

#### `POST /api/borrowings/{id}/photos`
Upload foto selfie (saat ambil atau saat kembalikan). **Auth: siswa (pemilik).**

**Request:** `multipart/form-data`
| Field | Type | Required | Keterangan |
|---|---|---|---|
| `photo` | file | ✅ | Foto selfie (max 5MB) |
| `type` | string | ✅ | `borrow` atau `return` |

> Untuk `type=return`: status harus `approved`. Setelah upload berhasil, status otomatis berubah ke `returning`.

**Response 201:**
```json
{
  "success": true,
  "message": "Foto berhasil diupload",
  "data": {
    "photo_id": 1,
    "url": "https://...",
    "borrowing_status": "returning"
  }
}
```

---

### 5. Admin — Approval Peminjaman

#### `PATCH /api/admin/borrowings/{id}/approve`
Setujui pengajuan peminjaman. **Auth: guru/admin.**
> Status harus `pending`. Stok berkurang otomatis saat approve.

**Request Body:**
```json
{
  "notes": "Catatan opsional dari guru"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Peminjaman disetujui",
  "data": {
    "id": 1,
    "status": "approved",
    "approved_at": "2024-07-01T09:00:00Z",
    "approved_by": { "id": 5, "name": "Pak Andi" }
  }
}
```

---

#### `PATCH /api/admin/borrowings/{id}/reject`
Tolak pengajuan peminjaman. **Auth: guru/admin.**

**Request Body:**
```json
{
  "rejection_reason": "Alasan penolakan wajib diisi"
}
```

**Response 200:** borrowing dengan status `rejected`.

---

#### `PATCH /api/admin/borrowings/{id}/approve-return`
Setujui pengembalian barang. **Auth: guru/admin.**
> Status harus `returning`. Stok bertambah otomatis saat approve.

**Request Body:**
```json
{
  "return_notes": "Catatan kondisi barang saat kembali",
  "items": [
    {
      "borrowing_item_id": 1,
      "returned_quantity": 2,
      "item_condition_in": "baik"
    }
  ]
}
```

**Response 200:** borrowing dengan status `returned`.

---

### 6. Dashboard

#### `GET /api/dashboard`
Data statistik untuk halaman dashboard. **Auth: guru/admin.**

**Response 200:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_items": 145,
      "total_categories": 8,
      "total_users": 230,
      "active_borrowings": 12,
      "pending_approvals": 5,
      "items_low_stock": 3
    },
    "recent_borrowings": [
      {
        "id": 10,
        "code": "BRW-20240701-0010",
        "user": { "name": "Siti Aisyah" },
        "status": "pending",
        "items_count": 2,
        "created_at": "..."
      }
    ],
    "recent_activity": [
      {
        "action": "borrowing.approved",
        "description": "Peminjaman BRW-0009 disetujui",
        "user": { "name": "Pak Andi" },
        "created_at": "..."
      }
    ],
    "borrowings_chart": [
      { "date": "2024-07-01", "count": 5 },
      { "date": "2024-07-02", "count": 8 }
    ]
  }
}
```

---

### 7. Users (Manajemen Pengguna)

#### `GET /api/users`
Daftar pengguna. **Auth: admin.**

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `search` | string | Cari nama atau email |
| `role` | string | Filter: `siswa`, `guru`, `admin` |
| `is_active` | bool | Filter aktif/nonaktif |
| `per_page` | int | Default: 15 |

---

#### `POST /api/users`
Buat user manual (tanpa OAuth). **Auth: admin.**

**Request Body:**
```json
{
  "name": "Nama User",
  "email": "user@sch.id",
  "role": "guru",
  "nis_nip": "198001012005011001",
  "phone": "08123456789",
  "password": "password_sementara"
}
```

---

#### `GET /api/users/{id}`
Detail user. **Auth: admin.**

#### `PUT /api/users/{id}`
Update data user. **Auth: admin.**

#### `PATCH /api/users/{id}/toggle-active`
Aktifkan/nonaktifkan akun user. **Auth: admin.**

---

### 8. Activity Logs

#### `GET /api/activity-logs`
Log aktivitas sistem. **Auth: guru/admin.**

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `action` | string | Filter aksi tertentu |
| `user_id` | int | Filter per user |
| `date_from` | date | Dari tanggal |
| `date_to` | date | Sampai tanggal |
| `per_page` | int | Default: 30 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "action": "borrowing.approved",
      "description": "Guru Pak Andi menyetujui peminjaman BRW-20240701-0001",
      "user": { "id": 5, "name": "Pak Andi", "role": "guru" },
      "subject_type": "App\\Models\\Borrowing",
      "subject_id": 1,
      "properties": { "before": { "status": "pending" }, "after": { "status": "approved" } },
      "ip_address": "192.168.1.10",
      "created_at": "2024-07-01T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

---

## Ringkasan Semua Endpoint

| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/api/auth/google` | Public | Login Google OAuth |
| POST | `/api/auth/logout` | All | Logout |
| GET | `/api/auth/me` | All | User aktif |
| GET | `/api/categories` | All | Daftar kategori |
| POST | `/api/categories` | guru/admin | Buat kategori |
| GET | `/api/categories/{id}` | All | Detail kategori |
| PUT | `/api/categories/{id}` | guru/admin | Update kategori |
| DELETE | `/api/categories/{id}` | admin | Hapus kategori |
| GET | `/api/items` | All | Daftar barang |
| POST | `/api/items` | guru/admin | Tambah barang |
| GET | `/api/items/{id}` | All | Detail barang |
| PUT | `/api/items/{id}` | guru/admin | Update barang |
| DELETE | `/api/items/{id}` | admin | Hapus barang |
| POST | `/api/items/{id}/images` | guru/admin | Upload gambar barang |
| DELETE | `/api/items/{id}/images/{imgId}` | guru/admin | Hapus gambar |
| GET | `/api/borrowings` | All | Daftar peminjaman |
| POST | `/api/borrowings` | siswa | Buat peminjaman |
| GET | `/api/borrowings/{id}` | All | Detail peminjaman |
| PATCH | `/api/borrowings/{id}/cancel` | siswa | Batalkan peminjaman |
| POST | `/api/borrowings/{id}/photos` | siswa | Upload foto selfie |
| PATCH | `/api/admin/borrowings/{id}/approve` | guru/admin | Approve peminjaman |
| PATCH | `/api/admin/borrowings/{id}/reject` | guru/admin | Tolak peminjaman |
| PATCH | `/api/admin/borrowings/{id}/approve-return` | guru/admin | Approve pengembalian |
| GET | `/api/dashboard` | guru/admin | Data dashboard |
| GET | `/api/users` | admin | Daftar user |
| POST | `/api/users` | admin | Buat user |
| GET | `/api/users/{id}` | admin | Detail user |
| PUT | `/api/users/{id}` | admin | Update user |
| PATCH | `/api/users/{id}/toggle-active` | admin | Aktif/nonaktif |
| GET | `/api/activity-logs` | guru/admin | Log aktivitas |
| GET | `/api/reports/borrowings` | guru/admin | Laporan peminjaman (JSON) |
| GET | `/api/reports/borrowings/export` | guru/admin | Export Excel laporan peminjaman |
| GET | `/api/reports/returns` | guru/admin | Laporan pengembalian (JSON) |
| GET | `/api/reports/returns/export` | guru/admin | Export Excel laporan pengembalian |
| GET | `/api/reports/inventory` | guru/admin | Laporan inventaris (JSON) |
| GET | `/api/reports/inventory/export` | guru/admin | Export Excel laporan inventaris |

---

### 9. Reports (Laporan)

#### `GET /api/reports/borrowings`
Laporan peminjaman dengan filter. **Auth: guru/admin.**

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `date_from` | date | Filter dari tanggal pinjam |
| `date_to` | date | Filter sampai tanggal pinjam |
| `status` | string | Filter status: `pending`, `approved`, `rejected`, `returning`, `returned`, `cancelled` |
| `per_page` | int | Default: 15 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "BRW-20240701-0001",
      "user": { "id": 2, "name": "Budi Santoso", "nis_nip": "2023001" },
      "status": "returned",
      "status_label": "Dikembalikan",
      "purpose": "Praktikum jaringan",
      "borrow_date": "2024-07-01",
      "expected_return_date": "2024-07-03",
      "items_count": 2,
      "items": [
        { "name": "Cisco Switch 24 Port", "quantity": 2 }
      ],
      "approved_by": "Pak Andi",
      "approved_at": "2024-07-01 09:00",
      "created_at": "2024-07-01 08:30"
    }
  ],
  "meta": { "current_page": 1, "per_page": 15, "total": 100, "last_page": 7 }
}
```

---

#### `GET /api/reports/borrowings/export`
Download Excel laporan peminjaman. **Auth: guru/admin.**

**Query Params:** sama dengan `/api/reports/borrowings` (tanpa `per_page`).

**Response:** File `.xlsx` (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

#### `GET /api/reports/returns`
Laporan pengembalian (hanya status `returned`). **Auth: guru/admin.**

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `date_from` | date | Filter dari tanggal konfirmasi pengembalian |
| `date_to` | date | Filter sampai tanggal konfirmasi pengembalian |
| `per_page` | int | Default: 15 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "BRW-20240701-0001",
      "user": { "id": 2, "name": "Budi Santoso", "nis_nip": "2023001" },
      "borrow_date": "2024-07-01",
      "expected_return_date": "2024-07-03",
      "return_approved_at": "2024-07-03 14:00",
      "return_approved_by": "Pak Andi",
      "return_notes": "Barang kembali lengkap",
      "items": [
        {
          "name": "Cisco Switch 24 Port",
          "quantity": 2,
          "returned_quantity": 2,
          "condition_in": "baik",
          "condition_label": "Baik"
        }
      ],
      "created_at": "2024-07-01 08:30"
    }
  ],
  "meta": { ... }
}
```

---

#### `GET /api/reports/returns/export`
Download Excel laporan pengembalian. **Auth: guru/admin.**

**Query Params:** sama dengan `/api/reports/returns` (tanpa `per_page`).

**Response:** File `.xlsx`

---

#### `GET /api/reports/inventory`
Laporan inventaris barang. **Auth: guru/admin.**

**Query Params:**
| Param | Type | Keterangan |
|---|---|---|
| `category_id` | int | Filter per kategori |
| `condition` | string | Filter kondisi: `baik`, `rusak_ringan`, `rusak_berat` |
| `per_page` | int | Default: 15 |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cisco Switch 24 Port",
      "category": { "id": 1, "name": "Perangkat Jaringan" },
      "brand": "Cisco",
      "model": "WS-C2960X",
      "stock": 3,
      "stock_total": 5,
      "stock_minimum": 1,
      "condition": "baik",
      "condition_label": "Baik",
      "location": "Lemari Jaringan",
      "is_available": true,
      "created_at": "2024-07-01"
    }
  ],
  "categories": [
    { "id": 1, "name": "Perangkat Jaringan" }
  ],
  "meta": { ... }
}
```

---

#### `GET /api/reports/inventory/export`
Download Excel laporan inventaris. **Auth: guru/admin.**

**Query Params:** sama dengan `/api/reports/inventory` (tanpa `per_page`).

**Response:** File `.xlsx`

---

## Middleware & Guard

```php
// routes/api.php structure

Route::prefix('auth')->group(function () {
    Route::post('google', [AuthController::class, 'googleLogin']);    // public
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me',     [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {

    // Semua user
    Route::apiResource('categories', CategoryController::class)->only(['index', 'show']);
    Route::apiResource('items',      ItemController::class)->only(['index', 'show']);
    Route::get('borrowings',         [BorrowingController::class, 'index']);
    Route::get('borrowings/{id}',    [BorrowingController::class, 'show']);

    // Siswa only
    Route::middleware('role:siswa')->group(function () {
        Route::post('borrowings',                    [BorrowingController::class, 'store']);
        Route::patch('borrowings/{id}/cancel',       [BorrowingController::class, 'cancel']);
        Route::post('borrowings/{id}/photos',        [BorrowingController::class, 'uploadPhoto']);
    });

    // Guru & Admin
    Route::middleware('role:guru,admin')->group(function () {
        Route::apiResource('categories', CategoryController::class)->except(['index', 'show', 'destroy']);
        Route::apiResource('items',      ItemController::class)->except(['index', 'show', 'destroy']);
        Route::post('items/{id}/images',             [ItemController::class, 'uploadImage']);
        Route::delete('items/{id}/images/{imgId}',   [ItemController::class, 'deleteImage']);
        Route::get('dashboard',                      [DashboardController::class, 'index']);
        Route::get('activity-logs',                  [ActivityLogController::class, 'index']);

        Route::prefix('admin/borrowings')->group(function () {
            Route::patch('{id}/approve',             [BorrowingAdminController::class, 'approve']);
            Route::patch('{id}/reject',              [BorrowingAdminController::class, 'reject']);
            Route::patch('{id}/approve-return',      [BorrowingAdminController::class, 'approveReturn']);
        });
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::delete('categories/{id}',             [CategoryController::class, 'destroy']);
        Route::delete('items/{id}',                  [ItemController::class, 'destroy']);
        Route::apiResource('users', UserController::class);
        Route::patch('users/{id}/toggle-active',     [UserController::class, 'toggleActive']);
    });
});
```
