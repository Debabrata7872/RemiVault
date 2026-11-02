<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class VaultBackupDbCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vault:backup-db {--keep=7 : Number of latest backup snapshots to retain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a secure MySQL database snapshot with automated backup retention';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->newLine();
        $this->line('<fg=yellow;options=bold>==============================================================</>');
        $this->line('<fg=yellow;options=bold>  💾  REMIVAULT AUTOMATED DATABASE BACKUP SYSTEM              </>');
        $this->line('<fg=yellow;options=bold>==============================================================</>');
        $this->newLine();

        $startTime = microtime(true);
        $backupDir = storage_path('app/backups');

        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig) {
            $this->error("Database connection '{$connection}' is not configured.");
            return 1;
        }

        $database = $dbConfig['database'] ?? 'remivault';
        $host = $dbConfig['host'] ?? '127.0.0.1';
        $port = $dbConfig['port'] ?? 3306;
        $username = $dbConfig['username'] ?? 'root';
        $password = $dbConfig['password'] ?? '';

        $timestamp = date('Y-m-d_His');
        $filename = "remivault_backup_{$database}_{$timestamp}.sql";
        $filepath = $backupDir . DIRECTORY_SEPARATOR . $filename;

        $this->comment("Initiating snapshot for database: <fg=white;options=bold>{$database}</> on {$host}:{$port}...");

        $success = false;
        $method = 'mysqldump CLI';

        // Method A: Attempt native mysqldump CLI binary
        $mysqldumpPath = $this->findMysqldumpBinary();
        if ($mysqldumpPath) {
            $pwdArg = !empty($password) ? " -p" . escapeshellarg($password) : "";
            $cmd = sprintf(
                '"%s" -h %s -P %s -u %s%s %s > "%s"',
                $mysqldumpPath,
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                $pwdArg,
                escapeshellarg($database),
                $filepath
            );

            @exec($cmd, $output, $returnCode);
            if ($returnCode === 0 && file_exists($filepath) && filesize($filepath) > 0) {
                $success = true;
            }
        }

        // Method B: Resilient PHP PDO streaming dump fallback (works in any environment)
        if (!$success) {
            $method = 'PHP PDO Stream Engine';
            try {
                $this->comment("Creating snapshot via PHP PDO Stream Engine...");
                $success = $this->createPdoDump($filepath);
            } catch (\Throwable $e) {
                $this->error("Backup failed: " . $e->getMessage());
                return 1;
            }
        }

        if (!$success || !file_exists($filepath) || filesize($filepath) === 0) {
            $this->error("Failed to generate database snapshot.");
            return 1;
        }

        // Optional Gzip compression if zlib is active
        $finalFilepath = $filepath;
        $compressed = false;
        if (function_exists('gzencode')) {
            $gzFilepath = $filepath . '.gz';
            $content = file_get_contents($filepath);
            if ($content !== false) {
                file_put_contents($gzFilepath, gzencode($content, 9));
                @unlink($filepath);
                $finalFilepath = $gzFilepath;
                $compressed = true;
            }
        }

        $duration = round(microtime(true) - $startTime, 2);
        $sizeBytes = filesize($finalFilepath);
        $sizeFormatted = $this->formatBytes($sizeBytes);

        $this->info("✔ SNAPSHOT COMPLETE via {$method}");
        $this->line("  File: <fg=green>" . basename($finalFilepath) . "</>");
        $this->line("  Size: <fg=cyan>{$sizeFormatted}</>" . ($compressed ? ' (Gzip compressed)' : ''));
        $this->line("  Time: <fg=white>{$duration}s</>");
        $this->newLine();

        // Backup Retention & Pruning
        $keep = (int) $this->option('keep');
        $this->pruneOldBackups($backupDir, $keep);

        return 0;
    }

    /**
     * Locate mysqldump binary across common Windows / Linux environments.
     */
    protected function findMysqldumpBinary(): ?string
    {
        // Check PATH
        $binary = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' ? 'mysqldump.exe' : 'mysqldump';
        $path = @exec("where {$binary} 2>nul");
        if ($path && file_exists($path)) {
            return $path;
        }

        // Common XAMPP / WAMP paths on Windows
        $commonWindowsPaths = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\wamp64\\bin\\mysql\\mysql*\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server*\\bin\\mysqldump.exe',
        ];

        foreach ($commonWindowsPaths as $candidate) {
            $matches = glob($candidate);
            if (!empty($matches) && file_exists($matches[0])) {
                return $matches[0];
            }
        }

        return null;
    }

    /**
     * Resilient PHP PDO database schema & data dumper fallback.
     */
    protected function createPdoDump(string $destinationFile): bool
    {
        $pdo = DB::connection()->getPdo();
        $handle = fopen($destinationFile, 'w');
        if (!$handle) {
            return false;
        }

        fwrite($handle, "-- RemiVault Automated Database Backup\n");
        fwrite($handle, "-- Generated: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        $tables = DB::connection()->getDoctrineSchemaManager()->listTableNames();

        foreach ($tables as $table) {
            // Write Table Structure
            $createTableQuery = DB::select("SHOW CREATE TABLE `{$table}`");
            $createStatement = ((array) $createTableQuery[0])['Create Table'] ?? '';

            fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
            fwrite($handle, $createStatement . ";\n\n");

            // Write Table Data
            $rows = DB::table($table)->get();
            if ($rows->count() > 0) {
                foreach ($rows->chunk(100) as $chunk) {
                    $valuesList = [];
                    foreach ($chunk as $row) {
                        $values = [];
                        foreach ((array) $row as $val) {
                            if ($val === null) {
                                $values[] = 'NULL';
                            } else {
                                $values[] = $pdo->quote((string) $val);
                            }
                        }
                        $valuesList[] = '(' . implode(', ', $values) . ')';
                    }
                    fwrite($handle, "INSERT INTO `{$table}` VALUES " . implode(",\n", $valuesList) . ";\n");
                }
                fwrite($handle, "\n");
            }
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        fwrite($handle, "-- End of RemiVault Snapshot\n");
        fclose($handle);

        return true;
    }

    /**
     * Prune backups older than retention policy.
     */
    protected function pruneOldBackups(string $directory, int $keep): void
    {
        $files = File::files($directory);
        $backupFiles = array_filter($files, function ($file) {
            return str_starts_with($file->getFilename(), 'remivault_backup_');
        });

        // Sort newest first
        usort($backupFiles, function ($a, $b) {
            return $b->getMTime() - $a->getMTime();
        });

        $count = count($backupFiles);
        $this->comment("Active Backups in storage: <fg=white>{$count}</> (Retention limit: <fg=yellow>{$keep}</>)");

        if ($count > $keep) {
            $toDelete = array_slice($backupFiles, $keep);
            foreach ($toDelete as $oldFile) {
                File::delete($oldFile->getRealPath());
                $this->line("  🗑️ Pruned expired snapshot: <fg=gray>" . $oldFile->getFilename() . "</>");
            }
            $this->info("Retention cleanup completed. Kept latest {$keep} snapshots.");
        } else {
            $this->line("All {$count} snapshots are within the {$keep}-snapshot retention window.");
        }
    }

    /**
     * Format bytes to human readable format.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

