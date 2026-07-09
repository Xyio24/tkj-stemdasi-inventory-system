# Inventory & Borrowing System - TKJ SMKN 2 Singosari

![Laravel](https://img.shields.io/badge/Laravel-13-red)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8)
![MariaDB](https://img.shields.io/badge/Database-MariaDB-orange)
![License](https://img.shields.io/badge/License-MIT-green)

A modern inventory and borrowing management system for TKJ laboratory.

This project is designed to manage laboratory equipment, borrowing transactions, stock management, approval workflow, and reporting for vocational schools.

---

# Features

## Authentication

- Google OAuth
- Laravel Sanctum
- Role Based Access
- Protected Routes

## Inventory

- Category Management
- Item Management
- Stock Management
- Image Upload
- Search & Filter

## Borrowing

- Borrow Equipment
- Upload Selfie
- Teacher Approval
- Borrow History

## Returning

- Return Equipment
- Upload Selfie
- Approval Workflow
- Automatic Stock Update

## Dashboard

- Statistics
- Recent Activity
- Low Stock Alert
- Pending Approval

## Reporting

- Borrow Report
- Return Report
- Inventory Report
- Export Excel
- Export PDF

---

# Tech Stack

## Backend

- Laravel 13
- PHP 8.3
- MariaDB
- Laravel Sanctum
- Google OAuth

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Axios
- TanStack Query
- React Hook Form
- Zod

## Deployment

- Ubuntu 24
- Nginx Proxy Manager
- MariaDB
- Supervisor

---

# Project Structure

```text
Inventory-TKJ/

backend/
frontend/
docs/

AGENTS.md
CLAUDE.md
PROJECT_CONTEXT.md
README.md
TODO.md
```

---

# Documentation

See:

docs/

- AI Instructions
- Requirements
- Business Rules
- Database Design
- API Specification
- Coding Standards
- Development Roadmap

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# Environment

Backend

```env
APP_NAME=Inventory TKJ

APP_ENV=local

APP_URL=http://localhost:8000

DB_CONNECTION=mysql

DB_HOST=127.0.0.1

DB_PORT=3306

DB_DATABASE=inventory_tkj

DB_USERNAME=root

DB_PASSWORD=
```

Frontend

```env
VITE_API_URL=http://localhost:8000/api
```

---

# Development Workflow

Sprint 0

Project Setup

↓

Sprint 1

Authentication

↓

Sprint 2

Master Data

↓

Sprint 3

Inventory

↓

Sprint 4

Borrowing

↓

Sprint 5

Returning

↓

Sprint 6

Dashboard

↓

Sprint 7

Reporting

---

# Coding Standards

See:

docs/13_CODING_STANDARDS.md

---

# License

MIT License