<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportantDates\StoreImportantDateRequest;
use App\Http\Requests\ImportantDates\UpdateImportantDateRequest;
use App\Models\ImportantDate;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ImportantDateController extends Controller
{
    /**
     * Display a listing of the user's important dates.
     * Scoped strictly to the authenticated user's account.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->importantDates();

        // Search in title and notes
        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('notes', 'like', $search);
            });
        }

        // Filter by category
        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        // Get all dates for the user to compute dynamic counts & filters
        $allUserDates = $user->importantDates()->get();

        $totalCount = $allUserDates->count();
        $pinnedCount = $allUserDates->where('is_pinned', true)->count();
        $urgentCount = $allUserDates->filter(fn ($item) => $item->urgency_status === 'urgent' || $item->urgency_status === 'today')->count();
        $upcomingCount = $allUserDates->filter(fn ($item) => $item->urgency_status === 'upcoming' || $item->urgency_status === 'urgent' || $item->urgency_status === 'today')->count();
        $expiredCount = $allUserDates->filter(fn ($item) => $item->urgency_status === 'expired')->count();

        // Specific timeframe filter
        $timeframeFilter = $request->query('filter', 'all');

        $dates = $query->get();

        if ($timeframeFilter === 'pinned') {
            $dates = $dates->where('is_pinned', true);
        } elseif ($timeframeFilter === 'urgent') {
            $dates = $dates->filter(fn ($item) => $item->urgency_status === 'urgent' || $item->urgency_status === 'today');
        } elseif ($timeframeFilter === 'upcoming') {
            $dates = $dates->filter(fn ($item) => $item->days_remaining >= 0);
        } elseif ($timeframeFilter === 'expired') {
            $dates = $dates->filter(fn ($item) => $item->urgency_status === 'expired');
        }

        // Sort: Pinned first, then by days remaining (nearest upcoming first, then expired last)
        $sortedDates = $dates->sort(function ($a, $b) {
            // Pinned items take top priority
            if ($a->is_pinned !== $b->is_pinned) {
                return $a->is_pinned ? -1 : 1;
            }

            // Both upcoming/future or both expired
            $aUpcoming = $a->days_remaining >= 0;
            $bUpcoming = $b->days_remaining >= 0;

            if ($aUpcoming && !$bUpcoming) {
                return -1; // Upcoming before expired
            }
            if (!$aUpcoming && $bUpcoming) {
                return 1;
            }

            // If both upcoming, smallest days_remaining first
            if ($aUpcoming && $bUpcoming) {
                return $a->days_remaining <=> $b->days_remaining;
            }

            // If both expired, most recently expired first
            return $b->days_remaining <=> $a->days_remaining;
        })->values();

        return response()->json([
            'important_dates' => $sortedDates,
            'counts' => [
                'total' => $totalCount,
                'pinned' => $pinnedCount,
                'urgent' => $urgentCount,
                'upcoming' => $upcomingCount,
                'expired' => $expiredCount,
            ],
        ]);
    }

    /**
     * Store a newly created important date for the authenticated user.
     */
    public function store(StoreImportantDateRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $validated['target_date'] = Carbon::parse($validated['target_date'])->format('Y-m-d');
        $validated['recurrence'] = $validated['recurrence'] ?? 'none';
        $validated['notify_days_before'] = $validated['notify_days_before'] ?? 30;
        $validated['is_pinned'] = $validated['is_pinned'] ?? false;

        $importantDate = $request->user()->importantDates()->create($validated)->fresh();

        return response()->json([
            'message' => 'Important date recorded successfully.',
            'important_date' => $importantDate,
        ], 201);
    }

    /**
     * Display the specified important date.
     * IDOR Protection: Gate::authorize invokes ImportantDatePolicy::view.
     */
    public function show(ImportantDate $importantDate): JsonResponse
    {
        Gate::authorize('view', $importantDate);

        return response()->json([
            'important_date' => $importantDate,
        ]);
    }

    /**
     * Update the specified important date.
     * IDOR Protection: Gate::authorize invokes ImportantDatePolicy::update.
     */
    public function update(UpdateImportantDateRequest $request, ImportantDate $importantDate): JsonResponse
    {
        Gate::authorize('update', $importantDate);

        $validated = $request->validated();

        if (isset($validated['target_date'])) {
            $validated['target_date'] = Carbon::parse($validated['target_date'])->format('Y-m-d');
        }

        $importantDate->update($validated);

        return response()->json([
            'message' => 'Important date updated successfully.',
            'important_date' => $importantDate->fresh(),
        ]);
    }

    /**
     * Remove the specified important date.
     * IDOR Protection: Gate::authorize invokes ImportantDatePolicy::delete.
     */
    public function destroy(ImportantDate $importantDate): JsonResponse
    {
        Gate::authorize('delete', $importantDate);

        $importantDate->delete();

        return response()->json([
            'message' => 'Important date removed successfully.',
        ]);
    }

    /**
     * Toggle the pinned status of the date.
     */
    public function togglePin(ImportantDate $importantDate): JsonResponse
    {
        Gate::authorize('update', $importantDate);

        $newPinned = !$importantDate->is_pinned;
        $importantDate->update(['is_pinned' => $newPinned]);

        $message = $newPinned ? 'Important date pinned to top.' : 'Important date unpinned.';

        return response()->json([
            'message' => $message,
            'important_date' => $importantDate->fresh(),
        ]);
    }
}
