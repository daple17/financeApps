# Tahap 1: Build Image
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
# Jalankan Vite build untuk menghasilkan production bundle statis
RUN npm run build

# Tahap 2: Nginx Web Server
FROM nginx:alpine

# Salin konfigurasi custom Nginx untuk SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build dari tahap 1 ke folder yang diserve oleh Nginx
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
