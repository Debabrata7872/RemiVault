<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test authenticated user can list only their own notes.
     */
    public function test_authenticated_user_can_list_only_their_notes(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Note::factory()->count(3)->create(['user_id' => $userA->id]);
        Note::factory()->count(2)->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/notes');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'notes');

        $noteUserIds = collect($response->json('notes'))->pluck('user_id')->unique();
        $this->assertEquals([$userA->id], $noteUserIds->values()->all());
    }

    /**
     * Test authenticated user can create a note.
     */
    public function test_authenticated_user_can_create_a_note(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('token')->plainTextToken;

        $payload = [
            'title' => 'Secret Architecture Blueprint',
            'content' => 'Always scope database queries to the authenticated user relationship.',
            'is_pinned' => true,
            'color' => 'indigo',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/notes', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Note created successfully.',
                'note' => [
                    'title' => 'Secret Architecture Blueprint',
                    'is_pinned' => true,
                    'color' => 'indigo',
                    'user_id' => $user->id,
                ],
            ]);

        $this->assertDatabaseHas('notes', [
            'title' => 'Secret Architecture Blueprint',
            'user_id' => $user->id,
            'is_pinned' => 1,
        ]);
    }

    /**
     * Test authenticated user can view their own note.
     */
    public function test_authenticated_user_can_view_their_own_note(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/notes/' . $note->id);

        $response->assertStatus(200)
            ->assertJson([
                'note' => [
                    'id' => $note->id,
                    'title' => $note->title,
                ],
            ]);
    }

    /**
     * CRITICAL SECURITY TEST: IDOR / BOLA Prevention
     * Verify that User B cannot view User A's note by supplying User A's note ID.
     */
    public function test_user_cannot_view_another_users_note_idor_prevention(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $noteA = Note::factory()->create([
            'user_id' => $userA->id,
            'title' => 'Alice Confidential Note',
        ]);

        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->getJson('/api/notes/' . $noteA->id);

        // Security assertion: Must be rejected with 403 Forbidden
        $response->assertStatus(403);
    }

    /**
     * CRITICAL SECURITY TEST: Prevent cross-user note mutation (Update).
     */
    public function test_user_cannot_update_another_users_note(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $noteA = Note::factory()->create([
            'user_id' => $userA->id,
            'title' => 'Original Untouched Title',
        ]);

        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->putJson('/api/notes/' . $noteA->id, [
                'title' => 'Hacked Title Attempt',
            ]);

        $response->assertStatus(403);

        // Verify database value was not altered
        $this->assertEquals('Original Untouched Title', $noteA->fresh()->title);
    }

    /**
     * CRITICAL SECURITY TEST: Prevent cross-user note deletion.
     */
    public function test_user_cannot_delete_another_users_note(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $noteA = Note::factory()->create(['user_id' => $userA->id]);
        $tokenB = $userB->createToken('token_b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->deleteJson('/api/notes/' . $noteA->id);

        $response->assertStatus(403);

        // Verify record still exists in database
        $this->assertDatabaseHas('notes', ['id' => $noteA->id]);
    }

    /**
     * Test user can update their own note.
     */
    public function test_user_can_update_their_own_note(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->create([
            'user_id' => $user->id,
            'title' => 'Initial Title',
            'is_pinned' => false,
        ]);

        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/notes/' . $note->id, [
                'title' => 'Updated Title',
                'is_pinned' => true,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Note updated successfully.',
                'note' => [
                    'id' => $note->id,
                    'title' => 'Updated Title',
                    'is_pinned' => true,
                ],
            ]);

        $this->assertEquals('Updated Title', $note->fresh()->title);
        $this->assertTrue($note->fresh()->is_pinned);
    }

    /**
     * Test user can delete their own note.
     */
    public function test_user_can_delete_their_own_note(): void
    {
        $user = User::factory()->create();
        $note = Note::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/notes/' . $note->id);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Note deleted successfully.']);

        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    /**
     * Test unauthenticated requests are rejected.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->getJson('/api/notes');

        $response->assertStatus(401);
    }
}
