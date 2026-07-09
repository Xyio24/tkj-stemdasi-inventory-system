# STOCK-REMASTER-TODO.md

> Checklist implementasi Stock & Return Condition Remaster.
> Kerjakan berurutan per phase. Jangan lanjut ke phase berikutnya sebelum phase sebelumnya selesai.
> Lihat detail teknis di: `docs/STOCK-REMASTER-IMPLEMENTATION-PLAN.md`

---

## Phase 1 — Backend Foundation ✅ SELESAI

### Migration

- [x] **Migration baru** `create_borrowing_item_returns_table`
  - Kolom: `id`, `borrowing_item_id` (FK → `borrowing_items.id`, CASCADE), `condition` ENUM(`baik`, `rusak_ringan`, `rusak_berat`, `hilang`, `terpakai`), `quantity` TINYINT UNSIGNED, `notes` TEXT nullable, `timestamps`
  - Index: `borrowing_item_id`, `condition`

- [x] **Migration baru** `add_stock_condition_columns_to_items_table`
  - Tambah: `type` ENUM(`non_consumable`, `consumable`) default `non_consumable`
  - Tambah: `stock_baik` UNSIGNED TINYINT default 0
  - Tambah: `stock_rusak_ringan` UNSIGNED TINYINT default 0
  - Tambah: `stock_rusak_berat` UNSIGNED TINYINT default 0
  - Tambah: `stock_hilang` UNSIGNED TINYINT default 0
  - Data migration: `stock_baik = stock` untuk semua item yang sudah ada

### Model

- [x] **Buat Model `BorrowingItemReturn`**
  - `$fillable`: `borrowing_item_id`, `condition`, `quantity`, `notes`
  - Relasi `borrowingItem()` → `belongsTo(BorrowingItem::class)`

- [x] **Update Model `Item`**
  - Tambah ke `$fillable`: `type`, `stock_baik`, `stock_rusak_ringan`, `stock_rusak_berat`, `stock_hilang`
  - Tambah method `availableStock(): int` → return `stock_baik`
  - Tambah method `syncStock(): void` → `stock = stock_baik + stock_rusak_ringan + stock_rusak_berat`
  - Tambah method `updateConditionFromMajority(): void` → kondisi mayoritas dari breakdown, prioritas `rusak_berat > rusak_ringan > baik` saat seri

- [x] **Update Model `BorrowingItem`**
  - Tambah relasi `returnConditions()` → `hasMany(BorrowingItemReturn::class)`

---

## Phase 2 — Backend Logic Update ✅ SELESAI

### Request

- [x] **Update `ApproveReturnRequest`**
  - Ubah struktur: ganti `items[].returned_quantity` + `items[].item_condition_in` dengan `items[].return_conditions[].condition` + `items[].return_conditions[].quantity` + `items[].return_conditions[].notes` (nullable)
  - Validasi: `condition` harus valid enum, `quantity` min 1

### Service

- [x] **Update `BorrowingApprovalService::approve()`**
  - Ganti validasi stok dari `$item->stock` ke `$item->stock_baik`
  - Update pesan error untuk menyebut "stok kondisi baik"

- [x] **Update `BorrowingApprovalService::approveReturn()`**
  - Untuk setiap item, iterasi `return_conditions`
  - Validasi total qty == `borrowItem->quantity`
  - Simpan tiap kondisi ke `BorrowingItemReturn`
  - Update stok breakdown sesuai kondisi:
    - `baik` → `stock_baik += qty`, `stock += qty`
    - `rusak_ringan` → `stock_rusak_ringan += qty`, `stock += qty`
    - `rusak_berat` → `stock_rusak_berat += qty`, `stock += qty`
    - `hilang` → `stock_hilang += qty` (stock tidak bertambah)
    - `terpakai` → tidak ada perubahan stok
  - Set `borrowItem->returned_quantity` = total kembali (tidak termasuk `hilang`)
  - Set `borrowItem->item_condition_in` = kondisi mayoritas dari return_conditions
  - Panggil `item->syncStock()`
  - Panggil `item->updateConditionFromMajority()`

### Resource

- [x] **Update `BorrowingResource`**
  - Di bagian `items`, tambah `return_conditions` (from `borrowingItems.returnConditions` relation) saat loaded
  - Tambah field `type` dari item
  - Update `BorrowingController::show()` dan `BorrowingAdminController::approveReturn()` untuk load `borrowingItems.returnConditions`
  - Update `BorrowingItem` extend `Pivot` (bukan `Model`) + `$incrementing = true`
  - Update `Borrowing::items()` pakai `->using(BorrowingItem::class)`

---

## Phase 3 — Backend Stock Condition ✅ SELESAI

### Controller

- [x] **Buat `StockConditionController`**

- [x] **`GET /api/items/stock-conditions`** (guru + admin)
  - Query `Item` dengan kolom breakdown stok
  - Filter: `search` (nama/brand), `category_id`, `has_damage` (boolean — hanya yang `stock_rusak_ringan > 0` atau `stock_rusak_berat > 0` atau `stock_hilang > 0`)
  - Paginate, response include semua kolom stock breakdown

- [x] **`POST /api/items/{item}/adjust-condition`** (admin only)
  - Input: `from_condition`, `to_condition`, `quantity`, `notes` (nullable)
  - Validasi: `from_condition` != `to_condition`
  - Validasi: qty yang dipindah tidak melebihi stok di `from_condition`
  - Update kolom breakdown (decrement from, increment to)
  - Panggil `item->syncStock()`
  - Panggil `item->updateConditionFromMajority()`
  - Activity log: `item.condition_adjusted`

### Item Controller

- [x] **Update `ItemController::store()` dan `update()`**
  - Tambah validasi `type`: `in:non_consumable,consumable`
  - Tambah `type` ke response
  - `store()`: set `stock_baik = stock_total` saat create
  - `update()`: `stock_baik` ikut naik/turun proporsional dengan diff `stock_total`

### Routes

- [x] **Update `routes/api.php`**
  - Tambah: `GET /items/stock-conditions` (semua auth) — didaftarkan SEBELUM `items/{item}`
  - Tambah: `POST /items/{item}/adjust-condition` (role: admin)

---

## Phase 4 — Frontend ✅ SELESAI

### Tipe & API Layer

- [x] **Update tipe `Item`** (di `api/inventory.ts`)
  - Tambah: `type: 'non_consumable' | 'consumable'`
  - Tambah: `stock_baik`, `stock_rusak_ringan`, `stock_rusak_berat`, `stock_hilang`

- [x] **Update `api/borrowing.ts`**
  - Tambah interface `ReturnConditionEntry`: `{ condition, quantity, notes? }`
  - Update interface `ApproveReturnItemPayload`: ganti `returned_quantity` + `item_condition_in` dengan `return_conditions: ReturnConditionEntry[]`
  - Tambah field `type` dan `return_conditions` ke `BorrowingItemDetail`

- [x] **Buat `api/stockCondition.ts`**
  - `getStockConditions(params)` → GET `/items/stock-conditions`
  - `adjustItemCondition(itemId, data)` → POST `/items/{id}/adjust-condition`

### Komponen

- [x] **Buat `components/inventory/AdjustConditionModal.tsx`**
  - Props: `item`, `isOpen`, `onClose`
  - Tampilkan ringkasan stok per kondisi
  - Form: `from_condition`, `to_condition`, `quantity` (max = stok di from), `notes`
  - Validasi: from != to, qty valid
  - Invalidate query `stock-conditions` dan `items` on success

### Halaman

- [x] **Update `pages/borrowing/BorrowingDetail.tsx`**
  - Section konfirmasi pengembalian: breakdown per kondisi dengan add/remove baris
  - Counter real-time total qty per item vs qty dipinjam
  - Tombol konfirmasi disabled jika total tidak sesuai
  - Support consumable: opsi kondisi tambah `terpakai`

- [x] **Update `pages/inventory/ItemForm.tsx`**
  - Tambah field "Jenis Barang": radio Non-Consumable / Consumable
  - Default: `non_consumable`

- [x] **Update `pages/inventory/ItemList.tsx`**
  - Tambah tab "Kondisi Stok" di samping "Semua Barang"
  - Tabel breakdown: Barang | Total | Baik | Rusak Ringan | Rusak Berat | Hilang | Kondisi | Aksi
  - Filter: search, has_damage toggle
  - Tombol "Koreksi" (admin only) → buka `AdjustConditionModal`

---

## Catatan

- Kerjakan phase secara berurutan
- Setelah Phase 1 selesai, jalankan `php artisan migrate` dan pastikan data lama ter-migrate dengan benar (cek `stock_baik = stock` untuk semua item)
- Setelah Phase 2 selesai, test manual: buat peminjaman → approve → return → konfirmasi dengan breakdown kondisi campuran
- Data `borrowing_items.item_condition_in` lama tidak perlu dimigrasi — tetap terbaca sebagai data historis
- `stock_total` tidak berubah saat consumable dipakai — `stock_total` adalah total pengadaan sejak awal
- Saat barang hilang, `stock_hilang` bertambah tapi `stock` dan `stock_total` tidak berubah — ini disengaja untuk tracking

---

## Status

| Phase | Status |
|---|---|
| Phase 1 — Backend Foundation | ✅ Selesai |
| Phase 2 — Backend Logic Update | ✅ Selesai |
| Phase 3 — Backend Stock Condition | ✅ Selesai |
| Phase 4 — Frontend | ✅ Selesai |
