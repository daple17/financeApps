# Gunakan Node.js versi 18 Alpine yang ringan
FROM node:18-alpine

# Buat direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json terlebih dahulu
# untuk memanfaatkan caching Docker saat instalasi dependensi
COPY package*.json ./

# Install dependensi produksi (tanpa devDependencies jika memungkinkan)
RUN npm install

# Salin seluruh kode backend
COPY . .

# Ekspos port yang digunakan oleh Express.js
EXPOSE 5000

# Perintah untuk menjalankan server
CMD ["npm", "start"]
