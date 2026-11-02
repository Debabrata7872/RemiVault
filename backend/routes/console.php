<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| RemiVault Background Task Scheduler
|--------------------------------------------------------------------------
| These tasks are automatically invoked by the system cron:
| * * * * * cd /path-to-app/backend && php artisan schedule:run >> /dev/null 2>&1
*/

// 1. Process Due Reminders & Expiring Documents every 15 minutes
Schedule::command('vault:process-alerts')->everyFifteenMinutes();

// 2. Automated Daily Database Snapshot at 02:00 AM (Retaining last 14 snapshots)
Schedule::command('vault:backup-db --keep=14')->dailyAt('02:00');

// 3. Prune Expired Sanctum Personal Access Tokens daily at 03:00 AM
Schedule::command('sanctum:prune-expired --hours=48')->dailyAt('03:00');

// 4. Weekly Server Log Pruning & Disk Storage Maintenance every Sunday at 04:00 AM
Schedule::command('vault:prune-logs --days=14')->weeklyOn(0, '04:00');
