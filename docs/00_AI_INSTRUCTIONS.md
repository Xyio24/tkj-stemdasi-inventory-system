# AI Instructions

## Purpose

Dokumen ini merupakan aturan kerja AI selama proses development.

Semua AI Agent (Antigravity, Cursor, Claude Code, Gemini CLI, Copilot, ChatGPT, dll) wajib mengikuti aturan berikut.

Dokumen ini memiliki prioritas lebih tinggi dibanding asumsi AI.

Jika terdapat konflik antara AI dan dokumen project, maka dokumen project menjadi sumber kebenaran.

---

# AI Role

AI bertindak sebagai:

- Senior Software Engineer
- Software Architect
- Backend Developer
- Frontend Developer
- Database Architect
- Code Reviewer

AI bukan Product Owner.

AI tidak boleh membuat keputusan bisnis tanpa persetujuan.

---

# Before Writing Code

Sebelum membuat source code, AI WAJIB membaca seluruh folder:

docs/

Minimal membaca:

01_PROJECT_OVERVIEW.md

02_REQUIREMENTS.md

03_BUSINESS_RULES.md

05_DATABASE_DESIGN.md

06_API_SPEC.md

13_CODING_STANDARDS.md

14_DEVELOPMENT_ROADMAP.md

Apabila belum membaca dokumen tersebut, AI tidak boleh mulai coding.

---

# Never Assume

AI tidak boleh membuat asumsi.

Jika requirement belum jelas:

STOP.

Tanyakan kepada developer.

Jangan menebak.

---

# Architecture First

AI tidak boleh langsung membuat source code.

Urutan kerja selalu:

Requirement

↓

Analysis

↓

Design

↓

Implementation

↓

Testing

↓

Documentation

---

# Documentation First

Jika ada perubahan:

Business Rule

Database

API

Architecture

Flow

AI WAJIB memperbarui dokumentasi terlebih dahulu.

Baru kemudian memperbarui source code.

---

# Clean Architecture

Backend wajib mengikuti:

Controller

↓

Service

↓

Repository

↓

Model

Controller tidak boleh berisi Business Logic.

---

# React Architecture

Page

↓

Component

↓

Hook

↓

API

↓

Backend

Jangan membuat komponen yang terlalu besar.

Gunakan reusable component.

---

# Database

Sebelum membuat migration:

Pastikan relasi sudah benar.

Pastikan normalisasi.

Pastikan index.

Pastikan foreign key.

Pastikan tidak ada duplicate entity.

---

# API

Gunakan REST API.

Response wajib konsisten.

Success

{
    "success": true,
    "message": "",
    "data": {}
}

Error

{
    "success": false,
    "message": "",
    "errors": {}
}

---

# Validation

Validation wajib dilakukan di Backend.

Frontend validation hanya untuk User Experience.

---

# Authentication

Gunakan:

Google OAuth

Laravel Sanctum

Jangan menggunakan Session Authentication.

---

# Authorization

Gunakan Policy.

Jangan melakukan pengecekan role langsung di Controller.

---

# Frontend

Gunakan:

React

TypeScript

Tailwind

shadcn/ui

TanStack Query

Axios

React Hook Form

Zod

---

# Naming Convention

Gunakan Bahasa Inggris.

Contoh:

Borrowing

Return

Inventory

Category

Approval

User Interface menggunakan Bahasa Indonesia.

---

# Reusable Code

Sebelum membuat function:

Cari apakah sudah ada function serupa.

Jika ada:

Gunakan kembali.

Jangan duplicate code.

---

# Dependency

AI tidak boleh menambahkan package baru.

Kecuali:

Developer menyetujui.

---

# File Modification

AI hanya boleh mengubah file yang memang berkaitan dengan task.

Jangan melakukan refactor besar tanpa izin.

---

# Breaking Changes

AI tidak boleh mengubah:

Database Structure

API Contract

Folder Structure

Authentication

Permission

Tanpa persetujuan developer.

---

# Sprint Based Development

Ikuti:

14_DEVELOPMENT_ROADMAP.md

Selesaikan satu Sprint terlebih dahulu.

Jangan mengerjakan Sprint berikutnya sebelum Sprint sebelumnya selesai.

---

# Task Workflow

Untuk setiap task, AI harus mengikuti urutan berikut:

1. Analisis requirement.
2. Identifikasi file yang akan diubah.
3. Jelaskan rencana implementasi secara singkat.
4. Implementasikan perubahan.
5. Jalankan pengecekan konsistensi terhadap coding standard.
6. Perbarui dokumentasi jika diperlukan.
7. Berikan ringkasan hasil pekerjaan.

---

# Code Quality

Seluruh kode harus:

Readable

Maintainable

Reusable

Scalable

Simple

Tidak over-engineering.

---

# Error Handling

Semua proses harus memiliki:

Loading State

Empty State

Validation Error

Server Error

Retry

---

# Logging

Semua aktivitas penting wajib dicatat.

Login

Logout

Borrow

Return

Approval

Delete

Update

Failed Login

---

# Security

Validasi semua input.

Gunakan Authorization.

Gunakan CSRF Protection jika diperlukan.

Gunakan Rate Limiter.

Jangan mempercayai input dari frontend.

---

# Performance

Gunakan:

Pagination

Lazy Loading

Index Database

Caching bila diperlukan

Eager Loading Laravel

Hindari N+1 Query.

---

# Before Finishing Any Task

Pastikan:

✓ Tidak ada duplicate code.

✓ Tidak ada dead code.

✓ Tidak ada unused import.

✓ Tidak ada hardcoded value.

✓ Mengikuti Coding Standard.

✓ Mengikuti Business Rules.

✓ Mengikuti API Specification.

✓ Mengikuti Database Design.

✓ Dokumentasi diperbarui jika ada perubahan.

---

# Communication Style

Saat menjelaskan pekerjaan:

Ringkas.

Jelas.

Profesional.

Jika ada resiko:

Jelaskan.

Jika ada alternatif:

Jelaskan.

Jika ada asumsi:

Tanyakan terlebih dahulu.

---

# Final Principle

AI bukan sekadar code generator.

AI adalah anggota tim engineering.

Prioritas utama:

1. Konsistensi
2. Keamanan
3. Keterbacaan
4. Maintainability
5. Skalabilitas
6. Dokumentasi
7. Kualitas kode

Bukan kecepatan menghasilkan kode.

Selalu utamakan kualitas dibanding jumlah kode.