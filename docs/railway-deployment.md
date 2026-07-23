# Panduan Deployment ke Railway (Aplikasi Live)

Aplikasi Anda sekarang sudah dimodifikasi menjadi sistem *Monolith* (satu kesatuan) yang sangat ramah terhadap *deployment* di Railway. Anda dapat mengikuti panduan langkah demi langkah di bawah ini untuk meng-*online*-kannya.

## Langkah 1: Push Kode ke GitHub
Railway membutuhkan kode Anda berada di repository GitHub (atau GitLab/Bitbucket). Jika kode ini belum ada di GitHub:
1. Buka akun [GitHub](https://github.com/) Anda dan buat *Repository* baru.
2. Melalui terminal/command prompt di direktori proyek Anda (`/Users/macbook/Documents/org-finance-app`), jalankan perintah berikut:
   ```bash
   git init
   git add .
   git commit -m "Siap deploy ke Railway"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/NAMA-REPO-ANDA.git
   git push -u origin main
   ```
   *(Pastikan mengganti URL origin dengan URL repository Anda yang sebenarnya)*.

## Langkah 2: Deploy di Railway
1. Kunjungi [Railway.app](https://railway.app/) dan *Login* menggunakan akun GitHub Anda.
2. Klik tombol **New Project** di pojok kanan atas.
3. Pilih opsi **"Deploy from GitHub repo"**.
4. Pilih repository yang baru saja Anda buat di Langkah 1.
5. Klik **Deploy Now**.
   
> [!NOTE]
> Pada tahap ini, Railway akan membaca file `package.json` yang baru saya buat, mengunduh NodeJS, meng-*install* semua library untuk Frontend dan Backend, lalu mengkompilasi file React menjadi statis. Ini mungkin memakan waktu 1-3 menit.

## Langkah 3: Tambahkan Database MySQL
1. Di halaman proyek Railway Anda (yang berisi aplikasi yang sedang di-deploy), klik tombol **+ New** di sudut atas.
2. Pilih opsi **Database** -> **Add MySQL**.
3. Railway akan membuatkan server MySQL kosong dalam beberapa detik. Karena sebelumnya saya sudah menambahkan kode untuk membaca *environment variable* milik Railway (seperti `MYSQLHOST` dan kawan-kawan), aplikasi Anda otomatis akan terhubung dengan database baru ini!

## Langkah 4: Membuat Tabel Database
Database MySQL di Railway masih kosong. Kita perlu membuat tabel-tabelnya (seperti `users`, `transactions`, dll).
1. Klik layanan MySQL yang baru saja Anda buat di dasbor Railway.
2. Buka tab **Connect**, lalu temukan pengaturan yang berisi koneksi MySQL Anda (Host, Port, User, Password, Database).
3. Anda punya 2 cara untuk memuat data tabel:
   - **Cara Mudah**: Buka terminal di laptop Anda, masuk ke dalam folder `/server`, dan jalankan perintah ini dengan environment variable dari Railway (menggunakan CLI).
   - **Cara Paling Mudah**: Jika Anda menggunakan **DBeaver** atau **TablePlus**, koneksikan aplikasi tersebut menggunakan info koneksi dari Railway. Setelah masuk, *copy-paste* seluruh isi dari file `Docs/server/database/init.sql` dan *Run/Execute* script tersebut.

## Langkah 5: Dapatkan Link URL
1. Kembali ke dasbor Railway dan klik layanan aplikasi Node.js Anda.
2. Masuk ke tab **Settings** -> **Networking** -> klik **Generate Domain**.
3. Railway akan memberi Anda link publik (contoh: `https://finance-app-production.up.railway.app`).
4. Buka link tersebut di browser, dan aplikasi Anda sudah online! 🎉
