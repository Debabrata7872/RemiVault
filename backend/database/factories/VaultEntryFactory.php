<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VaultEntry>
 */
class VaultEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->company() . ' Account',
            'category' => fake()->randomElement(['login', 'credit_card', 'api_key', 'server', 'secure_note', 'other']),
            'username' => fake()->userName(),
            'password' => fake()->password(16, 24),
            'url' => fake()->url(),
            'notes' => fake()->sentence(),
            'is_favorite' => false,
            'password_strength' => 'strong',
            'last_used_at' => null,
        ];
    }
}
