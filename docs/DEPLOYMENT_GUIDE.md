# DEPLOYMENT_GUIDE.md — Inventory TKJ

> Panduan deployment ke Ubuntu Server 24.04 LTS dengan Nginx, MariaDB, Supervisor, dan Git.

---

## Stack Deployment

| Komponen | Versi | Keterangan |
|---|---|---|
| OS | Ubuntu 24.04 LTS | Server produksi |
| Web Server | Nginx | Reverse proxy + static file serving |
| PHP-FPM | 8.3 | PHP runtime untuk Laravel |
| Database | MariaDB 10.11+ | MySQL-compatible |
| Process Manager | Supervisor | Menjaga queue worker tetap berjalan |
| SSL | Nginx Proxy Manager / Certbot | HTTPS |
| Deployment | Git + manual / GitHub Actions | CI/CD |

---

## Arsitektur Deployment

```
Internet
    │
    ▼
[Nginx Proxy Manager]  ← SSL termination
    │
    ├── api.inventortkj.sch.id  →  [Nginx + PHP-FPM]  →  Laravel Backend
    │                                                           │
    └── inventortkj.sch.id      →  [Nginx Static]       [MariaDB]
                                   frontend/dist/
                                                      [Supervisor Queue Worker]
```

---

## BAGIAN 1 — Persiapan Server

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip
```

### 1.2 Install PHP 8.3

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y \
    php8.3 \
    php8.3-fpm \
    php8.3-mysql \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-curl \
    php8.3-zip \
    php8.3-gd \
    php8.3-intl \
    php8.3-bcmath \
    php8.3-tokenizer
```

Verifikasi:
```bash
php --version
# PHP 8.3.x (cli)
```

### 1.3 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 1.4 Install MariaDB

```bash
sudo apt install -y mariadb-server
sudo systemctl enable mariadb
sudo mysql_secure_installation
```

### 1.5 Install Node.js (untuk build frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # v22.x
npm --version   # 10.x
```

### 1.6 Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 1.7 Install Supervisor

```bash
sudo apt install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

---

## BAGIAN 2 — Setup Database

```bash
sudo mysql -u root -p
```

```sql
-- Buat database
CREATE DATABASE inventory_tkj
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Buat user khusus (ganti password!)
CREATE USER 'inv_user'@'localhost' IDENTIFIED BY 'StrongP@ssw0rd!';
GRANT ALL PRIVILEGES ON inventory_tkj.* TO 'inv_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## BAGIAN 3 — Deploy Backend (Laravel)

### 3.1 Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/username/inventory-tkj.git inventory-tkj
sudo chown -R $USER:www-data /var/www/inventory-tkj
```

### 3.2 Install Dependencies

```bash
cd /var/www/inventory-tkj/backend
composer install --no-dev --optimize-autoloader
```

### 3.3 Konfigurasi Environment

```bash
cp .env.example .env
nano .env
```

Isi `.env` production:
```env
APP_NAME="Inventory TKJ"
APP_ENV=production
APP_KEY=                          # akan diisi oleh artisan key:generate
APP_DEBUG=false
APP_URL=https://api.inventortkj.sch.id

APP_LOCALE=id
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=id_ID

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inventory_tkj
DB_USERNAME=inv_user
DB_PASSWORD=StrongP@ssw0rd!

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

FILESYSTEM_DISK=public

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# CORS
SANCTUM_STATELESS_DOMAINS=inventortkj.sch.id,www.inventortkj.sch.id
```

### 3.4 Generate Key & Migrate

```bash
php artisan key:generate

# Jalankan migration
php artisan migrate --force

# Seed data awal (admin user)
php artisan db:seed --class=AdminSeeder

# Buat symbolic link untuk storage
php artisan storage:link
```

### 3.5 Optimasi Production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 3.6 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/inventory-tkj/backend/storage
sudo chown -R www-data:www-data /var/www/inventory-tkj/backend/bootstrap/cache
sudo chmod -R 775 /var/www/inventory-tkj/backend/storage
sudo chmod -R 775 /var/www/inventory-tkj/backend/bootstrap/cache
```

---

## BAGIAN 4 — Build Frontend (React)

### 4.1 Buat file environment production

```bash
cd /var/www/inventory-tkj/frontend
nano .env.production
```

```env
VITE_API_URL=https://api.inventortkj.sch.id/api
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### 4.2 Install & Build

```bash
npm ci --omit=dev
npm run build
# Output: frontend/dist/
```

---

## BAGIAN 5 — Konfigurasi Nginx

### 5.1 Backend API Server

```bash
sudo nano /etc/nginx/sites-available/inventory-api
```

```nginx
server {
    listen 80;
    server_name api.inventortkj.sch.id;
    root /var/www/inventory-tkj/backend/public;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    # Logging
    access_log /var/log/nginx/inventory-api.access.log;
    error_log  /var/log/nginx/inventory-api.error.log;

    # Max upload size (untuk foto selfie)
    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # Blokir akses ke file sensitif
    location ~ /\.(?!well-known).* {
        deny all;
    }

    location ~ /\.env {
        deny all;
    }
}
```

### 5.2 Frontend SPA Server

```bash
sudo nano /etc/nginx/sites-available/inventory-frontend
```

```nginx
server {
    listen 80;
    server_name inventortkj.sch.id www.inventortkj.sch.id;
    root /var/www/inventory-tkj/frontend/dist;
    index index.html;

    access_log /var/log/nginx/inventory-frontend.access.log;
    error_log  /var/log/nginx/inventory-frontend.error.log;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        # PENTING: semua route dikembalikan ke index.html untuk React Router
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 Aktifkan konfigurasi

```bash
sudo ln -s /etc/nginx/sites-available/inventory-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/inventory-frontend /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## BAGIAN 6 — Konfigurasi Supervisor (Queue Worker)

```bash
sudo nano /etc/supervisor/conf.d/inventory-queue.conf
```

```ini
[program:inventory-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/inventory-tkj/backend/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
directory=/var/www/inventory-tkj/backend
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/supervisor/inventory-queue.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start inventory-queue:*
sudo supervisorctl status
```

---

## BAGIAN 7 — SSL dengan Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

# Issue certificate untuk kedua domain
sudo certbot --nginx -d inventortkj.sch.id -d www.inventortkj.sch.id
sudo certbot --nginx -d api.inventortkj.sch.id

# Auto-renewal sudah dikonfigurasi oleh certbot
# Test renewal:
sudo certbot renew --dry-run
```

---

## BAGIAN 8 — PHP-FPM Tuning

```bash
sudo nano /etc/php/8.3/fpm/pool.d/www.conf
```

```ini
; Sesuaikan dengan RAM server
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500
```

```bash
sudo nano /etc/php/8.3/fpm/php.ini
```

```ini
; Upload settings (untuk foto selfie)
upload_max_filesize = 10M
post_max_size = 15M
max_execution_time = 120
memory_limit = 256M
```

```bash
sudo systemctl restart php8.3-fpm
```

---

## BAGIAN 9 — Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Proses Update / Redeploy

Buat script update:

```bash
sudo nano /var/www/inventory-tkj/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "=== Starting deployment ==="

# Pull latest code
cd /var/www/inventory-tkj
git pull origin main

# Backend
echo "--- Updating backend ---"
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
echo "--- Building frontend ---"
cd ../frontend
npm ci --omit=dev
npm run build

# Restart services
echo "--- Restarting services ---"
sudo supervisorctl restart inventory-queue:*
sudo systemctl reload php8.3-fpm
sudo systemctl reload nginx

echo "=== Deployment complete ==="
```

```bash
chmod +x /var/www/inventory-tkj/deploy.sh
```

---

## Monitoring & Maintenance

### Cek status semua service

```bash
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mariadb
sudo supervisorctl status
```

### Log files

| Log | Path |
|---|---|
| Nginx access (API) | `/var/log/nginx/inventory-api.access.log` |
| Nginx error (API) | `/var/log/nginx/inventory-api.error.log` |
| Nginx access (Frontend) | `/var/log/nginx/inventory-frontend.access.log` |
| Laravel app log | `/var/www/inventory-tkj/backend/storage/logs/laravel-YYYY-MM-DD.log` |
| Queue worker log | `/var/log/supervisor/inventory-queue.log` |
| MariaDB error log | `/var/log/mysql/error.log` |

### Backup database

```bash
# Tambahkan ke crontab
sudo crontab -e

# Backup setiap hari jam 02:00
0 2 * * * mysqldump -u inv_user -p'StrongP@ssw0rd!' inventory_tkj | gzip > /var/backups/inventory_tkj_$(date +\%Y\%m\%d).sql.gz

# Hapus backup lebih dari 30 hari
0 3 * * * find /var/backups -name "inventory_tkj_*.sql.gz" -mtime +30 -delete
```

---

## Checklist Deployment

### Pre-deployment
- [ ] Domain DNS sudah diarahkan ke IP server
- [ ] SSL certificate sudah diissue
- [ ] Database sudah dibuat & user sudah punya akses
- [ ] Google OAuth Client ID sudah dikonfigurasi untuk domain produksi
- [ ] `.env` production sudah diisi semua nilai

### Post-deployment
- [ ] `https://api.inventortkj.sch.id/up` mengembalikan HTTP 200
- [ ] Login Google berhasil
- [ ] Upload foto berhasil (cek storage symbolic link)
- [ ] Queue worker berjalan (`supervisorctl status`)
- [ ] SSL certificate valid (lock hijau di browser)
- [ ] Halaman frontend tidak 404 saat refresh
- [ ] Log tidak ada error di `/storage/logs/`

---

## Troubleshooting Umum

| Masalah | Penyebab | Solusi |
|---|---|---|
| 502 Bad Gateway | PHP-FPM tidak berjalan | `sudo systemctl restart php8.3-fpm` |
| 404 di React page setelah refresh | `try_files` Nginx belum diatur | Pastikan `try_files $uri /index.html` ada di config Nginx |
| Upload foto gagal | Permission storage salah | `chown -R www-data storage && chmod -R 775 storage` |
| Login Google error | Client ID tidak terdaftar | Tambahkan domain ke Google OAuth Credentials |
| `php artisan` slow / timeout | OPcache tidak aktif | Enable `opcache` di `php.ini` |
| Queue tidak berjalan | Supervisor tidak jalan | `sudo supervisorctl start inventory-queue:*` |
| DB connection refused | MariaDB tidak jalan | `sudo systemctl start mariadb` |
