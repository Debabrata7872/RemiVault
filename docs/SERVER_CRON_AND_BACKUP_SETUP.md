# RemiVault - Background Scheduler & Automated Backup System

This guide explains how to set up the server crontab, automate background reminders, configure daily MySQL snapshots with retention pruning, and perform disaster recovery restorations.

---

## 1. System Crontab Setup (Production Server)

Laravel uses a single crontab entry on your server. Linux cron runs every minute, and Laravel's scheduler evaluates which tasks are due.

### Adding the Cron Entry
Log in to your production server via SSH and edit your crontab:

```bash
crontab -e
```

Add the following line to the bottom of the file (adjusting the path to your server's installation directory):

```cron
* * * * * cd /var/www/remivault/backend && php artisan schedule:run >> /dev/null 2>&1
```

> **For cPanel / Plesk Users:**  
> In the Cron Jobs interface, select **Once Per Minute (`* * * * *`)** and enter:  
> `cd /home/username/public_html/remivault/backend && php artisan schedule:run >> /dev/null 2>&1`

---

## 2. Active Scheduled Jobs & Frequencies

RemiVault registers 4 automated background maintenance jobs in [`backend/routes/console.php`](file:///c:/xampp/htdocs/RemiVault/backend/routes/console.php):

| Schedule | Command | Function & Description |
| :--- | :--- | :--- |
| **Every 15 mins** (`*/15 * * * *`) | `php artisan vault:process-alerts` | Scans due reminders, overdue tasks, and expiring documents/milestones within notification windows. |
| **Daily at 02:00 AM** (`0 2 * * *`) | `php artisan vault:backup-db --keep=14` | Generates a full timestamped MySQL snapshot (Gzip-compressed) and prunes snapshots older than 14 days. |
| **Daily at 03:00 AM** (`0 3 * * *`) | `php artisan sanctum:prune-expired --hours=48` | Prunes expired Personal Access Tokens and revoked user sessions. |
| **Weekly on Sunday at 04:00 AM** (`0 4 * * 0`) | `php artisan vault:prune-logs --days=14` | Cleans old logs in `storage/logs/` older than 14 days to prevent disk space exhaustion. |

### Inspecting the Schedule
You can inspect the scheduled jobs and view exact countdowns to their next execution at any time:

```bash
php artisan schedule:list
```

---

## 3. Database Backup & Snapshot Engine

RemiVault features a dual-engine backup system in [`VaultBackupDbCommand.php`](file:///c:/xampp/htdocs/RemiVault/backend/app/Console/Commands/VaultBackupDbCommand.php):
- **Native `mysqldump` Engine:** When available on the server PATH, uses native C-compiled `mysqldump` for maximum speed.
- **PHP PDO Stream Engine:** Resilient fallback engine that streams database tables directly via PDO if `mysqldump` is restricted on shared hosting.
- **Gzip Compression:** Automatically compresses snapshots into `.sql.gz` reducing disk space by ~85%.
- **Retention Pruning:** Automatically keeps the newest N backups (default: 14) and purges older archives.

### Manual Backup Generation
You can trigger an immediate database snapshot at any time:

```bash
# Standard backup (retaining latest 14 snapshots)
php artisan vault:backup-db

# Custom retention (e.g., keep the latest 30 daily snapshots)
php artisan vault:backup-db --keep=30
```

### Snapshot Storage Location
Backups are saved to:
```text
backend/storage/app/backups/remivault_backup_{database}_{YYYY-MM-DD_HHMMSS}.sql.gz
```
*(Protected from public web access and excluded from Git).*

---

## 4. Disaster Recovery & Database Restoration

If you ever need to restore your database from a snapshot:

### Restoring from a Gzip Snapshot (`.sql.gz`)
```bash
gunzip -c storage/app/backups/remivault_backup_remivault_prod_2026-11-02_020000.sql.gz | mysql -u remivault_user -p remivault_prod
```

### Restoring from an Uncompressed Snapshot (`.sql`)
```bash
mysql -u remivault_user -p remivault_prod < storage/app/backups/remivault_backup_remivault_prod_2026-11-02_020000.sql
```

---

## 5. Storage Log Maintenance

To manually prune log files older than 14 days without waiting for Sunday:

```bash
php artisan vault:prune-logs --days=14
```

