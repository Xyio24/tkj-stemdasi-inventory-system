# Roadmap Redesign iOS Style — Inventory TKJ

## Status Legend
- [ ] Belum dikerjakan
- [~] Sedang dikerjakan
- [x] Selesai

---

## Fase 1 — Design Foundation
> Ubah semua token & utility. Tidak menyentuh halaman sama sekali.

- [x] **1.1 `frontend/src/index.css`**
  - CSS variables baru: warna iOS (putih dingin, slate, biru vibrant)
  - Glass utility classes: `.glass`, `.glass-strong`, `.glass-card`
  - Custom keyframes: `fade-up`, `scale-in`, `spring-in`, `shimmer`
  - Radius naik ke `1.25rem` (default), `1.75rem` (card), `2.5rem` (modal)
  - iOS-style focus ring: biru dengan glow soft

- [x] **1.2 `frontend/tailwind.config.js`**
  - Extend `animation` dengan spring timing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
  - Extend `backdropBlur` dengan nilai `xs`, `2xl`
  - Extend `boxShadow` dengan `glass`, `float`, `inset-glow`
  - Extend `borderRadius` dengan `2xl`, `3xl`, `4xl`

---

## Fase 2 — Core Components

- [x] **2.1 `frontend/src/components/ui/button.tsx`**
  - Spring scale on hover (`scale-[1.02]`) dan active (`scale-[0.96]`)
  - Variant `glass` baru: backdrop-blur + border putih transparan
  - Haptic-like shadow pulse saat click
  - Loading state dengan spinner iOS style

- [x] **2.2 `frontend/src/layouts/DashboardLayout.tsx`**
  - Sidebar: glass morphism (`bg-white/70 backdrop-blur-xl border-r border-white/20`)
  - Nav item active: pill biru dengan inner glow
  - Logo area: frosted glass badge
  - Mobile overlay: blur background (bukan hitam solid)
  - Mobile topbar: full glass (`bg-white/80 backdrop-blur-2xl`)
  - Smooth slide-in animation untuk mobile drawer

- [x] **2.3 `frontend/src/layouts/GuestLayout.tsx`**
  - Background: gradient mesh iOS (`from-blue-50 via-white to-indigo-50`)

---

## Fase 3 — Auth Pages

- [x] **3.1 `frontend/src/pages/auth/Login.tsx`**
  - Background: animated gradient blob (iOS 16 style)
  - Card: glass morphism kuat dengan `backdrop-blur-2xl`
  - Input: frosted, border `border-white/30`, focus glow biru
  - Button: gradient indigo dengan spring animation
  - Google button wrapper custom

- [x] **3.2 `frontend/src/pages/auth/Register.tsx`**
  - Layout konsisten dengan Login
  - Form step feel: tiap section muncul dengan `fade-up` delay

---

## Fase 4 — Dashboard

- [x] **4.1 `frontend/src/pages/dashboard/Dashboard.tsx`**
  - StatCard: glass card dengan colored icon glow
  - Chart bar: animated dengan spring height transition
  - Recent borrowings table: clean, hover glow ringan
  - Low stock alert: floating pill notification style
  - Skeleton loader: shimmer iOS style

- [x] **4.2 `frontend/src/pages/dashboard/UserGuidePage.tsx`**
  - Accordion / step card dengan glass style
  - Icon badges berwarna soft

---

## Fase 5 — Inventory Pages

- [x] **5.1 `frontend/src/pages/inventory/ItemList.tsx`**
  - Card grid: image rounded-2xl, shadow float on hover
  - Badge kondisi: pill glass dengan warna semantik
  - Search bar: frosted input dengan icon animasi
  - Tab switcher: iOS segmented control style
  - Empty state: ilustrasi minimalis

- [x] **5.2 `frontend/src/pages/inventory/CategoryList.tsx`**
  - Table/list hybrid: baris dengan hover `bg-white/60`
  - Action buttons: icon-only ghost dengan tooltip

- [x] **5.3 `frontend/src/pages/inventory/ItemForm.tsx`**
  - Form card: glass panel
  - Image upload: drop zone dengan border dashed animated
  - Input group: visual grouping dengan divider halus

---

## Fase 6 — Borrowing Pages

- [x] **6.1 `frontend/src/pages/borrowing/BorrowingList.tsx`**
  - Status filter tabs scrollable, glass table, badge-pill, hover-reveal actions

- [x] **6.2 `frontend/src/pages/borrowing/BorrowingDetail.tsx`**
  - Section wrapper, InfoRow, PhotoUploadArea dropzone
  - Approve/reject panels, return confirmation per-item, danger zone

- [x] **6.3 `frontend/src/pages/borrowing/BorrowingForm.tsx`**
  - Glass panels, qty stepper, item selector dropdown dengan search

---

## Fase 7 — Report Pages

- [x] **7.1 `frontend/src/pages/report/BorrowingReportPage.tsx`**
- [x] **7.2 `frontend/src/pages/report/ReturnReportPage.tsx`**
- [x] **7.3 `frontend/src/pages/report/InventoryReportPage.tsx`**

Semua report pages:
  - Filter panel: collapsible glass panel
  - Table: clean alternating rows, sticky header
  - Export buttons: icon + label, spring animation
  - Empty state konsisten

---

## Fase 8 — Master Data & Users

- [x] **8.1 `frontend/src/pages/master/ClassList.tsx`**
- [x] **8.2 `frontend/src/pages/master/AcademicYearList.tsx`**
  - glass-card form panel, input-ios, Button component
  - badge-pill untuk status aktif/nonaktif
  - Active slot indicator dengan dot pills
  - Shimmer skeleton, animated rows dengan stagger
  - Hover-reveal action buttons, warning banner limit aktif
- [x] **8.3 `frontend/src/pages/users/UserList.tsx`**
  - glass table rounded-3xl, badge-pill untuk role & status
  - input-ios search, iOS-style tab underline
  - Amber urgent badge untuk pending count
  - Shimmer skeleton, Button component throughout
  - Hover-reveal action buttons
  - Inline reject form dengan input-ios
  - Animated rows dengan stagger

---

## Fase 9 — Profile Page

- [x] **9.1 `frontend/src/pages/profile/ProfilePage.tsx`**
  - Header: cover area dengan gradient + avatar overlap
  - Section cards: glass grouped (mirip iOS Settings)
  - Edit mode: smooth expand animation

---

## Fase 10 — Polish & Konsistensi

- [ ] Audit semua halaman: radius, shadow, spacing konsisten
- [ ] Dark mode: variabel glass untuk dark (`bg-black/40 border-white/10`)
- [ ] Reduced motion: respek `prefers-reduced-motion` untuk semua animasi
- [ ] Aksesibilitas: focus visible tetap jelas di semua glass element

---

## Progress Summary

| Fase | Status | Keterangan |
|------|--------|------------|
| 1 — Foundation      | ✅ Selesai | index.css + tailwind.config.js |
| 2 — Core Components | ✅ Selesai | button.tsx, DashboardLayout, GuestLayout |
| 3 — Auth            | ✅ Selesai | Login, Register |
| 4 — Dashboard       | ✅ Selesai | Dashboard, UserGuidePage |
| 5 — Inventory       | ✅ Selesai | ItemList, CategoryList, ItemForm |
| 6 — Borrowing       | ✅ Selesai | BorrowingList, Detail, Form |
| 7 — Report          | ✅ Selesai | Borrowing, Return, Inventory report |
| 8 — Master & Users  | ✅ Selesai | ClassList, AcademicYearList, UserList |
| 9 — Profile         | ✅ Selesai | ProfilePage |
| 10 — Polish         | ⬜ Pending | Audit, dark mode, a11y |

---

## Urutan Eksekusi

```
Fase 1 (Foundation) → Fase 2 (Components) → Fase 3 (Auth)
       ↓
Fase 4 (Dashboard) → Fase 5 (Inventory) → Fase 6 (Borrowing)
       ↓
Fase 7 (Report) → Fase 8 (Master) → Fase 9 (Profile)
       ↓
Fase 10 (Polish)
```
