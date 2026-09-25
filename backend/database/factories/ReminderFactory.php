<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Reminder>
 */
class ReminderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'remind_at' => now()->addHours(fake()->numberBetween(1, 48)),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'status' => 'pending',
            'snooze_until' => null,
            'completed_at' => null,
        ];
    }
}
