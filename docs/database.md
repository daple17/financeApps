# Dokumentasi Skema Database (Organization Financial Management System)

Sistem ini menggunakan database relasional (MySQL) yang dirancang untuk pencatatan transaksi keuangan organisasi dengan prinsip *Double-Entry Bookkeeping*.

## Daftar Tabel

Sistem ini memiliki 7 tabel utama, yaitu:

1. **`roles`**: Menyimpan peran dan hak akses (RBAC) pengguna.
2. **`users`**: Menyimpan data pengguna yang dapat masuk ke dalam sistem.
3. **`accounts`**: *Chart of Accounts* (COA) yang merupakan struktur akun keuangan.
4. **`transactions`**: Mencatat semua pengajuan atau transaksi keuangan.
5. **`journal_entries`**: Jurnal *double-entry* (Debit/Kredit) dari setiap transaksi yang disetujui.
6. **`budgets`**: Anggaran yang dialokasikan untuk setiap akun COA per bulan.
7. **`audit_logs`**: Rekaman jejak (*audit trail*) dari aktivitas pengguna.

---

## Detail Struktur Tabel

### 1. `roles` (Peran dan Hak Akses)
Menyimpan definisi level akses dalam sistem.
- `id` (INT) - Primary Key
- `name` (VARCHAR) - Nama role (contoh: Super Admin, Finance Admin).
- `description` (VARCHAR) - Deskripsi peran.
- `permissions` (JSON) - Daftar izin (contoh: `["transactions.*", "reports.read"]`).
- `created_at` (TIMESTAMP)

### 2. `users` (Pengguna)
- `id` (INT) - Primary Key
- `username` (VARCHAR) - Nama pengguna untuk login (Unik).
- `name` (VARCHAR) - Nama lengkap pengguna.
- `email` (VARCHAR) - Email untuk komunikasi/alternatif login (Unik).
- `nip` (VARCHAR) - Nomor Induk Pegawai (Opsional).
- `phone_number` (VARCHAR) - Nomor kontak (Opsional).
- `password_hash` (VARCHAR) - Password yang telah dienkripsi (Bcrypt).
- `role_id` (INT) - Foreign Key ke tabel `roles`.
- `is_active` (BOOLEAN) - Status aktif/non-aktif akun.

### 3. `accounts` (Chart of Accounts / COA)
Struktur hirarki kode akun keuangan, dikelompokkan ke dalam 5 tipe utama.
- `id` (INT) - Primary Key
- `code` (VARCHAR) - Kode akun (contoh: 1100, 5000) (Unik).
- `name` (VARCHAR) - Nama akun (contoh: Kas Utama).
- `type` (ENUM) - Tipe akun: `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`.
- `category` (VARCHAR) - Sub-kategori (Lancar, Tetap, Operasional, dll).
- `parent_id` (INT) - Foreign Key ke tabel `accounts` itu sendiri (untuk hirarki *Header* & *Detail*).

### 4. `transactions` (Transaksi Keuangan)
Berfungsi mencatat setiap aktivitas pergerakan uang yang terjadi, termasuk siklus *approval*.
- `id` (INT) - Primary Key
- `transaction_number` (VARCHAR) - Nomor referensi transaksi (Unik).
- `date` (DATE) - Tanggal transaksi.
- `type` (ENUM) - Tipe transaksi: `INCOME`, `EXPENSE`, `TRANSFER`, `JOURNAL`.
- `description` (TEXT) - Keterangan/Catatan transaksi.
- `amount` (DECIMAL) - Nominal transaksi.
- `status` (ENUM) - Status persetujuan: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `REJECTED`.
- `attachment_url` (VARCHAR) - Bukti transfer/nota (Opsional).
- `created_by` (INT) - Foreign Key ke tabel `users` (Pembuat transaksi).
- `approved_by` (INT) - Foreign Key ke tabel `users` (Penyetuju).
- `rejection_reason` (TEXT) - Alasan jika ditolak.

### 5. `journal_entries` (Pencatatan Jurnal / Double-Entry)
Sistem pembukuan ganda (Debit dan Kredit) yang selalu berimbang. Data di sini dihasilkan secara otomatis saat `transactions` disetujui.
- `id` (INT) - Primary Key
- `transaction_id` (INT) - Foreign Key ke tabel `transactions`.
- `account_id` (INT) - Foreign Key ke tabel `accounts` (COA).
- `entry_type` (ENUM) - Posisi Jurnal: `DEBIT` atau `CREDIT`.
- `amount` (DECIMAL) - Nilai moneter mutasi.

### 6. `budgets` (Anggaran)
Menetapkan dan memonitor anggaran bulanan pada suatu akun COA.
- `id` (INT) - Primary Key
- `account_id` (INT) - Foreign Key ke tabel `accounts`.
- `period_month` (INT) - Bulan anggaran (1-12).
- `period_year` (INT) - Tahun anggaran.
- `allocated_amount` (DECIMAL) - Nilai alokasi (Plafon).
- `used_amount` (DECIMAL) - Nilai yang telah terpakai/direalisasikan.
*(Memiliki Unique Key pada kombinasi account_id, period_month, period_year agar tidak ada duplikasi anggaran).*

### 7. `audit_logs` (Log Aktivitas)
Setiap mutasi data penting dicatat di sini untuk tujuan keamanan dan transparansi.
- `id` (INT) - Primary Key
- `user_id` (INT) - Foreign Key ke tabel `users` (Siapa yang melakukan).
- `action` (VARCHAR) - Jenis aksi (contoh: CREATE_TRANSACTION).
- `entity_type` (VARCHAR) - Nama modul (contoh: TRANSACTIONS).
- `entity_id` (INT) - ID dari data yang diubah.
- `details` (JSON) - Data tambahan atau perubahan yang terjadi.
- `ip_address` (VARCHAR) - Alamat IP pengguna.

---

## Standar Keamanan & Integritas Data
- Transaksi yang sudah masuk jurnal (`journal_entries`) dilarang dihapus, melainkan harus dilakukan jurnal pembalik jika terjadi pembatalan (*Best practice* akuntansi).
- Kata sandi dilindungi menggunakan Bcrypt Hash dengan *salt*.
- Foreign Key *Cascading rules*:
  - Jika akun (COA) di-*delete*, ia akan di-RESTRICT apabila telah memiliki riwayat Jurnal.
  - Jika transaksi di-*delete*, jurnal turunannya akan ikut dihapus (namun UI mencegah transaksi berstatus APPROVED untuk dihapus).

---

## Akun Pengguna Default (Seed Data)

Saat database pertama kali diinisialisasi, sistem secara otomatis membuatkan tiga akun pengguna dengan peran yang berbeda untuk keperluan *testing* dan penyiapan awal.

Semua akun default di bawah ini menggunakan **Password:** `Admin@123456`

| Nama | Email | Role (Peran) |
| --- | --- | --- |
| System Administrator | `admin@orgfinance.com` | Super Admin |
| Finance Officer | `finance@orgfinance.com` | Finance Admin |
| Finance Manager | `manager@orgfinance.com` | Approver |

> [!WARNING]
> Sangat disarankan untuk segera mengubah password atau menonaktifkan akun-akun default ini saat sistem sudah masuk ke tahap produksi (Live) untuk mencegah akses yang tidak sah.

---

## Kredensial Database Lokal (Development)

Untuk mempermudah proses *handover* dan pengembangan di perangkat lokal menggunakan Docker, berikut adalah informasi koneksi default untuk MySQL yang dikonfigurasi melalui `docker-compose.yml`:

- **Host**: `localhost` (atau `127.0.0.1`)
- **Port**: `3306`
- **Database**: `financial_app`
- **Username**: `dbuser`
- **Password**: `dbpassword`

*Catatan: Jika Anda butuh akses penuh (root) ke dalam MySQL lokal, Anda dapat menggunakan username `root` dengan password `rootpassword`.*

> [!TIP]
> Jika Anda menggunakan Railway untuk produksi, informasi koneksi ini akan diganti secara otomatis oleh sistem membaca *environment variables* seperti `MYSQLHOST`, `MYSQLUSER`, dll.
