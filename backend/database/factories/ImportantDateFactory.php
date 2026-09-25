<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ImportantDate>
 */
class ImportantDateFactory extends Factory
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
            'title' => fake()->sentence(3),
            'category' => fake()->randomElement(['passport', 'license', 'anniversary', 'birthday', 'warranty', 'subscription', 'custom']),
            'target_date' => fake()->dateTimeBetween('+1 week', '+1 year')->format('Y-m-d'),
            'recurrence' => 'none',
            'notify_days_before' => 30,
            'is_pinned' => false,
            'notes' => fake()->paragraph(),
        ];
    }
}
