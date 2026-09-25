<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class VaultEntry extends Model
{
    use HasFactory;

    /**
     * Mass assignable attributes.
     * Note: 'user_id' is excluded to protect against mass-assignment injection attacks.
     */
    protected $fillable = [
        'title',
        'category',
        'username',
        'password',
        'url',
        'notes',
        'is_favorite',
        'password_strength',
        'last_used_at',
    ];

    /**
     * Attributes hidden from serialization.
     * We hide the raw encrypted_password column and expose 'password' accessor instead.
     */
    protected $hidden = [
        'encrypted_password',
    ];

    /**
     * Attribute casting.
     */
    protected function casts(): array
    {
        return [
            'is_favorite' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    /**
     * Appended dynamic attributes for API JSON serialization.
     */
    protected $appends = [
        'password',
    ];

    /**
     * Accessor for transparent password decryption via Crypt (AES-256).
     */
    public function getPasswordAttribute(): ?string
    {
        if (empty($this->attributes['encrypted_password'])) {
            return null;
        }

        try {
            return Crypt::decryptString($this->attributes['encrypted_password']);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Mutator to symmetrically encrypt password using AES-256 before database storage.
     */
    public function setPasswordAttribute(?string $value): void
    {
        if ($value !== null && $value !== '') {
            $this->attributes['encrypted_password'] = Crypt::encryptString($value);
        } else {
            $this->attributes['encrypted_password'] = null;
        }
    }

    /**
     * Calculate password strength based on entropy rules.
     */
    public static function calculateStrength(?string $password): string
    {
        if (empty($password)) {
            return 'weak';
        }

        $length = strlen($password);
        $score = 0;

        if ($length >= 8) $score++;
        if ($length >= 12) $score++;
        if ($length >= 16) $score++;

        if (preg_match('/[a-z]/', $password) && preg_match('/[A-Z]/', $password)) $score++;
        if (preg_match('/[0-9]/', $password)) $score++;
        if (preg_match('/[^a-zA-Z0-9]/', $password)) $score++;

        if ($score >= 5) {
            return 'strong';
        }
        if ($score >= 4) {
            return 'good';
        }
        if ($score >= 3) {
            return 'fair';
        }

        return 'weak';
    }

    /**
     * Scope a query to only include starred favorites.
     */
    public function scopeFavorites($query)
    {
        return $query->where('is_favorite', true);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Get the user that owns this vault entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
