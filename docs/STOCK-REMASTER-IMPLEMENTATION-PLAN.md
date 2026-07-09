# STOCK-REMASTER-IMPLEMENTATION-PLAN.md

## Inventory TKJ — Stock & Return Condition Remaster

> Dokumen ini mendefinisikan rencana implementasi lengkap untuk sistem stok dan
> kondisi pengembalian barang yang diperbarui. Mencakup breakdown kondisi per unit
> saat pengembalian, jenis barang consumable/non-consumable, tracking stok per kondisi,
> dan koreksi kondisi stok oleh admin.

---

## 1. Latar Belakang & Masalah

### Kondisi Saat Ini
- Kondisi pengembalian hanya satu nilai per baris `borrowing_items` (`item_condition_in`)
- Tidak bisa split kondisi — misal 2 baik, 1 rusak dari 3 unit yang dipinjam
- Tidak ada kondisi `hilang` untuk unit yang tidak kembali
- Semua barang dianggap sama jenisnya — tidak ada perbedaan consumable vs non-consumable
- Stok barang tidak terpecah berdasarkan kondisi (tidak diketahui berapa yang baik, rusak, dll)
- `items.condition` tidak ter-update otomatis setelah pengembalian

### Masalah yang Diselesaikan
- Admin tidak bisa mencatat kondisi berbeda untuk unit-unit dalam satu jenis barang yang dipinjam
- Barang consumable (RJ45, isolasi) memiliki alur yang berbeda — tidak perlu dikembalikan, bisa "terpakai"
- Tidak ada visibilitas kondisi stok per barang (berapa yang baik, rusak ringan, rusak berat, hilang)
- Tidak ada cara admin memkoreksi kondisi stok yang salah input

---

## 2. Keputusan Desain

| Aspek | Keputusan |
|---|---|
| **Breakdown kondisi** | Tabel baru `borrowing_item_returns` — satu baris per kondisi per item (Opsi B, scalable) |
| **Kondisi yang tersedia** | `baik`, `rusak_ringan`, `rusak_berat`, `hilang`, `terpakai` |
| **`terpakai`** | Khusus consumable — unit habis dipakai, tidak kembali ke stok |
| **`hilang`** | Unit tidak kembali — tidak masuk stok, dicatat di `stock_hilang` |
| **Stok yang bisa dipinjam** | Hanya `stock_baik` — rusak ringan/berat tidak bisa dipinjam |
| **`items.condition`** | Di-update otomatis ke kondisi mayoritas setelah pengembalian dikonfirmasi |
| **Koreksi kondisi** | Admin bisa pindah unit antar kondisi secara manual di tab "Kondisi Stok" |
| **`items.stock`** | Tetap sebagai kolom tersendiri (Opsi A) — sync dari `stock_baik + stock_rusak_ringan + stock_rusak_berat` |
| **Jenis barang** | Kolom `type`: `non_consumable` (default) atau `consumable` |
| **`item_condition_in` lama** | Tetap di `borrowing_items` sebagai ringkasan — di-isi dengan kondisi mayoritas dari `borrowing_item_returns` |

---

## 3. Perubahan Database

### 3.1 Tabel Baru: `borrowing_item_returns`

```sql
CREATE TABLE borrowing_item_returns (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    borrowing_item_id BIGINT UNSIGNED NOT NULL,
    condition         ENUM('baik', 'rusak_ringan', 'rusak_berat', 'hilang', 'terpakai') NOT NULL,
    quantity          TINYINT UNSIGNED NOT NULL,
    notes             TEXT NULL,
    created_at        TIMESTAMP NULL,
    updated_at        TIMESTAMP NULL,

    FOREIGN KEY (borrowing_item_id) REFERENCES borrowing_items(id) ON DELETE CASCADE,
    INDEX idx_bir_borrowing_item_id (borrowing_item_id),
    INDEX idx_bir_condition (condition)
);
```

**Constraint:** Total `quantity` per `borrowing_item_id` harus sama dengan `borrowing_items.quantity` yang dipinjam.

**Catatan:** Satu baris `borrowing_item_returns` = satu kondisi. Jadi jika pinjam 3 akses poin dan kembali 2 rusak ringan + 1 baik, ada 2 baris:
```
borrowing_item_id=1, condition='baik',         quantity=1
borrowing_item_id=1, condition='rusak_ringan', quantity=2
```

### 3.2 Modifikasi Tabel `items`

| Kolom Baru | Tipe | Default | Keterangan |
|---|---|---|---|
| `type` | ENUM(`non_consumable`, `consumable`) | `non_consumable` | Jenis barang |
| `stock_baik` | TINYINT UNSIGNED | 0 | Stok dalam kondisi baik |
| `stock_rusak_ringan` | TINYINT UNSIGNED | 0 | Stok dalam kondisi rusak ringan |
| `stock_rusak_berat` | TINYINT UNSIGNED | 0 | Stok dalam kondisi rusak berat |
| `stock_hilang` | TINYINT UNSIGNED | 0 | Unit hilang (tidak masuk stok aktif) |

> **Data Migration:** Semua `items` yang sudah ada di-migrate:
> `stock_baik = stock` (semua stok saat ini dianggap kondisi baik),
> `stock_rusak_ringan = 0`, `stock_rusak_berat = 0`, `stock_hilang = 0`.

> **Relasi `stock`:** `stock = stock_baik + stock_rusak_ringan + stock_rusak_berat`. Kolom `stock` tetap ada dan di-update setiap kali salah satu kolom breakdown berubah.

### 3.3 Kolom `borrowing_items` — Tidak Berubah

Kolom `item_condition_in` di `borrowing_items` **tetap ada** sebagai ringkasan kondisi mayoritas dari `borrowing_item_returns`. Di-isi saat `approveReturn` selesai diproses.

---

## 4. Kondisi & Pengaruh ke Stok

| Kondisi | Pengaruh ke Stok | Keterangan |
|---|---|---|
| `baik` | `stock_baik += qty`, `stock += qty` | Kembali normal, bisa dipinjam lagi |
| `rusak_ringan` | `stock_rusak_ringan += qty`, `stock += qty` | Tercatat tapi tidak bisa dipinjam |
| `rusak_berat` | `stock_rusak_berat += qty`, `stock += qty` | Tercatat tapi tidak bisa dipinjam |
| `hilang` | `stock_hilang += qty` | Tidak kembali ke stok aktif |
| `terpakai` | Tidak ada perubahan stok | Consumable habis dipakai, hangus |

### Validasi Stok saat Approve Peminjaman (Update)

```php
// Sebelumnya: $item->stock >= $borrowItem->quantity
// Sesudahnya:
$item->stock_baik >= $borrowItem->quantity
```

Hanya `stock_baik` yang dihitung sebagai stok tersedia untuk dipinjam.

---

## 5. Perubahan Backend

### 5.1 Migration Baru

**File 1:** `create_borrowing_item_returns_table.php`
```
- Buat tabel borrowing_item_returns
- Kolom: id, borrowing_item_id (FK), condition (enum), quantity, notes, timestamps
- Index: borrowing_item_id, condition
```

**File 2:** `add_stock_condition_columns_to_items_table.php`
```
- Tambah: type ENUM('non_consumable', 'consumable') default 'non_consumable'
- Tambah: stock_baik UNSIGNED TINYINT default 0
- Tambah: stock_rusak_ringan UNSIGNED TINYINT default 0
- Tambah: stock_rusak_berat UNSIGNED TINYINT default 0
- Tambah: stock_hilang UNSIGNED TINYINT default 0
- Data migration: stock_baik = stock untuk semua item yang ada
```

### 5.2 Model Baru: `BorrowingItemReturn`

```php
// app/Models/BorrowingItemReturn.php
$fillable = ['borrowing_item_id', 'condition', 'quantity', 'notes']
$casts    = ['condition' => kondisi enum]

// Relasi
public function borrowingItem(): BelongsTo
```

### 5.3 Update Model `Item`

```php
// Tambah ke $fillable
'type', 'stock_baik', 'stock_rusak_ringan', 'stock_rusak_berat', 'stock_hilang'

// Tambah helper method
public function availableStock(): int
{
    return $this->stock_baik;
}

public function syncStockTotal(): void
{
    $this->stock = $this->stock_baik + $this->stock_rusak_ringan + $this->stock_rusak_berat;
    $this->save();
}

public function updateConditionFromMajority(): void
{
    // Tentukan kondisi mayoritas dari stock breakdown
    // Condition = kondisi dengan jumlah stok terbanyak
    $breakdown = [
        'baik'         => $this->stock_baik,
        'rusak_ringan' => $this->stock_rusak_ringan,
        'rusak_berat'  => $this->stock_rusak_berat,
    ];
    $this->condition = array_key_first(
        array_filter($breakdown, fn($v) => $v === max($breakdown))
    );
    $this->save();
}
```

### 5.4 Update Model `BorrowingItem`

```php
// Tambah relasi
public function returnConditions(): HasMany
{
    return $this->hasMany(BorrowingItemReturn::class);
}
```

### 5.5 Update `BorrowingApprovalService::approve()`

```php
// Ganti validasi stok dari:
if ($item->stock < $borrowItem->quantity)
// Menjadi:
if ($item->stock_baik < $borrowItem->quantity)

// Pesan error sesuaikan:
"Stok barang '{$item->name}' yang tersedia (kondisi baik: {$item->stock_baik}) kurang dari jumlah pengajuan ({$borrowItem->quantity})."
```

### 5.6 Update `BorrowingApprovalService::approveReturn()`

Logika baru:

```
Untuk setiap item dalam peminjaman:
  1. Ambil array return_conditions dari request (list kondisi + qty)
  2. Validasi: total qty dari semua kondisi == borrowItem.quantity
  3. Simpan tiap kondisi ke tabel borrowing_item_returns
  4. Update stok item:
     - baik         → stock_baik += qty, stock += qty
     - rusak_ringan → stock_rusak_ringan += qty, stock += qty
     - rusak_berat  → stock_rusak_berat += qty, stock += qty
     - hilang       → stock_hilang += qty (stock tidak berubah)
     - terpakai     → tidak ada perubahan stok
  5. Update borrowItem.returned_quantity = total yang kembali ke stok
     (baik + rusak_ringan + rusak_berat + terpakai, TIDAK termasuk hilang)
  6. Update borrowItem.item_condition_in = kondisi mayoritas
  7. Panggil item.syncStockTotal()
  8. Panggil item.updateConditionFromMajority()
```

### 5.7 Request Baru: `ApproveReturnRequest` (Update)

```php
// Struktur items berubah dari:
items[].borrowing_item_id
items[].returned_quantity
items[].item_condition_in

// Menjadi:
items[].borrowing_item_id
items[].return_conditions[].condition  // enum: baik|rusak_ringan|rusak_berat|hilang|terpakai
items[].return_conditions[].quantity   // min: 1
items[].return_conditions[].notes      // nullable
```

### 5.8 Endpoint Baru: `StockConditionController`

**Buat controller baru:** `app/Http/Controllers/StockConditionController.php`

#### `GET /api/items/stock-conditions` (guru + admin)
- Return semua item dengan breakdown stok per kondisi
- Support filter: `search`, `category_id`, `has_damage` (hanya yang ada rusak/hilang)
- Pagination

#### `POST /api/items/{item}/adjust-condition` (admin only)
- Pindah unit antar kondisi (koreksi)
- Input:
  ```json
  {
    "from_condition": "rusak_ringan",
    "to_condition":   "baik",
    "quantity":       2,
    "notes":          "Sudah diperbaiki oleh teknisi"
  }
  ```
- Validasi: `quantity` tidak boleh melebihi stok di `from_condition`
- Update kolom breakdown + sync `stock` + update `condition` mayoritas
- Activity log: `item.condition_adjusted`

### 5.9 Update `ItemController`

#### `POST /api/items` dan `PATCH /api/items/{item}`
- Tambah field `type` ke validasi: `Rule::in(['non_consumable', 'consumable'])`
- Tambah `type` ke response resource

### 5.10 Update Business Rules

Tambah/update di `docs/03_BUSINESS_RULES.md`:

```
BR-STK-09: Hanya stock_baik yang dihitung sebagai stok tersedia untuk dipinjam
BR-STK-10: stock_hilang tidak masuk stock aktif — unit hilang tidak bisa dipinjam kembali
BR-STK-11: Kondisi 'terpakai' hanya berlaku untuk barang jenis consumable
BR-RET-04: (update) Kondisi pengembalian dicatat per kondisi per quantity via borrowing_item_returns
BR-RET-09: Total quantity di borrowing_item_returns harus sama dengan quantity yang dipinjam
BR-ITEM-11: Jenis barang (type) tidak dapat diubah jika barang memiliki peminjaman aktif
```

---

## 6. Perubahan Frontend

### 6.1 Halaman Barang — Tab Baru "Kondisi Stok"

**File:** `pages/inventory/ItemList.tsx`

Tambah tab kedua "Kondisi Stok" di halaman daftar barang. Tab ini menampilkan:

| Kolom | Keterangan |
|---|---|
| Nama Barang | Nama + brand/model |
| Stok Total | `stock` (aktif) |
| Baik | `stock_baik` |
| Rusak Ringan | `stock_rusak_ringan` |
| Rusak Berat | `stock_rusak_berat` |
| Hilang | `stock_hilang` |
| Kondisi Saat Ini | Badge kondisi mayoritas |
| Aksi | Tombol "Koreksi Kondisi" (admin only) |

Filter: search nama barang, filter "Hanya yang ada kerusakan".

### 6.2 Modal Koreksi Kondisi

**Komponen baru:** `components/inventory/AdjustConditionModal.tsx`

```
Pindahkan [qty] unit dari [kondisi asal ▼] ke [kondisi tujuan ▼]
Catatan: [input text]
[Simpan] [Batal]
```

Validasi client-side: `qty` tidak boleh > stok di kondisi asal.

### 6.3 Update Form Tambah/Edit Barang

**File:** `pages/inventory/ItemForm.tsx`

Tambah field "Jenis Barang":
```
○ Non-Consumable (dapat dipinjam dan dikembalikan)
● Consumable (sekali pakai, tidak perlu dikembalikan)
```

Default: Non-Consumable.

### 6.4 Update UI Konfirmasi Pengembalian (BorrowingDetail)

**File:** `pages/borrowing/BorrowingDetail.tsx`

Ubah section "Kondisi & Jumlah Kembali" dari satu select kondisi menjadi tabel breakdown:

```
┌─────────────────────────────────────────────────────┐
│ Laptop Lenovo ThinkPad (dipinjam: 2 unit)           │
├──────────────┬──────────┬────────────────────────   │
│ Kondisi      │ Jumlah   │                           │
├──────────────┼──────────┤                           │
│ [Baik     ▼] │ [  1   ] │ [Hapus]                   │
│ [Hilang   ▼] │ [  1   ] │ [Hapus]                   │
├──────────────┴──────────┘                           │
│ [+ Tambah Kondisi]           Total: 2/2 ✓           │
└─────────────────────────────────────────────────────┘
```

Validasi real-time: total qty semua kondisi harus = qty yang dipinjam. Tombol "Konfirmasi Pengembalian" disabled jika total tidak sesuai.

Untuk item consumable, tambah opsi kondisi `terpakai` di dropdown.

### 6.5 Update API Layer

**File:** `api/borrowing.ts`

```typescript
// Update tipe ApproveReturnItemPayload
export interface ReturnConditionEntry {
    condition: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'hilang' | 'terpakai';
    quantity: number;
    notes?: string;
}

export interface ApproveReturnItemPayload {
    borrowing_item_id: number;
    return_conditions: ReturnConditionEntry[];
}
```

**File baru:** `api/stockCondition.ts`
```typescript
getStockConditions(params)     → GET /items/stock-conditions
adjustItemCondition(id, data)  → POST /items/{id}/adjust-condition
```

### 6.6 Update Tipe `Item` di TypeScript

**File:** `types/` atau inline di komponen yang relevan

```typescript
type ItemType = 'non_consumable' | 'consumable';

interface Item {
    // ... kolom yang sudah ada
    type: ItemType;
    stock_baik: number;
    stock_rusak_ringan: number;
    stock_rusak_berat: number;
    stock_hilang: number;
}
```

---

## 7. Alur Lengkap Per Skenario

### 7.1 Pengembalian dengan Kondisi Campuran (Non-Consumable)

```
Siswa upload foto return → status jadi 'returning'
→ Admin buka detail peminjaman
→ Section konfirmasi: untuk "Akses Poin" (dipinjam 3)
  Admin input:
    - rusak_ringan: 2
    - baik: 1
  Total: 3/3 ✓
→ Submit → POST /api/borrowings/{id}/return
→ Backend:
  - Simpan ke borrowing_item_returns: 2 baris
  - stock_rusak_ringan += 2, stock_baik += 1
  - stock = stock_baik + stock_rusak_ringan + stock_rusak_berat (sync)
  - item.condition = 'rusak_ringan' (mayoritas)
  - borrowItem.item_condition_in = 'rusak_ringan' (ringkasan)
  - borrowItem.returned_quantity = 3
```

### 7.2 Pengembalian dengan Barang Hilang

```
Pinjam 2 laptop. Dikembalikan 1, 1 hilang.
Admin input:
  - baik: 1
  - hilang: 1
Total: 2/2 ✓
→ Backend:
  - stock_baik += 1 (stock += 1)
  - stock_hilang += 1 (stock TIDAK berubah)
  - returned_quantity = 1 (hanya yang kembali ke stok)
  - condition = 'baik' (hanya satu yang ada di stok aktif)
```

### 7.3 Pengembalian Consumable

```
Pinjam 5 konektor RJ45. Terpakai 4, kembali 1.
Admin input:
  - terpakai: 4
  - baik: 1
Total: 5/5 ✓
→ Backend:
  - stock_baik += 1 (stock += 1)
  - terpakai: tidak ada perubahan stok (hangus)
  - returned_quantity = 1
```

### 7.4 Koreksi Kondisi oleh Admin

```
Admin buka halaman Barang → tab "Kondisi Stok"
→ Lihat "Akses Poin": rusak_ringan: 2, baik: 1
→ Klik "Koreksi Kondisi"
→ Input: dari rusak_ringan, ke baik, qty 2, catatan "sudah diperbaiki"
→ Backend:
  - stock_rusak_ringan -= 2
  - stock_baik += 2
  - stock tidak berubah (total sama)
  - condition di-update ke majority baru
  - activity log dicatat
```

---

## 8. Urutan Implementasi

### Phase 1 — Backend Foundation
1. Migration: buat `borrowing_item_returns`
2. Migration: tambah kolom `type`, `stock_baik`, `stock_rusak_ringan`, `stock_rusak_berat`, `stock_hilang` ke `items`
3. Model `BorrowingItemReturn`
4. Update Model `Item` (helper methods + fillable)
5. Update Model `BorrowingItem` (relasi ke returnConditions)

### Phase 2 — Backend Logic Update
6. Update `ApproveReturnRequest` — struktur baru `return_conditions`
7. Update `BorrowingApprovalService::approveReturn()` — logika breakdown kondisi
8. Update `BorrowingApprovalService::approve()` — validasi pakai `stock_baik`
9. Update `BorrowingResource` — include `return_conditions` per item

### Phase 3 — Backend Stock Condition
10. Buat `StockConditionController`
11. Endpoint `GET /api/items/stock-conditions`
12. Endpoint `POST /api/items/{item}/adjust-condition`
13. Update `routes/api.php`
14. Update `ItemController` — tambah validasi `type`

### Phase 4 — Frontend
15. Update tipe `Item` dan `ApproveReturnItemPayload` di TypeScript
16. Update `api/borrowing.ts` — struktur payload baru
17. Buat `api/stockCondition.ts`
18. Update `BorrowingDetail.tsx` — UI konfirmasi pengembalian breakdown
19. Update `ItemForm.tsx` — tambah field `type`
20. Update `ItemList.tsx` — tambah tab "Kondisi Stok"
21. Buat komponen `AdjustConditionModal.tsx`

---

## 9. Catatan Teknis Penting

### Constraint Total Quantity
Validasi di backend bahwa total `qty` dari semua `return_conditions` per item == `borrowItem.quantity`:
```php
$totalReturned = collect($itemData['return_conditions'])->sum('quantity');
if ($totalReturned !== $borrowItem->quantity) {
    throw new HttpException(422, "Total kondisi pengembalian untuk '{$item->name}' harus sama dengan jumlah yang dipinjam ({$borrowItem->quantity}).");
}
```

### Sync `stock` setelah Koreksi
Setiap kali `stock_baik`, `stock_rusak_ringan`, atau `stock_rusak_berat` berubah:
```php
$item->stock = $item->stock_baik + $item->stock_rusak_ringan + $item->stock_rusak_berat;
```
Lakukan dalam satu `save()` call untuk menghindari race condition.

### Mayoritas Kondisi
Jika dua kondisi memiliki jumlah yang sama (misal: 2 baik, 2 rusak ringan), prioritas: `rusak_ringan > baik` (lebih konservatif). Urutan prioritas kondisi: `rusak_berat > rusak_ringan > baik`.

### Backward Compatibility
Data `borrowing_items` lama yang sudah punya `item_condition_in` tidak perlu dimigrasi ke `borrowing_item_returns`. Data lama tetap terbaca dari kolom `item_condition_in`.

### Consumable & `stock_total`
Saat consumable dipakai (kondisi `terpakai`), `stock_total` tidak berubah — `stock_total` mencerminkan total pengadaan sejak awal, bukan stok yang tersisa.
