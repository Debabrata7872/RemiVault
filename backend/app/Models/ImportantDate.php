<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportantDate extends Model
{
    use HasFactory;

    /**
     * Mass assignable attributes.
     * Note: 'user_id' is excluded to protect against mass-assignment injection attacks.
     */
    protected $fillable = [
        'title',
        'category',
        'target_date',
        'recurrence',
        'notify_days_before',
        'is_pinned',
        'notes',
    ];

    /**
     * Attribute casting.
     */
    protected function casts(): array
    {
        return [
            'target_date' => 'date:Y-m-d',
            'is_pinned' => 'boolean',
            'notify_days_before' => 'integer',
        ];
    }

    /**
     * Appended dynamic attributes for API JSON serialization.
     */
    protected $appends = [
        'next_occurrence',
        'days_remaining',
        'urgency_status',
    ];

    /**
     * Calculate the next occurrence date for recurring items or return the target date.
     */
    public function getNextOccurrenceAttribute(): string
    {
        $target = Carbon::parse($this->target_date)->startOfDay();
        $today = Carbon::today();

        if ($this->recurrence === 'yearly') {
            $thisYearOccurrence = $target->copy()->year($today->year);
            if ($thisYearOccurrence->isPast() && !$thisYearOccurrence->isToday()) {
                return $target->copy()->year($today->year + 1)->format('Y-m-d');
            }
            return $thisYearOccurrence->format('Y-m-d');
        }

        if ($this->recurrence === 'monthly') {
            $thisMonthOccurrence = $target->copy()->year($today->year)->month($today->month);
            if ($thisMonthOccurrence->isPast() && !$thisMonthOccurrence->isToday()) {
                return $thisMonthOccurrence->addMonth()->format('Y-m-d');
            }
            return $thisMonthOccurrence->format('Y-m-d');
        }

        return $target->format('Y-m-d');
    }

    /**
     * Calculate the number of days remaining until the next occurrence or target date.
     * Returns negative value if a non-recurring date has already passed.
     */
    public function getDaysRemainingAttribute(): int
    {
        $today = Carbon::today();
        $target = Carbon::parse($this->next_occurrence)->startOfDay();

        // If not recurring and already passed in the past, return negative days
        if ($this->recurrence === 'none' || empty($this->recurrence)) {
            $originalTarget = Carbon::parse($this->target_date)->startOfDay();
            if ($originalTarget->lt($today)) {
                return (int) -1 * $today->diffInDays($originalTarget);
            }
        }

        return (int) $today->diffInDays($target, false);
    }

    /**
     * Determine urgency status for UI highlights and alerts.
     */
    public function getUrgencyStatusAttribute(): string
    {
        $days = $this->days_remaining;

        if ($days < 0) {
            return 'expired';
        }

        if ($days === 0) {
            return 'today';
        }

        $threshold = $this->notify_days_before > 0 ? $this->notify_days_before : 30;

        if ($days <= $threshold) {
            return 'urgent';
        }

        if ($days <= 90) {
            return 'upcoming';
        }

        return 'normal';
    }

    /**
     * Scope a query to only include pinned dates.
     */
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get the user that owns the important date.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
