<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get consolidated dashboard overview, performance metrics, and adaptive preloaded data.
     * 
     * Performance Architecture:
     * - Uses direct database aggregate queries to compute counts rapidly (<10ms), avoiding loading
     *   excessive datasets or running unnecessary decryption cycles.
     * - Adaptive Data Volume Handling:
     *   - Low-Data Users (total items <= 40): Returns the complete collections for notes, reminders,
     *     dates, and vault entries so the entire app is preloaded in a single high-efficiency request.
     *   - Heavy-Data Users (total items > 40): Returns instant counts + lightweight preview slices
     *     (top 4 notes, top 5 upcoming reminders, top 5 urgent dates, top 6 vault entries),
     *     allowing the dashboard to hydrate in minimal time while remaining modules stream smoothly.
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();

        // 1. Fast direct database counts
        $vaultCount = $user->vaultEntries()->count();
        $datesCount = $user->importantDates()->count();
        $remindersCount = $user->reminders()->count();
        $notesCount = $user->notes()->count();

        // Reminders sub-counts
        $overdueRemindersCount = $user->reminders()
            ->where('status', 'pending')
            ->where(function ($q) use ($now) {
                $q->whereNull('snooze_until')->where('remind_at', '<', $now)
                  ->orWhere(function ($sub) use ($now) {
                      $sub->whereNotNull('snooze_until')->where('snooze_until', '<', $now);
                  });
            })
            ->count();

        $upcomingRemindersCount = $user->reminders()
            ->where('status', 'pending')
            ->where(function ($q) use ($now) {
                $q->whereNull('snooze_until')->where('remind_at', '>=', $now)
                  ->orWhere(function ($sub) use ($now) {
                      $sub->whereNotNull('snooze_until')->where('snooze_until', '>=', $now);
                  });
            })
            ->count();

        // Important Dates urgency status calculation
        $userDates = $user->importantDates()->get();
        $urgentDatesCount = $userDates->filter(fn ($item) => in_array($item->urgency_status, ['urgent', 'today']))->count();
        $expiredDatesCount = $userDates->filter(fn ($item) => $item->urgency_status === 'expired')->count();

        $totalItems = $vaultCount + $datesCount + $remindersCount + $notesCount;
        $isHeavyData = $totalItems > 40;

        $response = [
            'counts' => [
                'vault' => $vaultCount,
                'dates' => $datesCount,
                'reminders' => $remindersCount,
                'notes' => $notesCount,
                'urgent_dates' => $urgentDatesCount,
                'expired_dates' => $expiredDatesCount,
                'upcoming_reminders' => $upcomingRemindersCount,
                'overdue_reminders' => $overdueRemindersCount,
                'total_items' => $totalItems,
            ],
            'performance' => [
                'is_heavy_data' => $isHeavyData,
                'strategy' => $isHeavyData ? 'preview_chunked' : 'full_preload',
            ],
        ];

        if ($isHeavyData) {
            // Heavy data user: Provide fast preview slices for dashboard hydration
            $response['previews'] = [
                'notes' => $user->notes()
                    ->orderByDesc('is_pinned')
                    ->orderByDesc('updated_at')
                    ->take(4)
                    ->get(),

                'reminders' => $user->reminders()
                    ->where('status', 'pending')
                    ->orderBy('remind_at', 'asc')
                    ->take(5)
                    ->get(),

                'dates' => $userDates
                    ->sortBy(fn ($item) => $item->days_remaining)
                    ->take(5)
                    ->values(),

                'vault' => $user->vaultEntries()
                    ->orderByDesc('is_favorite')
                    ->orderByDesc('updated_at')
                    ->take(6)
                    ->get(),
            ];
        } else {
            // Low data user: Preload full collections in a single round-trip
            $response['full_data'] = [
                'notes' => $user->notes()
                    ->orderByDesc('is_pinned')
                    ->orderByDesc('updated_at')
                    ->get(),

                'reminders' => $user->reminders()
                    ->orderBy('remind_at', 'asc')
                    ->get(),

                'dates' => $userDates->values(),

                'vault' => $user->vaultEntries()
                    ->orderByDesc('is_favorite')
                    ->orderByDesc('updated_at')
                    ->get(),
            ];
        }

        return response()->json($response);
    }
}
