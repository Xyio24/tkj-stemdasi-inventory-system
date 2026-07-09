# 12 — DEPLOYMENT & OPERATION
## Sistem Inventaris & Peminjaman Barang — Jurusan TKJ

---

## 1. Lingkungan Kerja (Environments)

### 1.1 Development Environment
- **Operating System:** Windows / macOS / Linux
- **PHP Version:** 8.3+ (dengan ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `xml`, `zip`, `gd`)
- **Node.js Version:** 22.x LTS (dengan npm 10.x+)
- **Database:** MariaDB 10.11+ / MySQL 8.0+
- **Dev Servers:**
  - Backend: `php artisan serve` (Port 8000)
  - Frontend: `npm run dev` (Port 5173)

### 1.2 Production Environment
- **Server OS:** Ubuntu 24.04 LTS (HVM)
- **Web Server:** Nginx (API and Frontend SPA)
- **PHP Process:** PHP 8.3-FPM
- **Database:** MariaDB Server 10.11+ (Local / Managed)
- **Reverse Proxy / SSL:** Nginx Proxy Manager / Certbot
- **Process Supervisor:** Supervisor daemon (Queue Worker)

---

## 2. Struktur Folder Deployment di Server

Seluruh kode program diletakkan di bawah direktori standar web server:

```
/var/www/inventory-tkj/
├── backend/                # Lokasi source code Laravel API
│   ├── bootstrap/cache/    # Hak akses write: www-data
│   ├── public/             # Document root Nginx untuk api.inventortkj.sch.id
│   └── storage/            # Hak akses write: www-data (selfie, cover)
└── frontend/
    └── dist/               # Document root Nginx untuk inventortkj.sch.id (React build static)
```

---

## 3. Langkah Instalasi Server Ubuntu 24.04

### 3.1 Instalasi Dependensi OS

```bash
# Update repositori & paket sistem
sudo apt update && sudo apt upgrade -y

# Tambahkan PPA PHP Ondrej
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.3-FPM & Ekstensi
sudo apt install -y php8.3-fpm php8.3-mysql php8.3-mbstring php8.3-xml \
                    php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-bcmath

# Install Web Server, Database, & Tools
sudo apt install -y nginx mariadb-server supervisor git curl unzip
```

### 3.2 Konfigurasi Database (MariaDB)

```bash
# Amankan instalasi MariaDB
sudo mysql_secure_installation

# Masuk ke CLI mysql
sudo mysql -u root -p
```

Eksekusi perintah SQL berikut untuk setup database:
```sql
CREATE DATABASE inventory_tkj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inv_prod_user'@'localhost' IDENTIFIED BY 'PasswordProdYangKuat123!';
GRANT ALL PRIVILEGES ON inventory_tkj.* TO 'inv_prod_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. Konfigurasi Web Server & SSL

### 4.1 Nginx Proxy Manager (Rekomendasi)
Jika menggunakan Nginx Proxy Manager (NPM) berbasis Docker:
- Buat Proxy Host baru untuk `inventortkj.sch.id` (Arahkan ke lokasi directory build frontend atau container IP).
- Buat Proxy Host baru untuk `api.inventortkj.sch.id` (Arahkan ke Nginx backend port).
- Aktifkan fitur Let's Encrypt SSL dan centang "Force SSL".

### 4.2 Nginx Standar (Konfigurasi Manual)

#### Konfigurasi Frontend SPA (`/etc/nginx/sites-available/inventory-frontend`)
```nginx
server {
    listen 80;
    server_name inventortkj.sch.id www.inventortkj.sch.id;
    root /var/www/inventory-tkj/frontend/dist;
    index index.html;

    location / {
        # Semua rute dikembalikan ke index.html untuk ditangani React Router SPA
        try_files $uri $uri/ /index.html;
    }
}
```

#### Konfigurasi Backend API (`/etc/nginx/sites-available/inventory-api`)
```nginx
server {
    listen 80;
    server_name api.inventortkj.sch.id;
    root /var/www/inventory-tkj/backend/public;
    index index.php;

    client_max_body_size 10M; # Batas maksimum upload selfie siswa

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }
}
```

---

## 5. Antrean Proses (Queue Worker via Supervisor)

Logika pemrosesan log aktivitas dan job latar belakang diatur oleh daemon Supervisor agar tetap hidup saat crash.

Buat file baru `/etc/supervisor/conf.d/inventory-worker.conf`:
```ini
[program:inventory-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/inventory-tkj/backend/artisan queue:work database --sleep=3 --tries=3
directory=/var/www/inventory-tkj/backend
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/supervisor/inventory-queue.log
```

Jalankan perintah berikut untuk mengaktifkan:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start inventory-queue:*
```

---

## 6. Prosedur Backup & Restore Database

### 6.1 Script Backup Otomatis (Cron Job)
Tambahkan entri backup harian ke crontab server (`sudo crontab -e`):
```cron
# Backup otomatis setiap hari pukul 02.00 subuh, simpan dalam bentuk kompresi gzip
0 2 * * * mysqldump -u inv_prod_user -p'PasswordProdYangKuat123!' inventory_tkj | gzip > /var/backups/db_inventory_tkj_$(date +\%Y\%m\%d).sql.gz

# Hapus file backup yang berumur lebih dari 30 hari
0 3 * * * find /var/backups/ -name "db_inventory_tkj_*.sql.gz" -mtime +30 -delete
```

### 6.2 Prosedur Restore
Jika terjadi kerusakan data, lakukan restore menggunakan cadangan terakhir:
```bash
# Ekstrak file backup gzip
gunzip -c /var/backups/db_inventory_tkj_YYYYMMDD.sql.gz > temp_restore.sql

# Import kembali ke database MariaDB
mysql -u inv_prod_user -p'PasswordProdYangKuat123!' inventory_tkj < temp_restore.sql

# Hapus file temporer pasca restore
rm temp_restore.sql
```

---

## 7. Disaster Recovery Plan (Rencana Pemulihan)

Jika server utama mengalami kegagalan fatal (Hardware Failure / Data Loss):

1. **Penyediaan Server Baru:** Siapkan VPS/Instance Ubuntu 24.04 LTS baru.
2. **Kloning Repositori:** Tarik ulang source code dari git production branch.
3. **Konfigurasi File Environment:** Salin backup file `.env` (pastikan `APP_KEY` sama persis agar data terenkripsi sebelumnya tetap bisa didekripsi).
4. **Restore Database:** Jalankan prosedur restore database menggunakan file dump `.sql.gz` terakhir yang tersimpan di server cadangan eksternal.
5. **Re-link Storage Assets:** Pulihkan file aset gambar selfie peminjaman dari sistem backup penyimpanan eksternal (AWS S3 / Cloud Storage / Drive backup) ke direktori `storage/app/public/` dan jalankan `php artisan storage:link`.
6. **Aktifkan Nginx & SSL:** Konfigurasi ulang Nginx danCertbot SSL.
7. **Verifikasi Jalur Antrean:** Pastikan Supervisor worker aktif memproses queue.
