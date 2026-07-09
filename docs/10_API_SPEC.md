# 10 — API SPECIFICATION
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

> Dokumen ini mendefinisikan spesifikasi teknis RESTful API yang digunakan sebagai jembatan komunikasi antara Frontend SPA dan Backend Laravel.

---

## 1. Standar REST API Best Practice

### 1.1 Base URL
- Development: `http://localhost:8000/api`
- Production: `https://api.inventortkj.sch.id/api`

### 1.2 Format JSON Respons Sukses (Standard Envelope)
```json
{
  "success": true,
  "message": "Pesan deskriptif sukses",
  "data": {}
}
```

### 1.3 Format JSON Respons Sukses dengan Paginasi
```json
{
  "success": true,
  "data": [],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 10,
    "per_page": 15,
    "to": 15,
    "total": 150
  },
  "links": {
    "first": "https://api.../items?page=1",
    "last": "https://api.../items?page=10",
    "prev": null,
    "next": "https://api.../items?page=2"
  }
}
```

### 1.4 Format JSON Respons Error (Validation Fail - 422)
```json
{
  "success": false,
  "message": "Data yang dikirimkan tidak valid",
  "errors": {
    "email": [
      "Email harus berakhiran domain sekolah."
    ]
  }
}
```

### 1.5 Format JSON Respons Error (General Error - 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Detail pesan kesalahan sistem / izin akses ditolak"
}
```

### 1.6 HTTP Status Codes
- `200 OK` - Permintaan sukses diproses.
- `201 Created` - Resource baru berhasil dibuat.
- `204 No Content` - Sukses diproses, tidak ada body response (misal: Delete).
- `400 Bad Request` - Format request salah di sisi client.
- `401 Unauthorized` - Token tidak ada, tidak valid, atau kedaluwarsa.
- `403 Forbidden` - Autentikasi sukses tetapi tidak memiliki hak akses role.
- `404 Not Found` - Resource yang dicari tidak ditemukan.
- `409 Conflict` - Konflik bisnis (misal: stok kosong saat diapprove).
- `422 Unprocessable Entity` - Validasi form gagal di sisi server.
- `500 Internal Server Error` - Terjadi kesalahan internal server.

---

## 2. API Endpoints List & Detail

### 2.1 Autentikasi

#### `POST /auth/google`
- **Deskripsi:** Verifikasi ID Token Google OAuth untuk masuk sistem.
- **Authentication:** None (Public)
- **Request Body:**
  ```json
  {
    "token": "string (Wajib, ID Token Google)"
  }
  ```
- **Validation Rules:**
  - `token`: `required|string`
- **Response `200 OK` (Sukses Login):**
  ```json
  {
    "success": true,
    "message": "Login berhasil",
    "data": {
      "token": "1|sanctum_token_key_here...",
      "user": {
        "id": 1,
        "name": "Siswa TKJ",
        "email": "siswa@school.sch.id",
        "role": "siswa",
        "avatar": "https://lh3.googleusercontent.com/..."
      }
    }
  }
  ```
- **Response `422 Unprocessable Entity`:** Token kosong atau format salah.
- **Response `403 Forbidden`:** Akun diblokir (`is_active = false`).

---

### 2.2 Inventaris Barang

#### `GET /items`
- **Deskripsi:** Mendapatkan daftar barang inventaris.
- **Authentication:** Sanctum Token
- **Filtering, Pagination, & Sorting Query Params:**
  - `page`: `integer` (Default: 1)
  - `per_page`: `integer` (Default: 15)
  - `search`: `string` (Mencari nama, brand, model)
  - `category_id`: `integer` (Filter kategori)
  - `condition`: `string` (Filter: `baik`, `rusak_ringan`, `rusak_berat`)
  - `available`: `boolean` (Filter: `true` hanya menampilkan barang stok > 0)
  - `sort_by`: `string` (Pilihan: `name`, `stock`, `created_at`)
  - `sort_order`: `string` (Pilihan: `asc`, `desc`)
- **Response `200 OK`:** Menghasilkan struktur Envelope Pagination.

#### `POST /items`
- **Deskripsi:** Menambahkan barang baru.
- **Authentication:** Sanctum Token (`role: guru, admin`)
- **Request (Multipart/Form-Data):**
  - `category_id`: `required|exists:categories,id`
  - `name`: `required|string|max:255`
  - `description`: `nullable|string`
  - `brand`: `nullable|string|max:100`
  - `model`: `nullable|string|max:100`
  - `stock`: `required|integer|min:0`
  - `stock_total`: `required|integer|min:stock` (Total tidak boleh kurang dari stok)
  - `stock_minimum`: `nullable|integer|min:1`
  - `condition`: `required|in:baik,rusak_ringan,rusak_berat`
  - `location`: `nullable|string|max:100`
  - `image`: `nullable|file|image|mimes:jpeg,png,jpg,webp|max:5120`
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Barang berhasil ditambahkan",
    "data": {
      "id": 10,
      "name": "Router Board",
      "stock": 5,
      "stock_total": 5,
      "condition": "baik"
    }
  }
  ```

---

### 2.3 Transaksi Peminjaman

#### `POST /borrowings`
- **Deskripsi:** Siswa mengajukan peminjaman beberapa barang sekaligus.
- **Authentication:** Sanctum Token (`role: siswa`)
- **Request Body:**
  ```json
  {
    "purpose": "Praktikum Jaringan Cisco Kelas XI",
    "borrow_date": "2026-07-07",
    "expected_return_date": "2026-07-09",
    "notes": "Catatan tambahan siswa",
    "items": [
      {
        "item_id": 1,
        "quantity": 2
      },
      {
        "item_id": 3,
        "quantity": 1
      }
    ]
  }
  ```
- **Validation Rules:**
  - `purpose`: `required|string|min:10`
  - `borrow_date`: `required|date|after_or_equal:today`
  - `expected_return_date`: `required|date|after:borrow_date`
  - `items`: `required|array|min:1`
  - `items.*.item_id`: `required|exists:items,id`
  - `items.*.quantity`: `required|integer|min:1`
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Pengajuan peminjaman berhasil dibuat",
    "data": {
      "id": 5,
      "code": "BRW-20260706-0005",
      "status": "pending"
    }
  }
  ```
- **Response `409 Conflict`:** Stok tidak mencukupi untuk salah satu item yang diminta.

#### `PATCH /borrowings/{id}/cancel`
- **Deskripsi:** Membatalkan transaksi peminjaman (hanya untuk status pending milik sendiri).
- **Authentication:** Sanctum Token (`role: siswa`) + Policy
- **Response `200 OK`:** Status sukses dibatalkan (`status = cancelled`).

#### `POST /borrowings/{id}/photos`
- **Deskripsi:** Upload foto selfie untuk bukti serah terima (saat ambil/kembali).
- **Authentication:** Sanctum Token (`role: siswa`) + Policy
- **Request (Multipart/Form-Data):**
  - `photo`: `required|file|image|mimes:jpeg,png,jpg,webp|max:5120`
  - `type`: `required|in:borrow,return`
- **Response `201 Created`:**
  ```json
  {
    "success": true,
    "message": "Foto bukti berhasil diunggah",
    "data": {
      "photo_id": 12,
      "type": "return",
      "borrowing_status": "returning"
    }
  }
  ```

---

### 2.4 Workflow Approval (Guru/Admin)

#### `PATCH /admin/borrowings/{id}/approve`
- **Deskripsi:** Guru menyetujui peminjaman (status pending -> approved, potong stok).
- **Authentication:** Sanctum Token (`role: guru, admin`)
- **Request Body:**
  ```json
  {
    "notes": "Disetujui, harap kembalikan tepat waktu"
  }
  ```
- **Response `200 OK`:** Status berubah menjadi `approved`. Stok fisik barang terpotong.

#### `PATCH /admin/borrowings/{id}/reject`
- **Deskripsi:** Guru menolak peminjaman.
- **Authentication:** Sanctum Token (`role: guru, admin`)
- **Request Body:**
  ```json
  {
    "rejection_reason": "Alasan penolakan pengajuan wajib diisi"
  }
  ```
- **Validation Rules:**
  - `rejection_reason`: `required|string|min:10`
- **Response `200 OK`:** Status berubah menjadi `rejected`.

#### `PATCH /admin/borrowings/{id}/approve-return`
- **Deskripsi:** Guru mengonfirmasi pengembalian barang fisik.
- **Authentication:** Sanctum Token (`role: guru, admin`)
- **Request Body:**
  ```json
  {
    "return_notes": "Barang kembali lengkap",
    "items": [
      {
        "borrowing_item_id": 15,
        "returned_quantity": 2,
        "item_condition_in": "baik"
      }
    ]
  }
  ```
- **Validation Rules:**
  - `items`: `required|array`
  - `items.*.borrowing_item_id`: `required|exists:borrowing_items,id`
  - `items.*.returned_quantity`: `required|integer|min:1`
  - `items.*.item_condition_in`: `required|in:baik,rusak_ringan,rusak_berat`
- **Response `200 OK`:** Status menjadi `returned`. Stok barang dikembalikan ke inventaris.
