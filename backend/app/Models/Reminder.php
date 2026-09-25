<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Note: 'user_id' is intentionally omitted to prevent mass-assignment injection vulnerabilities.
     */
    protected $fillable = [
        'title',
        'description',
        'remind_at',
        'priority',
        'status',
        'snooze_until',
        'completed_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'snooze_until' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Appended dynamic attributes for API JSON serialization.
     */
    protected $appends = [
        'is_overdue',
    ];

    /**
     * Determine if the reminder is past its due time and still pending.
     */
    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $target = $this->snooze_until ?? $this->remind_at;
        return $target ? $target->isPast() : false;
    }

    /**
     * Scope a query to only include pending reminders.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope a query to only include completed reminders.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include overdue reminders.
     */
    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('snooze_until')->where('remind_at', '<', now())
                  ->orWhere(function ($sub) {
                      $sub->whereNotNull('snooze_until')->where('snooze_until', '<', now());
                  });
            });
    }

    /**
     * Scope a query to only include upcoming reminders.
     */
    public function scopeUpcoming($query)
    {
        return $query->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('snooze_until')->where('remind_at', '>=', now())
                  ->orWhere(function ($sub) {
                      $sub->whereNotNull('snooze_until')->where('snooze_until', '>=', now());
                  });
            });
    }

    /**
     * Get the user that owns the reminder.
     * Relational mapping: reminders.user_id -> users.id
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
