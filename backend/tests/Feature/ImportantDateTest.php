<?php

namespace Tests\Feature;

use App\Models\ImportantDate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportantDateTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test unauthenticated requests are rejected with 401 Unauthorized.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->getJson('/api/important-dates');
        $response->assertStatus(401);
    }

    /**
     * Test authenticated user can list only their own important dates.
     */
    public function test_authenticated_user_can_list_only_their_important_dates(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        ImportantDate::factory()->count(3)->create(['user_id' => $userA->id]);
        ImportantDate::factory()->count(2)->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/important-dates');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'important_dates')
            ->assertJsonStructure([
                'important_dates',
                'counts' => ['total', 'pinned', 'urgent', 'upcoming', 'expired'],
            ]);

        $dateUserIds = collect($response->json('important_dates'))->pluck('user_id')->unique();
        $this->assertEquals([$userA->id], $dateUserIds->values()->all());
    }

    /**
     * Test authenticated user can create an important date.
     */
    public function test_authenticated_user_can_create_an_important_date(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('token')->plainTextToken;

        $targetDate = Carbon::today()->addMonths(6)->format('Y-m-d');
        $payload = [
            'title' => 'Passport Expiration',
            'category' => 'passport',
            'target_date' => $targetDate,
            'recurrence' => 'none',
            'notify_days_before' => 60,
            'is_pinned' => true,
            'notes' => 'Renew at least 6 months prior to international flight.',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/important-dates', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Important date recorded successfully.',
                'important_date' => [
                    'title' => 'Passport Expiration',
                    'category' => 'passport',
                    'target_date' => $targetDate,
                    'is_pinned' => true,
                    'user_id' => $user->id,
                ],
            ]);

        $this->assertDatabaseHas('important_dates', [
            'user_id' => $user->id,
            'title' => 'Passport Expiration',
            'category' => 'passport',
        ]);
    }

    /**
     * Test IDOR/BOLA protection: User A cannot view, update, or delete User B's date.
     */
    public function test_idor_protection_prevents_unauthorized_access(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $dateB = ImportantDate::factory()->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        // User A cannot view User B's date
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson("/api/important-dates/{$dateB->id}")
            ->assertStatus(403);

        // User A cannot update User B's date
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson("/api/important-dates/{$dateB->id}", ['title' => 'Hacked Title'])
            ->assertStatus(403);

        // User A cannot delete User B's date
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->deleteJson("/api/important-dates/{$dateB->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('important_dates', ['id' => $dateB->id]);
    }

    /**
     * Test toggling pin status on an important date.
     */
    public function test_user_can_toggle_pin_status(): void
    {
        $user = User::factory()->create();
        $date = ImportantDate::factory()->create([
            'user_id' => $user->id,
            'is_pinned' => false,
        ]);

        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/important-dates/{$date->id}/toggle-pin");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Important date pinned to top.',
                'important_date' => [
                    'id' => $date->id,
                    'is_pinned' => true,
                ],
            ]);

        $this->assertTrue($date->fresh()->is_pinned);
    }

    /**
     * Test countdown calculations and next occurrence for yearly recurring dates.
     */
    public function test_yearly_recurring_date_computes_next_occurrence(): void
    {
        $user = User::factory()->create();
        
        // A birthday from 10 years ago
        $birthdayPast = Carbon::today()->subYears(10)->addDays(15)->format('Y-m-d');
        $date = ImportantDate::factory()->create([
            'user_id' => $user->id,
            'title' => 'Annual Birthday',
            'category' => 'birthday',
            'target_date' => $birthdayPast,
            'recurrence' => 'yearly',
        ]);

        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/important-dates/{$date->id}");

        $response->assertStatus(200);
        $json = $response->json('important_date');

        // Next occurrence should be 15 days from today
        $this->assertEquals(15, $json['days_remaining']);
        $this->assertEquals(Carbon::today()->addDays(15)->format('Y-m-d'), $json['next_occurrence']);
    }
}
