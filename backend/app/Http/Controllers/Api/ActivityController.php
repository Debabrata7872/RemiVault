<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserUsageMetric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Record a new user session / app launch.
     * Increments the user's app open counter and timestamps the session start.
     */
    public function sessionStart(Request $request): JsonResponse
    {
        $user = $request->user();

        $metric = UserUsageMetric::firstOrCreate(
            ['user_id' => $user->id],
            [
                'app_opens' => 0,
                'total_time_spent_seconds' => 0,
            ]
        );

        $metric->increment('app_opens');
        $metric->update([
            'last_session_started_at' => now(),
            'last_active_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'app_opens' => $metric->app_opens,
            'total_time_spent_seconds' => $metric->total_time_spent_seconds,
            'last_active_at' => $metric->last_active_at?->toIso8601String(),
        ]);
    }

    /**
     * Record user activity duration heartbeat while active in the browser.
     * Accrues active usage seconds and updates the user's last_active_at timestamp.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'duration_seconds' => 'nullable|integer|min:1|max:300',
        ]);

        $duration = $validated['duration_seconds'] ?? 30;
        $user = $request->user();

        $metric = UserUsageMetric::firstOrCreate(
            ['user_id' => $user->id],
            [
                'app_opens' => 1,
                'total_time_spent_seconds' => 0,
            ]
        );

        $metric->increment('total_time_spent_seconds', $duration);
        $metric->update([
            'last_active_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'app_opens' => $metric->app_opens,
            'total_time_spent_seconds' => $metric->total_time_spent_seconds,
            'last_active_at' => $metric->last_active_at?->toIso8601String(),
        ]);
    }
}
