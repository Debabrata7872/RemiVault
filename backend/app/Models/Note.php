<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Note: 'user_id' is deliberately omitted from $fillable to prevent mass-assignment
     * vulnerability where an attacker injects a different user_id.
     */
    protected $fillable = [
        'title',
        'content',
        'is_pinned',
        'color',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_pinned' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the note.
     * Relational mapping: notes.user_id -> users.id
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
