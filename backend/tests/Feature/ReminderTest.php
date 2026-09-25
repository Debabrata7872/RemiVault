<?php

namespace Tests\Feature;

use App\Models\Reminder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReminderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test authenticated user can list only their own reminders with counters.
     */
    public function test_authenticated_user_can_list_only_their_reminders(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Reminder::factory()->count(3)->create(['user_id' => $userA->id]);
        Reminder::factory()->count(2)->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/reminders');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'reminders')
            ->assertJsonStructure([
                'reminders',
                'counts' => ['total', 'pending', 'upcoming', 'overdue', 'completed'],
            ]);

        $reminderUserIds = collect($response->json('reminders'))->pluck('user_id')->unique();
        $this->assertEquals([$userA->id], $reminderUserIds->values()->all());
    }

    /**
     * Test authenticated user can create a reminder.
     */
    public function test_authenticated_user_can_create_a_reminder(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('token')->plainTextToken;

        $remindAt = Carbon::now()->addDays(2)->toIso8601String();
        $payload = [
            'title' => 'Renew Passport & Travel Documents',
            'description' => 'Ensure biometric passport is stamped and valid for international trip.',
            'remind_at' => $remindAt,
            'priority' => 'urgent',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reminders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Reminder scheduled successfully.',
                'reminder' => [
                    'title' => 'Renew Passport & Travel Documents',
                    'priority' => 'urgent',
                    'status' => 'pending',
                    'user_id' => $user->id,
                ],
            ]);

        $this->assertDatabaseHas('reminders', [
            'title' => 'Renew Passport & Travel Documents',
            'user_id' => $user->id,
            'priority' => 'urgent',
            'status' => 'pending',
        ]);
    }

    /**
     * Test authenticated user can view their own reminder.
     */
    public function test_authenticated_user_can_view_their_own_reminder(): void
    {
        $user = User::factory()->create();
        $reminder = Reminder::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/reminders/' . $reminder->id);

        $response->assertStatus(200)
            ->assertJson([
                'reminder' => [
                    'id' => $reminder->id,
                    'title' => $reminder->title,
                ],
            ]);
    }

    /**
     * CRITICAL SECURITY TEST: IDOR / BOLA Prevention
     * Verify that User B cannot view User A's reminder by ID.
     */
    public function test_user_cannot_view_another_users_reminder_idor_prevention(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $reminderA = Reminder::factory()->create(['user_id' => $userA->id]);
        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->getJson('/api/reminders/' . $reminderA->id);

        $response->assertStatus(403);
    }

    /**
     * CRITICAL SECURITY TEST: IDOR Prevention on Update
     */
    public function test_user_cannot_update_another_users_reminder(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $reminderA = Reminder::factory()->create([
            'user_id' => $userA->id,
            'title' => 'Original Legitimate Reminder',
        ]);
        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->putJson('/api/reminders/' . $reminderA->id, [
                'title' => 'Malicious Hijacked Reminder',
            ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('reminders', [
            'id' => $reminderA->id,
            'title' => 'Original Legitimate Reminder',
        ]);
    }

    /**
     * CRITICAL SECURITY TEST: IDOR Prevention on Delete
     */
    public function test_user_cannot_delete_another_users_reminder(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $reminderA = Reminder::factory()->create(['user_id' => $userA->id]);
        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->deleteJson('/api/reminders/' . $reminderA->id);

        $response->assertStatus(403);
        $this->assertDatabaseHas('reminders', ['id' => $reminderA->id]);
    }

    /**
     * Test user can update their own reminder.
     */
    public function test_user_can_update_their_own_reminder(): void
    {
        $user = User::factory()->create();
        $reminder = Reminder::factory()->create([
            'user_id' => $user->id,
            'title' => 'Doctor Appointment',
            'priority' => 'low',
        ]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/reminders/' . $reminder->id, [
                'title' => 'Specialist Doctor Appointment',
                'priority' => 'urgent',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'reminder' => [
                    'title' => 'Specialist Doctor Appointment',
                    'priority' => 'urgent',
                ],
            ]);

        $this->assertDatabaseHas('reminders', [
            'id' => $reminder->id,
            'title' => 'Specialist Doctor Appointment',
            'priority' => 'urgent',
        ]);
    }

    /**
     * Test user can toggle complete and revert status.
     */
    public function test_user_can_toggle_complete_reminder(): void
    {
        $user = User::factory()->create();
        $reminder = Reminder::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);
        $token = $user->createToken('token')->plainTextToken;

        // Toggle to completed
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/reminders/{$reminder->id}/toggle-complete");

        $response->assertStatus(200)
            ->assertJson([
                'reminder' => [
                    'status' => 'completed',
                ],
            ]);
        $this->assertNotNull($response->json('reminder.completed_at'));

        // Toggle back to pending
        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/reminders/{$reminder->id}/toggle-complete");

        $response2->assertStatus(200)
            ->assertJson([
                'reminder' => [
                    'status' => 'pending',
                    'completed_at' => null,
                ],
            ]);
    }

    /**
     * Test user can snooze reminder.
     */
    public function test_user_can_snooze_reminder(): void
    {
        $user = User::factory()->create();
        $reminder = Reminder::factory()->create([
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/reminders/{$reminder->id}/snooze", [
                'minutes' => 30,
            ]);

        $response->assertStatus(200);
        $this->assertNotNull($response->json('reminder.snooze_until'));
    }

    /**
     * Test user can delete their own reminder.
     */
    public function test_user_can_delete_their_own_reminder(): void
    {
        $user = User::factory()->create();
        $reminder = Reminder::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/reminders/' . $reminder->id);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Reminder deleted successfully.']);

        $this->assertDatabaseMissing('reminders', ['id' => $reminder->id]);
    }

    /**
     * Test unauthenticated requests are rejected.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/reminders')->assertStatus(401);
        $this->postJson('/api/reminders', ['title' => 'Hello'])->assertStatus(401);
    }

    /**
     * Test validation failure when creating reminder.
     */
    public function test_reminder_creation_fails_without_required_fields(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/reminders', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'remind_at']);
    }
}
