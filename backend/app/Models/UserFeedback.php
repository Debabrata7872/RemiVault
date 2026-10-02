<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserFeedback extends Model
{
    use HasFactory;

    protected $table = 'user_feedbacks';

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'type',
        'message',
        'device_info',
        'ip_address',
        'submitted_at_kolkata',
        'status',
        'admin_notes',
    ];

    /**
     * Relationship to the user who submitted the feedback
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
