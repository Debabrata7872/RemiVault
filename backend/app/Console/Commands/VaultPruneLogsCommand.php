<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class VaultPruneLogsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vault:prune-logs {--days=14 : Number of days of log files to retain}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Prune old log files in storage/logs to prevent server disk saturation';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $logDir = storage_path('logs');
        $cutoff = Carbon::now()->subDays($days)->timestamp;

        $this->newLine();
        $this->line('<fg=blue;options=bold>==============================================================</>');
        $this->line('<fg=blue;options=bold>  🧹  REMIVAULT LOG PRUNING & DISK MAINTENANCE ENGINE          </>');
        $this->line('<fg=blue;options=bold>==============================================================</>');
        $this->comment("Scanning storage/logs for files older than {$days} days...");

        if (!File::exists($logDir)) {
            $this->info("Log directory does not exist. Nothing to prune.");
            return 0;
        }

        $files = File::files($logDir);
        $deletedCount = 0;
        $retainedCount = 0;
        $bytesFreed = 0;

        foreach ($files as $file) {
            $filename = $file->getFilename();

            // Skip .gitignore
            if ($filename === '.gitignore') {
                continue;
            }

            if ($file->getMTime() < $cutoff) {
                $size = $file->getSize();
                File::delete($file->getRealPath());
                $bytesFreed += $size;
                $deletedCount++;
                $this->line("  🗑️ Deleted old log: <fg=gray>{$filename}</>");
            } else {
                $retainedCount++;
            }
        }

        $this->newLine();
        if ($deletedCount > 0) {
            $freedKb = round($bytesFreed / 1024, 1);
            $this->info("✔ Pruned {$deletedCount} old log files ({$freedKb} KB freed). Retained {$retainedCount} active log files.");
        } else {
            $this->info("✔ All {$retainedCount} log files are within the {$days}-day retention window. No pruning needed.");
        }

        return 0;
    }
}

