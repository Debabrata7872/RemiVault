<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserUsageMetric extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user_usage_metrics';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'app_opens',
        'total_time_spent_seconds',
        'last_session_started_at',
        'last_active_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'app_opens' => 'integer',
            'total_time_spent_seconds' => 'integer',
            'last_session_started_at' => 'datetime',
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * The user that owns this usage metric.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
