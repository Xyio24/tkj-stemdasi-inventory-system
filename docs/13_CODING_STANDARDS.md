# Coding Standards

## Purpose

Dokumen ini menjadi standar pengembangan seluruh aplikasi.

Semua implementasi wajib mengikuti aturan berikut.

Apabila terdapat konflik antara implementasi dan dokumen ini, maka dokumen ini menjadi acuan utama.

---

# General Principles

- Clean Architecture
- SOLID Principle
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)
- Separation of Concern
- Readability over Cleverness

---

# Tech Stack

Backend

- Laravel 13
- PHP 8.3
- MySQL / MariaDB
- Laravel Sanctum
- Google OAuth

Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Router
- Axios
- TanStack Query

---

# Language

Semua source code menggunakan Bahasa Inggris.

Semua nama:

- table
- column
- controller
- service
- repository
- component
- function
- variable

menggunakan Bahasa Inggris.

User Interface menggunakan Bahasa Indonesia.

Contoh:

Backend

BorrowingController

Frontend

BorrowHistoryPage

UI

"Riwayat Peminjaman"

---

# Folder Structure

Backend

app/

Controllers

Services

Repositories

Actions

Policies

DTO

Requests

Resources

Models

Observers

Traits

Frontend

src/

api/

components/

hooks/

layouts/

pages/

providers/

routes/

services/

store/

types/

utils/

---

# Naming Convention

Table

snake_case plural

Contoh

users

borrowings

inventory_items

Model

PascalCase

User

Borrowing

InventoryItem

Controller

BorrowingController

InventoryController

Service

BorrowingService

InventoryService

Repository

BorrowingRepository

DTO

BorrowingDTO

Frontend Component

PascalCase

BorrowCard.tsx

DashboardLayout.tsx

Page

BorrowPage.tsx

InventoryPage.tsx

Hook

useBorrowing.ts

useInventory.ts

API File

borrowing.ts

inventory.ts

---

# Database Standard

Semua tabel memiliki:

id

created_at

updated_at

Soft delete hanya digunakan jika memang diperlukan.

Gunakan foreign key.

Gunakan index pada:

foreign key

email

google_id

status

created_at

---

# Laravel Standard

Business Logic

Tidak boleh berada di Controller.

Controller hanya:

- Validation
- Authorization
- Call Service
- Return Response

Business Logic berada di Service.

Query kompleks berada di Repository.

---

# Validation

Gunakan Form Request.

Tidak boleh melakukan validation langsung di Controller.

---

# API Response Standard

Success

{
    "success": true,
    "message": "...",
    "data": {}
}

Error

{
    "success": false,
    "message": "...",
    "errors": {}
}

---

# Authentication

Laravel Sanctum.

Google OAuth.

Tidak menggunakan Session Authentication.

---

# Authorization

Gunakan Policy.

Jangan menggunakan role checking langsung di Controller.

---

# React Standard

Gunakan Functional Component.

Gunakan Hooks.

Tidak menggunakan Class Component.

---

# State Management

Server State

TanStack Query

Local State

React State

Global State

Context API

Jangan menggunakan Redux kecuali benar-benar diperlukan.

---

# Styling

TailwindCSS

shadcn/ui

Tidak menggunakan CSS Framework lain.

---

# Component Standard

Komponen maksimal memiliki satu tanggung jawab.

Reusable Component wajib digunakan.

---

# Form

Gunakan

React Hook Form

+

Zod

---

# API

Semua request menggunakan Axios Instance.

Tidak boleh memanggil fetch langsung.

---

# Error Handling

Semua request harus memiliki:

Loading

Empty State

Error State

Retry

---

# Logging

Semua aktivitas penting wajib dicatat.

Login

Borrow

Return

Approval

Delete

Update

---

# Security

Validasi server wajib dilakukan.

Frontend validation hanya untuk UX.

Backend adalah sumber validasi utama.

---

# Git Convention

Branch

feature/...

bugfix/...

hotfix/...

Commit

feat:

fix:

refactor:

docs:

style:

test:

build:

Contoh

feat: add borrowing approval

fix: inventory stock calculation

docs: update api specification

---

# AI Development Rules

AI wajib membaca folder docs sebelum membuat source code.

AI tidak boleh mengubah struktur project tanpa alasan yang jelas.

AI tidak boleh membuat dependency baru tanpa persetujuan.

AI harus menggunakan reusable component.

AI harus menghindari duplicate code.

AI wajib menjaga konsistensi seluruh project.
