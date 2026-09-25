<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reminders\StoreReminderRequest;
use App\Http\Requests\Reminders\UpdateReminderRequest;
use App\Models\Reminder;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReminderController extends Controller
{
    /**
     * Display a listing of the authenticated user's reminders.
     * Scoped strictly to the authenticated user's account to eliminate data leakage.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->reminders();

        // Calculate summary counters for the user
        $now = Carbon::now();
        $totalCount = (clone $query)->count();
        $pendingCount = (clone $query)->where('status', 'pending')->count();
        $completedCount = (clone $query)->where('status', 'completed')->count();
        $overdueCount = (clone $query)
            ->where('status', 'pending')
            ->where(function ($q) use ($now) {
                $q->whereNull('snooze_until')->where('remind_at', '<', $now)
                  ->orWhere(function ($sub) use ($now) {
                      $sub->whereNotNull('snooze_until')->where('snooze_until', '<', $now);
                  });
            })
            ->count();

        // Filter by status if provided
        $filterStatus = $request->query('status');
        if ($filterStatus === 'pending') {
            $query->where('status', 'pending');
        } elseif ($filterStatus === 'completed') {
            $query->where('status', 'completed');
        } elseif ($filterStatus === 'overdue') {
            $query->overdue();
        } elseif ($filterStatus === 'upcoming') {
            $query->upcoming();
        }

        // Filter by priority if provided
        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        // Search in title and description
        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        // Order: Overdue/Pending first ordered by effective reminder time, then completed
        $reminders = $query
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END ASC")
            ->orderBy('remind_at', 'asc')
            ->get();

        return response()->json([
            'reminders' => $reminders,
            'counts' => [
                'total' => $totalCount,
                'pending' => $pendingCount,
                'upcoming' => max(0, $pendingCount - $overdueCount),
                'overdue' => $overdueCount,
                'completed' => $completedCount,
            ],
        ]);
    }

    /**
     * Store a newly created reminder for the authenticated user.
     */
    public function store(StoreReminderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Ensure remind_at is parsed cleanly
        $validated['remind_at'] = Carbon::parse($validated['remind_at'])->toDateTimeString();
        $validated['status'] = $validated['status'] ?? 'pending';
        $validated['priority'] = $validated['priority'] ?? 'medium';

        $reminder = $request->user()->reminders()->create($validated)->fresh();

        return response()->json([
            'message' => 'Reminder scheduled successfully.',
            'reminder' => $reminder,
        ], 201);
    }

    /**
     * Display the specified reminder.
     * IDOR Protection: Gate::authorize invokes ReminderPolicy::view.
     */
    public function show(Reminder $reminder): JsonResponse
    {
        Gate::authorize('view', $reminder);

        return response()->json([
            'reminder' => $reminder,
        ]);
    }

    /**
     * Update the specified reminder.
     * IDOR Protection: Gate::authorize invokes ReminderPolicy::update.
     */
    public function update(UpdateReminderRequest $request, Reminder $reminder): JsonResponse
    {
        Gate::authorize('update', $reminder);

        $validated = $request->validated();

        if (isset($validated['remind_at'])) {
            $validated['remind_at'] = Carbon::parse($validated['remind_at'])->toDateTimeString();
        }

        if (isset($validated['status'])) {
            if ($validated['status'] === 'completed' && !$reminder->completed_at) {
                $validated['completed_at'] = Carbon::now()->toDateTimeString();
            } elseif ($validated['status'] === 'pending') {
                $validated['completed_at'] = null;
            }
        }

        $reminder->update($validated);

        return response()->json([
            'message' => 'Reminder updated successfully.',
            'reminder' => $reminder->fresh(),
        ]);
    }

    /**
     * Remove the specified reminder.
     * IDOR Protection: Gate::authorize invokes ReminderPolicy::delete.
     */
    public function destroy(Reminder $reminder): JsonResponse
    {
        Gate::authorize('delete', $reminder);

        $reminder->delete();

        return response()->json([
            'message' => 'Reminder deleted successfully.',
        ]);
    }

    /**
     * Fast atomic toggle for completed status.
     */
    public function toggleComplete(Reminder $reminder): JsonResponse
    {
        Gate::authorize('update', $reminder);

        if ($reminder->status === 'completed') {
            $reminder->update([
                'status' => 'pending',
                'completed_at' => null,
            ]);
            $message = 'Reminder marked as pending.';
        } else {
            $reminder->update([
                'status' => 'completed',
                'completed_at' => Carbon::now()->toDateTimeString(),
            ]);
            $message = 'Reminder marked as completed.';
        }

        return response()->json([
            'message' => $message,
            'reminder' => $reminder->fresh(),
        ]);
    }

    /**
     * Snooze reminder by a given number of minutes or target datetime.
     */
    public function snooze(Request $request, Reminder $reminder): JsonResponse
    {
        Gate::authorize('update', $reminder);

        $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1'],
            'snooze_until' => ['nullable', 'date'],
        ]);

        if ($request->filled('snooze_until')) {
            $snoozeTime = Carbon::parse($request->input('snooze_until'));
        } elseif ($request->filled('minutes')) {
            $snoozeTime = Carbon::now()->addMinutes($request->integer('minutes'));
        } else {
            $snoozeTime = Carbon::now()->addHour();
        }

        $reminder->update([
            'snooze_until' => $snoozeTime->toDateTimeString(),
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => "Reminder snoozed until {$snoozeTime->toDateTimeString()}.",
            'reminder' => $reminder->fresh(),
        ]);
    }
}
