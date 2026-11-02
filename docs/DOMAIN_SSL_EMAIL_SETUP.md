# RemiVault - Domain, SSL/TLS & Email Deliverability Architecture Guide

This guide details the exact configurations for deploying RemiVault with forced HTTPS (TLS 1.3), high-security HTTP headers, and 100% email deliverability via Brevo (SPF, DKIM, DMARC).

---

## 1. HTTPS & Transport Security

### Automatic In-App Enforcement
RemiVault is configured with two layers of in-app transport security:
1. **`URL::forceScheme('https')`** ([`backend/app/Providers/AppServiceProvider.php`](file:///c:/xampp/htdocs/RemiVault/backend/app/Providers/AppServiceProvider.php)):
   - Automatically forces all generated routes, redirects, asset URLs, and Sanctum cookies to `https://` whenever `APP_ENV=production` or `APP_FORCE_HTTPS=true`.
2. **`SecurityHeadersMiddleware`** ([`backend/app/Http/Middleware/SecurityHeadersMiddleware.php`](file:///c:/xampp/htdocs/RemiVault/backend/app/Http/Middleware/SecurityHeadersMiddleware.php)):
   - Injects the following security headers into every response:
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (HSTS)
     - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
     - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
     - `X-XSS-Protection: 1; mode=block`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

---

## 2. Reverse-Proxy & Web Server Configuration

### Upstream Proxy Trust (`TrustProxies`)
In [`backend/bootstrap/app.php`](file:///c:/xampp/htdocs/RemiVault/backend/bootstrap/app.php), `$middleware->trustProxies(at: '*')` is active. This ensures that when deployed behind Cloudflare, Nginx, or AWS ALB:
- `$request->ip()` resolves the real client's device IP rather than the reverse proxy's IP.
- Rate limiters (`throttle:5,1`, `throttle:10,1`) accurately isolate individual bad actors without locking out legitimate users.
- `$request->isSecure()` recognizes `X-Forwarded-Proto: https`.

### Production Nginx Server Block (Recommended)
```nginx
# 1. Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name remivault.app www.remivault.app;
    return 301 https://remivault.app$request_uri;
}

# 2. Production HTTPS Host
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name remivault.app;

    # SSL Certificates (e.g. Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/remivault.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/remivault.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Document Roots
    root /var/www/remivault/backend/public;
    index index.php index.html;

    # Client IP Forwarding
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;

    # Static Assets & Cached Build Chunks
    location ~* \.(?:css|js|woff2?|svg|png|jpg|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # API and Web Routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM Handler
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
    }
}
```

---

## 3. Transactional Email Authentication (Brevo Deliverability)

To guarantee that OTP verification emails and password reset codes land in the recipient's **Inbox** (rather than Spam or Quarantine), add these three DNS records in your domain provider (Cloudflare, Namecheap, GoDaddy):

### DNS Records Table:

| Record Type | Host / Name | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **TXT (SPF)** | `@` (or `remivault.app`) | `v=spf1 include:spf.brevo.com ~all` | Authorizes Brevo mail servers to dispatch emails for your domain. |
| **TXT (DMARC)** | `_dmarc` | `v=DMARC1; p=none; sp=none; aspf=r;` | Declares your domain's email alignment policy. |
| **TXT (DKIM)** | `mail._domainkey` | *(Copy key provided in Brevo Dashboard)* | Cryptographically signs outgoing emails with a 2048-bit RSA key. |

> **Note on Existing SPF:** If your domain already has an SPF record (e.g. for Google Workspace or Microsoft 365), simply add `include:spf.brevo.com` into your existing record:  
> `v=spf1 include:_spf.google.com include:spf.brevo.com ~all`

---

## 4. Automated Deliverability CLI Verification

RemiVault includes an automated deliverability diagnostic tool:

```bash
# 1. Audit DNS records & test SMTP handshake latency
php artisan vault:verify-email

# 2. Dispatch a real-world test OTP email to any inbox
php artisan vault:verify-email --send-to=your-name@gmail.com
```

This verifies DNS records, measures latency to `smtp-relay.brevo.com:587`, and confirms end-to-end HTML email rendering in real time.

