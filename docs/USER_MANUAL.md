# Panduan Pengguna (User Manual)
## Sistem Manajemen & Tata Kelola Keuangan Organisasi (OrgFinance)

Selamat datang di **OrgFinance**, sistem manajemen keuangan berskala organisasi yang dirancang untuk mempermudah pencatatan pembukuan ganda (*double-entry bookkeeping*), pemantauan anggaran, proses *approval* transaksi, dan pelaporan keuangan secara seketika (*real-time*).

Panduan ini akan membantu Anda memahami cara kerja sistem dan bagaimana menggunakan fitur-fitur utamanya.

---

## 1. Persiapan & Login

Aplikasi ini menggunakan sistem autentikasi tertutup berbasis *Role-Based Access Control (RBAC)*. 

1. Buka *browser* web Anda dan akses URL aplikasi (misal: `http://localhost:3000`).
2. Masukkan alamat email dan kata sandi yang telah diberikan oleh Administrator.
3. **Akun Demo (Default):**
   - **Super Admin**: `admin@orgfinance.com` (Sandi: `Admin@123456`) - *Akses Penuh*
   - **Finance Admin**: `finance@orgfinance.com` (Sandi: `Admin@123456`) - *Kelola Transaksi & Laporan*
   - **Manager/Approver**: `manager@orgfinance.com` (Sandi: `Admin@123456`) - *Menyetujui Transaksi*

---

## 2. Panduan Penggunaan Modul (Fitur Utama)

Setelah berhasil masuk, Anda akan diarahkan ke halaman **Dashboard**. Sidebar di sebelah kiri (atau tombol *hamburger menu* di perangkat seluler) digunakan untuk navigasi ke berbagai modul.

### A. Dashboard
Pusat kendali (Overview) yang menampilkan ringkasan kondisi keuangan organisasi.
- **Kartu Ringkasan (Cards)**: Menampilkan total Aset, total Beban bulan ini, Saldo Kas Utama, dsb.
- *Tip*: Gunakan *Dashboard* untuk memantau kesehatan finansial secara sepintas setiap harinya.

### B. Chart of Accounts (COA) / Bagan Akun
Modul ini digunakan untuk mengelola daftar akun pembukuan yang menjadi pondasi sistem akuntansi.
- **Lihat Akun**: Tabel akan menampilkan Kode, Nama Akun, Tipe (Aset/Kewajiban/Ekuitas/Pendapatan/Beban), dan Kategori.
- **Tambah Akun Baru**: Klik tombol **+ Tambah Akun Baru** di pojok kanan atas. Masukkan detail akun. Anda hanya bisa menambah jika peran (role) Anda mengizinkan.
- **Perhatian**: Jangan menghapus akun sembarangan, terutama jika akun tersebut sudah memiliki riwayat transaksi (jurnal).

### C. Transaksi & Jurnal Umum
Jantung dari aplikasi ini. Semua pergerakan uang dicatat di sini menggunakan metode **Double-Entry**.
1. Buka modul **Transaksi**.
2. Klik **+ Catat Transaksi / Jurnal**.
3. Isi informasi dasar: Tanggal, Tipe (INCOME / EXPENSE / TRANSFER / JOURNAL), dan Deskripsi.
4. **Isi Rincian Jurnal**: Anda **wajib** mendaftarkan minimal 2 akun (satu sebagai Debit, satu sebagai Kredit).
   - *Contoh Pemasukan*: Debit -> Kas (Aset bertambah), Kredit -> Pendapatan (Pendapatan bertambah).
5. **Validasi Balance**: Sistem akan otomatis mengecek apakah Total Debit = Total Kredit. Tombol simpan hanya akan aktif/berhasil jika seimbang.
6. Transaksi pengeluaran dalam jumlah besar (biasanya > Rp 5.000.000) mungkin akan masuk ke status `PENDING_APPROVAL`.

### D. Approval Flow (Persetujuan)
Modul ini khusus untuk peran **Approver / Manager**.
- Jika Anda melihat transaksi berstatus `PENDING_APPROVAL`, Anda dapat mengkliknya untuk melihat rincian jurnalnya.
- **Approve**: Mengizinkan transaksi untuk diakui secara sah oleh sistem.
- **Reject**: Menolak transaksi. Sistem akan meminta Anda memasukkan **Alasan Penolakan** agar pembuat transaksi mengetahuinya.

### E. Manajemen Anggaran (Budgeting)
Gunakan modul ini untuk menetapkan batas anggaran (*budget*) bulanan pada akun pengeluaran tertentu.
- Klik **+ Set Alokasi Anggaran** untuk menentukan bulan, tahun, akun (misal: "Beban Listrik"), dan nominal plafon pengeluaran.
- Tabel akan menampilkan perbandingan **Alokasi vs Pemakaian Riil**.
- **Progress Bar**:
  - 🟢 **Hijau**: Pemakaian di bawah batas.
  - 🟡 **Kuning**: Pemakaian mendekati batas (di atas 80%).
  - 🔴 **Merah**: *Over Budget!* (Pemakaian melebihi alokasi).

### F. Laporan Keuangan
Modul pelaporan otomatis yang bisa diakses kapan saja tanpa perlu menghitung ulang secara manual. Terdapat 3 tab utama:
1. **Laba Rugi (Income Statement)**: 
   - Pilih rentang Tanggal Mulai dan Tanggal Selesai.
   - Sistem akan menghitung total Pendapatan dikurangi total Beban Operasional untuk menghasilkan status **Laba** atau **Rugi**.
2. **Neraca (Balance Sheet)**:
   - Pilih per tanggal (*As Of Date*).
   - Menampilkan Aset di satu sisi, dan Kewajiban + Ekuitas di sisi lain.
   - Akan ada *Badge/Label* **✔ NERACA SEIMBANG** jika kalkulasinya tepat.
3. **Buku Besar (General Ledger)**:
   - Pilih **Satu Akun** (misal: "Kas Utama") dan rentang tanggal.
   - Menampilkan daftar mutasi (keluar/masuk uang) secara historis lengkap dengan saldo akhir/berjalan (*running balance*).
- Anda dapat menekan tombol **Cetak / PDF** untuk mengekspor dokumen laporan.

---

## 3. Matriks Hak Akses (Role-Based Permissions)

Sistem menggunakan kontrol hak akses ketat (RBAC). Berikut adalah otoritas yang dimiliki setiap peran:

| Role | Izin Utama | Kemampuan (Capabilities) |
| :--- | :--- | :--- |
| **Super Admin** | Semua Modul | Mengontrol seluruh sistem, membuat akun pengguna baru, mengubah peran. |
| **Finance Admin**| COA, Transaksi, Laporan, Anggaran | Menambah/mengubah struktur COA, membuat jurnal transaksi, melihat dan mencetak laporan keuangan. |
| **Approver** | Approval, Laporan | Hanya menyetujui/menolak pengajuan dana (transaksi) dan melihat laporan untuk pengawasan. Tidak bisa membuat transaksi. |
| **Auditor / Staff**| Transaksi (Draft), Laporan | Menginput draft (draf) transaksi. Hanya melihat laporan. Tidak bisa melakukan approval. |

---

*Panduan ini ditujukan sebagai referensi cepat. Jika Anda mengalami kendala teknis atau menemukan sistem berperilaku di luar kebiasaan, silakan hubungi tim Administrator IT Anda.*
