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
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

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
}


