<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImportantDate;
use App\Models\Note;
use App\Models\Reminder;
use App\Models\User;
use App\Models\UserFeedback;
use App\Models\UserUsageMetric;
use App\Models\VaultEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /**
     * Verify the 4-digit Master Admin PIN.
     * Checks against Bcrypt database hash if customized, or .env default.
     * Rate-limited to prevent brute-force attempts.
     */
    public function verifyPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|size:4',
        ]);

        $storedHash = Cache::get('admin_master_pin_hash');
        $isValid = false;

        if ($storedHash) {
            $isValid = Hash::check((string) $validated['pin'], $storedHash);
        } else {
            $configuredPin = (string) config('app.admin_master_pin', '7872');
            $isValid = hash_equals($configuredPin, (string) $validated['pin']);
        }

        if (!$isValid) {
            return response()->json([
                'message' => 'Invalid Master Admin PIN. Access denied.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Super Administrator PIN verified successfully.',
            'unlocked_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Update the Master Admin PIN.
     * The new PIN is salted and encrypted using Bcrypt and stored persistently in the database cache.
     */
    public function changePin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_pin' => 'required|string|size:4',
            'new_pin' => 'required|string|size:4|regex:/^[0-9]{4}$/|different:current_pin',
            'confirm_new_pin' => 'required|string|same:new_pin',
        ], [
            'new_pin.different' => 'The new PIN must be different from your current PIN.',
            'new_pin.regex' => 'The new PIN must be a 4-digit numeric code.',
            'confirm_new_pin.same' => 'New PIN confirmation does not match.',
        ]);

        $storedHash = Cache::get('admin_master_pin_hash');
        $isCurrentValid = false;

        if ($storedHash) {
            $isCurrentValid = Hash::check((string) $validated['current_pin'], $storedHash);
        } else {
            $configuredPin = (string) config('app.admin_master_pin', '7872');
            $isCurrentValid = hash_equals($configuredPin, (string) $validated['current_pin']);
        }

        if (!$isCurrentValid) {
            return response()->json([
                'message' => 'The current Master Admin PIN is incorrect.',
            ], 422);
        }

        // Securely hash with Bcrypt and store in database cache permanently
        Cache::forever('admin_master_pin_hash', Hash::make((string) $validated['new_pin']));

        return response()->json([
            'message' => 'Master Admin PIN has been updated and encrypted with Bcrypt.',
            'updated_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Retrieve high-level system telemetry, infrastructure metrics, and aggregate user stats.
     */
    public function overview(Request $request): JsonResponse
    {
        // System & DB diagnostics
        $dbStatus = 'connected';
        $dbLatencyMs = null;
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);
        } catch (\Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        // Aggregate User Statistics
        $totalUsers = User::count();
        $totalAppOpens = (int) UserUsageMetric::sum('app_opens');
        $totalSecondsSpent = (int) UserUsageMetric::sum('total_time_spent_seconds');

        // Users active within the last 24 hours
        $active24h = UserUsageMetric::where('last_active_at', '>=', now()->subDay())->count();

        // Currently online (active within last 3 minutes)
        $onlineNow = UserUsageMetric::where('last_active_at', '>=', now()->subMinutes(3))->count();

        // Resource counts across the application
        $totalNotes = Note::count();
        $totalReminders = Reminder::count();
        $totalDates = ImportantDate::count();
        $totalVaultEntries = VaultEntry::count();
        $totalFeedback = UserFeedback::count();

        return response()->json([
            'system' => [
                'app_name' => config('app.name'),
                'app_env' => config('app.env'),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_time_kolkata' => now()->setTimezone('Asia/Kolkata')->format('Y-m-d H:i:s T'),
                'database' => [
                    'connection' => config('database.default'),
                    'status' => $dbStatus,
                    'latency_ms' => $dbLatencyMs,
                ],
                'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
            ],
            'stats' => [
                'total_users' => $totalUsers,
                'active_24h' => $active24h,
                'online_now' => $onlineNow,
                'total_app_opens' => $totalAppOpens,
                'total_seconds_spent' => $totalSecondsSpent,
                'formatted_total_time' => $this->formatDuration($totalSecondsSpent),
                'resources' => [
                    'notes' => $totalNotes,
                    'reminders' => $totalReminders,
                    'dates' => $totalDates,
                    'vault_entries' => $totalVaultEntries,
                    'feedback' => $totalFeedback,
                ],
            ],
        ]);
    }

    /**
     * Retrieve all registered users with their usage metrics:
     * - Name & Email
     * - Frequency of opening (app_opens)
     * - Time spent using the application (total_time_spent_seconds)
     * - Last active timestamp & online status
     */
    public function users(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = User::with('usageMetric')
            ->withCount(['notes', 'reminders', 'importantDates', 'vaultEntries']);

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest('id')->get()->map(function (User $user) {
            $metric = $user->usageMetric;
            $appOpens = $metric ? (int) $metric->app_opens : 0;
            $secondsSpent = $metric ? (int) $metric->total_time_spent_seconds : 0;
            $lastActiveAt = $metric?->last_active_at;
            $isOnline = $lastActiveAt && $lastActiveAt->diffInMinutes(now()) <= 3;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at?->toIso8601String(),
                'has_security_pin' => !empty($user->security_pin),
                'app_opens' => $appOpens,
                'total_seconds_spent' => $secondsSpent,
                'formatted_time_spent' => $this->formatDuration($secondsSpent),
                'last_session_started_at' => $metric?->last_session_started_at?->toIso8601String(),
                'last_active_at' => $lastActiveAt?->toIso8601String(),
                'is_online' => $isOnline,
                'resources_count' => [
                    'notes' => $user->notes_count ?? 0,
                    'reminders' => $user->reminders_count ?? 0,
                    'dates' => $user->important_dates_count ?? 0,
                    'vault' => $user->vault_entries_count ?? 0,
                    'total' => ($user->notes_count ?? 0) + ($user->reminders_count ?? 0) + ($user->important_dates_count ?? 0) + ($user->vault_entries_count ?? 0),
                ],
            ];
        });

        return response()->json([
            'users' => $users,
            'total_count' => $users->count(),
        ]);
    }

    /**
     * Retrieve all submitted user feedbacks & bug reports.
     */
    public function feedback(Request $request): JsonResponse
    {
        $feedbacks = UserFeedback::with('user:id,name,email,avatar_url')
            ->latest()
            ->get();

        return response()->json([
            'feedbacks' => $feedbacks,
        ]);
    }

    /**
     * Update status of user feedback (e.g., 'reviewed', 'resolved', 'in_progress').
     */
    public function updateFeedbackStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:new,in_progress,reviewed,resolved',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $feedback = UserFeedback::findOrFail($id);
        $feedback->update($validated);

        return response()->json([
            'message' => 'Feedback status updated successfully.',
            'feedback' => $feedback,
        ]);
    }

    /**
     * Helper to format raw duration seconds into a human-friendly string (e.g. 2h 45m 10s).
     */
    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return "{$seconds}s";
        }

        $minutes = floor($seconds / 60);
        $remainingSeconds = $seconds % 60;

        if ($minutes < 60) {
            return "{$minutes}m " . ($remainingSeconds > 0 ? "{$remainingSeconds}s" : "");
        }

        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;

        return "{$hours}h {$remainingMinutes}m";
    }
}
