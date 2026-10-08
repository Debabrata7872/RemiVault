<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar_url',
        'password',
        'security_pin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'security_pin',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'has_pin',
    ];

    /**
     * Determine if the user has configured a 4-digit PIN.
     */
    public function getHasPinAttribute(): bool
    {
        return !empty($this->security_pin);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get all notes belonging to the user.
     * Relational mapping: users.id -> notes.user_id
     */
    public function notes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get all reminders belonging to the user.
     * Relational mapping: users.id -> reminders.user_id
     */
    public function reminders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    /**
     * Get all important dates belonging to the user.
     * Relational mapping: users.id -> important_dates.user_id
     */
    public function importantDates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ImportantDate::class);
    }

    /**
     * Get all vault entries belonging to the user.
     * Relational mapping: users.id -> vault_entries.user_id
     */
    public function vaultEntries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(VaultEntry::class);
    }

    /**
     * Get the usage metric record (app opens and active time spent) for this user.
     * Relational mapping: users.id -> user_usage_metrics.user_id
     */
    public function usageMetric(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserUsageMetric::class, 'user_id');
    }
}


