# Job Order Phase 1 - Dokumentasi Pengembangan

## Deskripsi
Dokumen ini merangkum pengembangan **Phase 1** dari Modul Job Order pada aplikasi `OrgFinance`. Tujuan dari fase ini adalah meletakkan fondasi utama operasional logistik dengan menciptakan entitas sentral **Job Order**. Sistem ini nantinya akan berkembang menjadi ERP Logistik yang menghubungkan Modul Job Order dengan Operasional, Keuangan, Procurement, dan WhatsApp.

## Struktur Database

Pengembangan ini menggunakan pendekatan migrasi *additive* (tidak menghapus data existing) melalui skrip `server/database/migrations/001_phase1_job_orders.sql`.
Dua tabel baru yang ditambahkan:

1. **`job_orders`**: Menyimpan data utama Job Order.
2. **`job_order_activities`**: Menyimpan log aktivitas (Audit Trail) dari setiap perubahan pada Job Order.

### Aturan Job Order Number
- Dibuat otomatis oleh backend dengan format: `JO-YYYYMM-XXXX` (contoh: `JO-202607-0001`).
- *Sequence* akan otomatis me-reset ke `0001` setiap pergantian bulan.
- Menggunakan *row-level lock* (`FOR UPDATE`) di dalam *database transaction* saat *generation* untuk mencegah duplikasi nomor meskipun terjadi *concurrent request*.

## Arsitektur Backend (Express.js)
Telah ditambahkan struktur MVC standar pada Express:
- **Model** (`server/models/jobOrderModel.js`): Mengelola operasi *query* database. Menangani transaksi MySQL untuk pembuatan Job Order sekaligus menyisipkan log ke tabel `job_order_activities`.
- **Controller** (`server/controllers/jobOrderController.js`): Mengelola validasi payload (*request body*), *business logic*, dan mengirim *response* seragam.
- **Routes** (`server/routes/jobOrderRoutes.js`): 
  - `GET /api/v1/job-orders` (dengan filter, search, pagination)
  - `POST /api/v1/job-orders`
  - `GET /api/v1/job-orders/:id`
  - `PUT /api/v1/job-orders/:id`
- **Middleware**: Endpoint dilindungi oleh middleware *authentication* dan *authorization* (RBAC) bawaan (`requirePermission(['job_orders.*'])`).

## Arsitektur Frontend (React + Vite)
- Ditempatkan di dalam *feature folder* `client/src/features/operations/job-orders/`.
- UI menggunakan komponen yang telah ada (`Card`, `Button`, `Input`, `Badge`) sehingga tetap konsisten dengan *design system* modul *finance* yang sudah ada.

**Daftar Halaman:**
1. **Job Order List** (`JobOrderListPage.jsx`): Menampilkan tabel Job Order dengan fitur pencarian dan penyaringan berdasarkan status.
2. **Create Job Order** (`CreateJobOrderPage.jsx`) & **Edit Job Order** (`EditJobOrderPage.jsx`): Bertindak sebagai _wrapper_ untuk komponen `JobOrderForm.jsx`.
3. **Job Order Form** (`JobOrderForm.jsx`): *Reusable form component* dengan 5 segmen informasi (Job, Pengiriman, Muatan, Kebutuhan Transportasi, Tambahan) dan *client-side validation*.
4. **Job Order Detail** (`JobOrderDetailPage.jsx`): Menampilkan rangkuman data (Overview) dan log riwayat (Activity).

**Perubahan Global UI:**
- **Sidebar** (`client/src/layouts/Sidebar.jsx`): Ditambahkan bagian/kategori baru bernama **OPERASIONAL** di atas bagian Keuangan.

## Batasan (Known Limitations Phase 1)
Agar pengembangan fase pertama fokus pada struktur utama, beberapa fitur sbb **sengaja tidak diimplementasikan** dan ditunda ke Phase 2:
- Entitas *Master Data* terpisah untuk `Customer`, `Vehicle`, dan `Driver`. (Saat ini *customer* dan kendaraan di-input berupa teks bebas langsung di entitas Job Order).
- Integrasi *GPS Tracking* dan *Driver Assignment*.
- Sistem notifikasi *WhatsApp API*.
- Modul *Procurement* & Vendor.
- Sinkronisasi nilai *Cost* dan *Revenue* ke modul *Finance* (Jurnal Otomatis / *Invoice*).
- Tab **Operation**, **Cost**, dan **Documents** di halaman detail masih berupa *placeholder* kosong.

## Panduan untuk Phase 2
Saat akan melanjutkan pengembangan ke Phase 2, ikuti panduan berikut:
1. **Master Data**: Buat tabel `master_customers`, `master_vehicles`, dll. Lalu ubah struktur `job_orders` menggunakan relasi (Foreign Key) untuk entitas-entitas tersebut (contoh: `customer_id` menggantikan `customer_name`).
2. **Operational Status**: Tab *Operation* dapat mulai diaktifkan untuk melacak status perjalanan/trip driver (*Arrived at Pickup*, *Loading*, dll) yang terpisah dari status *high-level* Job Order (`CONFIRMED`, `COMPLETED`).
3. **Integrasi Finansial**: Saat sebuah Job Order ditutup/selesai, tambahkan *event trigger* agar sistem otomatis men-*generate* `transactions` dan `journal_entries` berdasarkan biaya operasional (Cost) dan tagihan pelanggan (Revenue).

---
*Dokumen ini dibuat pada fase akhir Phase 1 untuk menjaga kualitas dan kontinuitas arsitektur perangkat lunak.*
