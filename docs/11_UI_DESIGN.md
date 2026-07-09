# 11 — UI DESIGN
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Design System & Tema (Tailwind CSS + shadcn)

Desain antarmuka aplikasi mengadopsi prinsip modern, bersih, minimalis, dan sangat responsif. Sistem desain didasarkan pada CSS variables yang terintegrasi dengan **shadcn/ui** dan **Tailwind CSS**.

### 1.1 Palet Warna (Color Palette)

| Token Warna | Light Mode | Dark Mode | Fungsi Utama |
|---|---|---|---|
| `primary` | HSL `221.2 83.2% 53.3%` (Blue) | HSL `217.2 91.2% 59.8%` | Tombol CTA Utama, Status Aktif |
| `background` | HSL `0 0% 100%` (White) | HSL `222.2 84% 4.9%` (Deep Slate) | Latar belakang aplikasi |
| `card` | HSL `0 0% 98%` (Soft Gray) | HSL `222.2 84% 8.3%` | Container data, Grid barang |
| `muted` | HSL `210 40% 96.1%` | HSL `217.2 32.6% 17.5%` | Text sekunder, border non-aktif |
| `destructive` | HSL `346.8 77.2% 49.8%` (Red) | HSL `355.7 100% 47.3%` | Tombol delete, tolak, error |
| `success` | HSL `142.1 76.2% 36.3%` (Green) | HSL `142.1 70.6% 45.3%` | Status disetujui / returned |

---

## 2. Wireframe Halaman (ASCII Layouts)

### 2.1 Halaman Login (Guest View)
```
+--------------------------------------------------------+
|                                                        |
|                 [ Logo Jurusan TKJ ]                   |
|                   INVENTORY SYSTEM                     |
|                                                        |
|             +----------------------------+             |
|             |          Masuk             |             |
|             |                            |             |
|             |  Gunakan akun Google       |             |
|             |  sekolah Anda untuk masuk. |             |
|             |                            |             |
|             |   +--------------------+   |             |
|             |   | G Login via Google |   |             |
|             |   +--------------------+   |             |
|             |                            |             |
|             +----------------------------+             |
|                                                        |
+--------------------------------------------------------+
```

### 2.2 Dashboard (Guru/Admin View)
```
+--------------------------------------------------------+
| [TKJ-INV] | Breadcrumb: Home > Dashboard     [Profile] |
+-----------+--------------------------------------------+
| (Sidebar) |                                            |
| o Dash    |  +-----------+ +-----------+ +-----------+  |
| o Barang  |  | Tot. Item | | Pending   | | Returning |  |
| o Pinjam  |  |    145    | |    5      | |    3      |  |
| o Users   |  +-----------+ +-----------+ +-----------+  |
| o Log     |                                            |
|           |  [ Grafik Peminjaman 7 Hari Terakhir ]     |
|           |  +--------------------------------------+  |
|           |  |                                      |  |
|           |  +--------------------------------------+  |
|           |                                            |
|           |  [ Pengajuan Terbaru ]                     |
|           |  +--------------------------------------+  |
|           |  | BRW-01 | Siswa A | Pending | [Review] |  |
|           |  +--------------------------------------+  |
+-----------+--------------------------------------------+
```

### 2.3 Inventory Page (Katalog Barang)
```
+--------------------------------------------------------+
| [TKJ-INV] | Search: [ Cari barang... ]     [+ Barang]  |
+-----------+--------------------------------------------+
| Filter:   | Kategori: [ Semua v ]   Kondisi: [ Baik v ]|
| o Semua   |                                            |
| o Network | +---------------+ +---------------+        |
| o Server  | | [ Foto Item ] | | [ Foto Item ] |        |
| o Tools   | | Cisco Switch  | | Crimping Tool |        |
|           | | Stok: 5 Pcs   | | Stok: 12 Pcs  |        |
|           | | [ Pinjam ]    | | [ Pinjam ]    |        |
|           | +---------------+ +---------------+        |
|           |                                            |
|           | Paginate: [ << ] [ 1 ] [ 2 ] [ 3 ] [ >> ]  |
+-----------+--------------------------------------------+
```

### 2.4 Kategori CRUD Page (Admin View)
```
+--------------------------------------------------------+
| [TKJ-INV] | Kategori Inventaris           [+ Kategori] |
+-----------+--------------------------------------------+
|           |                                            |
|           | +----------------------------------------+ |
|           | | Nama Kategori   | Deskripsi  | Aksi    | |
|           | +-----------------+------------+---------+ |
|           | | Kabel LAN       | Kabel UTP  | [E] [D] | |
|           | | Router & Switch | Jaringan   | [E] [D] | |
|           | +----------------------------------------+ |
|           |                                            |
+--------------------------------------------------------+
```

### 2.5 Detail Barang Page
```
+--------------------------------------------------------+
| [TKJ-INV] | Breadcrumb: Barang > Cisco Switch          |
+-----------+--------------------------------------------+
|           |                                            |
|           |  +---------------+  Nama: Cisco Switch 24P |
|           |  |               |  Brand: Cisco           |
|           |  |  [ Foto ]     |  Stok Tersedia: 3 Pcs   |
|           |  |               |  Total Aset: 5 Pcs      |
|           |  +---------------+  Kondisi: Baik          |
|           |  [Galeri: 1 2 3]    Lokasi: Lemari Jaringan|
|           |                                            |
|           |  Deskripsi:                                |
|           |  Switch Gigabit Managed 24 Port.           |
|           |                                            |
|           |  [ Ajukan Peminjaman ] [ Kembali ke List ] |
|           |                                            |
+--------------------------------------------------------+
```

### 2.6 Form Peminjaman Page (Siswa View)
```
+--------------------------------------------------------+
| [TKJ-INV] | Pengajuan Peminjaman Barang                |
+-----------+--------------------------------------------+
|           |                                            |
|           |  Barang terpilih:                          |
|           |  1. Cisco Switch (2 Pcs)   [ Hapus ]       |
|           |  2. Kabel UTP (1 Roll)     [ Hapus ]       |
|           |                                            |
|           |  Tujuan Peminjaman:                        |
|           |  [ Praktikum Jaringan XI TKJ 1           ] |
|           |                                            |
|           |  Tanggal Ambil:      Tanggal Kembali:      |
|           |  [ 2026-07-07 ]      [ 2026-07-09 ]        |
|           |                                            |
|           |  [ Kirim Pengajuan ] [ Batal ]             |
|           |                                            |
+--------------------------------------------------------+
```

### 2.7 Detail Peminjaman / Approval / Return Page
```
+--------------------------------------------------------+
| [TKJ-INV] | Transaksi: BRW-20260706-0005               |
+-----------+--------------------------------------------+
| Detail:   | Siswa: Siswa A  | Status: APPROVED         |
|           | Tujuan: Praktikum  | Tgl Pinjam: 2026-07-06  |
|           |                                            |
|           | Barang Dipinjam:                           |
|           | - 2 Pcs Cisco Switch                       |
|           |                                            |
|           | +----------------------------------------+ |
|           | | Bukti Foto Ambil | Bukti Foto Kembali  | |
|           | +------------------+---------------------+ |
|           | |  [ Foto Selfie ] |   [ Upload Foto ]   | |
|           | +------------------+---------------------+ |
|           |                                            |
|           | [ Aksi Guru: Approve Return ]              |
|           |                                            |
+--------------------------------------------------------+
```

---

## 3. Desain Responsif & Tata Letak Mobile

Aplikasi menerapkan pendekatan **Mobile-First** di mana seluruh halaman dioptimalkan untuk layar handphone (minimal lebar 375px):

1. **Sidebar Navigation:** Pada layar desktop, sidebar terpasang secara permanen di sebelah kiri. Pada layar mobile, sidebar disembunyikan dan digantikan tombol hamburger menu di header yang membuka lemari slide-out (**shadcn sheet component**).
2. **Katalog Grid:**
   - Desktop: Grid 4 kolom.
   - Tablet: Grid 2 kolom.
   - Mobile: Grid 1 kolom memanjang vertikal.
3. **Responsive Table:** Menggunakan pembungkus `overflow-x-auto` di seluruh tabel data. Pada layar terkecil, tabel pengguna beralih menjadi format card detail.

---

## 4. Aksesibilitas (Accessibility / A11y)

Untuk kenyamanan semua pengguna, sistem mematuhi pedoman aksesibilitas dasar (WCAG 2.1 AA):

- **Contrast Color:** Semua elemen teks dalam mode terang dan gelap wajib mematuhi rasio kontras minimal 4.5:1 terhadap latar belakang.
- **Focus Indicator:** Menambahkan outline fokus yang jelas (`focus-visible:ring-2`) untuk pengguna yang bernavigasi menggunakan keyboard (Tab).
- **Semantik HTML:** Penggunaan elemen HTML secara semantik (`<nav>`, `<main>`, `<header>`, `<footer>`, `<button>`).
- **Screen Reader Support:** Gambar dekoratif menggunakan `alt=""`, sementara tombol dengan icon saja menggunakan atribut `aria-label` yang deskriptif.

---

## 5. Integrasi Komponen shadcn/ui

Daftar komponen pustaka **shadcn/ui** yang dipasang dan digunakan di frontend:

| Nama Komponen | Lokasi Penggunaan | Alasan / Fungsi |
|---|---|---|
| `Button` | Seluruh Halaman | Konsistensi UI aksi trigger |
| `Input` | Halaman Login, Form, Search | Masukan teks standar |
| `Table` | Menu Riwayat, Log, Users | Penyajian data tabular |
| `Dialog` | Modal Bukti Upload, Konfirmasi Hapus| Pop-up overlay interaktif |
| `Sheet` | Menu Navigasi Mobile | Slide-out menu mobile |
| `Card` | Dashboard Stats, Grid Catalog | Kontainer visual data |
| `Badge` | Status Peminjaman (Pending, Approved)| Tag status berwarna kontras |
| `Select` | Form filter, dropdown pilihan | Membatasi pilihan masukan user |
| `Avatar` | Header Profil, Dashboard | Menampilkan foto user dari Google |
