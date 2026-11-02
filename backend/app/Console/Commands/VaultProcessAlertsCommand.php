<?php

namespace App\Console\Commands;

use App\Models\ImportantDate;
use App\Models\Reminder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VaultProcessAlertsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vault:process-alerts {--dry-run : Inspect and preview alerts without triggering notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process due reminders, overdue tasks, and expiring important dates/documents';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $now = Carbon::now();

        $this->newLine();
        $this->line('<fg=magenta;options=bold>==============================================================</>');
        $this->line('<fg=magenta;options=bold>  🔔  REMIVAULT BACKGROUND SCHEDULER: ALERT ENGINE            </>');
        $this->line('<fg=magenta;options=bold>==============================================================</>');
        if ($isDryRun) {
            $this->comment("MODE: DRY RUN (No records modified or notifications dispatched)");
        }
        $this->newLine();

        // 1. Process Due & Overdue Reminders
        $dueReminders = Reminder::where('status', 'pending')
            ->where(function ($query) use ($now) {
                $query->whereNotNull('snooze_until')->where('snooze_until', '<=', $now)
                    ->orWhere(function ($q) use ($now) {
                        $q->whereNull('snooze_until')->where('remind_at', '<=', $now);
                    });
            })
            ->with('user')
            ->get();

        $this->line("• Pending/Due Reminders Found: <fg=yellow;options=bold>" . $dueReminders->count() . "</>");
        foreach ($dueReminders as $reminder) {
            $targetTime = $reminder->snooze_until ?? $reminder->remind_at;
            $overdueHuman = $targetTime ? $targetTime->diffForHumans() : 'now';
            $userName = $reminder->user ? $reminder->user->name : "User #{$reminder->user_id}";

            $this->line("  [Reminder] <fg=cyan>{$reminder->title}</> (Priority: {$reminder->priority}) for <fg=white>{$userName}</> — Due {$overdueHuman}");
        }

        // 2. Process Expiring Important Dates & Documents
        $today = Carbon::today();
        $allDates = ImportantDate::with('user')->get();
        $expiringDates = [];

        foreach ($allDates as $dateItem) {
            $targetDate = Carbon::parse($dateItem->target_date)->startOfDay();
            $nextOccurrence = Carbon::parse($dateItem->next_occurrence)->startOfDay();
            $diffDays = $today->diffInDays($nextOccurrence, false);

            $notifyWindow = $dateItem->notify_days_before ?? 7;

            // Trigger if within notify window (e.g. <= 7 days, or overdue < 0)
            if ($diffDays <= $notifyWindow) {
                $expiringDates[] = [
                    'model' => $dateItem,
                    'days_remaining' => $diffDays,
                ];
            }
        }

        $this->newLine();
        $this->line("• Expiring Documents & Dates: <fg=yellow;options=bold>" . count($expiringDates) . "</>");
        foreach ($expiringDates as $item) {
            $dateModel = $item['model'];
            $days = $item['days_remaining'];
            $userName = $dateModel->user ? $dateModel->user->name : "User #{$dateModel->user_id}";

            $urgency = $days < 0 ? '<fg=red>EXPIRED</>' : ($days === 0 ? '<fg=red>EXPIRES TODAY</>' : "<fg=yellow>{$days} days remaining</>");
            $this->line("  [Document] <fg=cyan>{$dateModel->title}</> ({$dateModel->category}) for <fg=white>{$userName}</> — {$urgency}");
        }

        $this->newLine();
        $totalProcessed = $dueReminders->count() + count($expiringDates);
        $this->info("✔ Background alert evaluation completed. Total active actionable alerts: {$totalProcessed}");

        // Log execution
        if (!$isDryRun && $totalProcessed > 0) {
            Log::info("vault:process-alerts evaluated {$totalProcessed} active alerts ({$dueReminders->count()} reminders, " . count($expiringDates) . " dates).");
        }

        return 0;
    }
}

