# Sistem Manajemen Keuangan Organisasi (OrgFinance)

Aplikasi Web Manajemen Keuangan skala organisasi berbasis **React.js**, **Express.js**, dan **MySQL** dengan arsitektur modular, *scalable*, modern, dan 100% responsif (*Mobile-First*).

---

## 📚 Dokumentasi Proyek

Dokumentasi lengkap perancangan arsitektur, skema database, matriks RBAC, dan rekam jejak fase pengembangan dapat diakses di:
👉 **[PROJECT_ROADMAP_AND_ARCHITECTURE.md](file:///c:/Users/IDX-345/OneDrive%20-%20Caxe%20Tech/Documents/Docs/docs/PROJECT_ROADMAP_AND_ARCHITECTURE.md)**

---

## 🏗️ Struktur Proyek

- **`/server`**: Backend Node.js / Express.js (Layered Architecture: Controllers, Services, Models, Routes, Middlewares).
- **`/client`**: Frontend React.js + Vite + Tailwind CSS (Feature-based Modular Architecture).
- **`/docs`**: Dokumentasi teknis & arsitektur proyek.

---

## ⚡ Quick Start

### 1. Backend Service (`server/`)
```bash
cd server
npm install
npm run db:init   # Menjalankan migrasi DDL database MySQL
npm run dev       # Menjalankan server backend (Port 5000)
```

### 2. Frontend Application (`client/`)
```bash
cd client
npm install
npm run dev       # Menjalankan app React Vite (Port 3000)
```

---

## 🛡️ Lisensi & Hak Cipta
Dikembangkan untuk Sistem Pengelolaan & Akuntabilitas Keuangan Organisasi.
