# Dokumentasi Arsitektur & Peta Jalan (Phase Roadmap)
## Aplikasi Web Manajemen Keuangan Skala Organisasi

Dokumen ini berfungsi sebagai panduan arsitektur resmi, skema data, dan rekam jejak fase pengembangan untuk Sistem Manajemen Keuangan Organisasi berbasis **React.js**, **Express.js**, dan **MySQL**.

---

## 1. Ringkasan Proyek & Stack Teknologi

| Komponen | Teknologi | Keterangan / Pola Arsitektur |
| :--- | :--- | :--- |
| **Frontend** | React.js (v18), Vite, Tailwind CSS (v3) | *Feature-based structure*, Responsive Mobile-First, Dark Mode Theme |
| **Backend** | Node.js, Express.js | *Layered Architecture* (Routes -> Middlewares -> Controllers -> Services -> Models) |
| **Database** | MySQL (v8.0+) | Ter-normalisasi, FK constraints, Indexing, Double-entry Journaling |
| **Keamanan** | JWT, Refresh Token, Bcryptjs | Role-Based Access Control (RBAC) granular per endpoint |
| **Icons & Style**| Lucide React, Google Fonts (Inter) | Modern, minimalis, dan intuitif |

---

## 2. Struktur Folder Proyek (Feature-Based & Modular)

```
Docs/
├── docs/                                 # Dokumentasi Sistem
│   └── PROJECT_ROADMAP_AND_ARCHITECTURE.md
├── server/                               # Backend Node.js / Express.js
│   ├── config/                           # Database pool & Environment configs
│   ├── controllers/                      # Auth, COA, Transaction, Approval, Budget, Report Controllers
│   ├── services/                         # Auth, COA, Transaction, Approval, Budget, Report Services
│   ├── models/                           # User, COA, Transaction, Budget Models
│   ├── routes/                           # Auth, COA, Transaction, Approval, Budget, Report Routes
│   ├── middlewares/                      # Auth & RBAC Middlewares
│   ├── utils/                            # JWT & Password Helpers
│   └── database/                         # init.sql & migrate.js
└── client/                               # Frontend React.js + Vite + Tailwind CSS
    ├── src/
    │   ├── components/ui/                # Button, Card, Modal, Table, Badge, Input
    │   ├── context/                      # AuthContext, ToastContext
    │   ├── features/                     # Feature Modules (Auth, Dashboard, COA, Transactions, Approvals, Budget, Reports)
    │   ├── layouts/                      # DashboardLayout, Sidebar, Topbar
    │   ├── routes/                       # ProtectedRoute, AppRoutes
    │   ├── services/                     # Axios API client (api.js)
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 3. Peta Jalan Pengembangan (Phase Roadmap)

### 🟢 Fase 1: Perencanaan Arsitektur & Perancangan Sistem *(SELESAI)*
### 🟢 Fase 2: Setup Environment, Database Migration & Core Framework *(SELESAI)*
### 🟢 Fase 3: Authentication & Role-Based Access Control (RBAC) API *(SELESAI)*
### 🟢 Fase 4: Core Financial Business API *(SELESAI)*
### 🟢 Fase 5: Frontend Design System, Layouts & Routing *(SELESAI)*

---

### 🟢 Fase 6: Integrasi Frontend Modules & State Management *(SELESAI)*
- **Cakupan Penyelesaian**:
  1. Halaman **Chart of Accounts (COA)**: Interaktif dengan tabel data akun dan modal form penambahan/pengeditan.
  2. Halaman **Transaksi Keuangan**: Form double-entry terintegrasi dengan validasi balance (Debit == Kredit) real-time dan modal rincian jurnal.
  3. Halaman **Workflow Approval**: Review pengajuan transaksi, validasi approval, dan input alasan penolakan.
  4. Halaman **Manajemen Anggaran (Budgeting)**: Visualisasi persentase realisasi (progress bar warna hijau/kuning/merah).
  5. Halaman **Laporan Keuangan**: Tampilan Laba Rugi, Neraca, dan Buku Besar (General Ledger) siap cetak/PDF dengan verifikasi "Neraca Seimbang".

---

### ⏳ Fase 7: Testing, Verifikasi & Final Polishing *(BERIKUTNYA)*
- Verification menyeluruh double-entry bookkeeping, pengujian hak akses antar role (RBAC), penanganan error lanjutan (Error Boundaries), optimasi performa UI, dan *deployment readiness*.

---

## 4. Matriks Hak Akses (RBAC Matrix)

| Role | COA | Transaksi (Draft) | Approval Transaksi | Modul Anggaran | Laporan Keuangan | User Management |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin** | Full | Full | Full | Full | Full | Full |
| **Finance Admin**| Full | Create / Edit | Read | Full | Full | Read Only |
| **Approver** | Read | Read | Approve / Reject | Read | Read | - |
| **Auditor / Staff**| Read | Create (Draft) | - | Read | Read | - |

---

*Dokumen ini diperbarui secara berkala pada setiap penyelesaian fase pengembangan.*

---

## 5. Logika Dashboard Utama (Dashboard Summary API)

Dashboard aplikasi menampilkan 4 metrik utama secara dinamis yang bersumber dari aktivitas data *real-time*:

1. **Total Kas & Bank** 
   - **Sumber/Logika:** Dihitung dari tabel `journal_entries` dengan menjumlahkan total saldo (*Debit - Credit*) dari seluruh akun di tabel `accounts` yang bertipe `ASSET` dan memiliki kategori `Lancar`.
   - **Filter:** Hanya menyertakan jurnal dari transaksi (`transactions`) yang berstatus `APPROVED`.
2. **Pendapatan Bulan Ini**
   - **Sumber/Logika:** Dihitung dari tabel `journal_entries` dengan mengambil selisih (*Credit - Debit*) untuk seluruh akun bertipe `REVENUE`.
   - **Filter:** Transaksi harus berstatus `APPROVED` dan tanggal transaksi (`date`) berada pada bulan dan tahun yang sama dengan saat ini.
3. **Pending Approvals**
   - **Sumber/Logika:** Menghitung jumlah record (*count*) dari tabel `transactions`.
   - **Filter:** Status transaksi adalah `PENDING_APPROVAL`.
4. **Penggunaan Anggaran**
   - **Sumber/Logika:** Menghitung persentase dari serapan anggaran dengan rumus: `(SUM(used_amount) / SUM(allocated_amount)) * 100`.
   - **Filter:** Diambil dari tabel `budgets` khusus untuk periode bulan (`period_month`) dan tahun (`period_year`) berjalan.
