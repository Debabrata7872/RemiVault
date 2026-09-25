<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VaultEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class VaultEntryTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test unauthenticated requests to vault are rejected.
     */
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $response = $this->getJson('/api/vault-entries');
        $response->assertStatus(401);
    }

    /**
     * Test authenticated user can list only their own vault credentials.
     */
    public function test_authenticated_user_can_list_only_their_vault_entries(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        VaultEntry::factory()->count(3)->create(['user_id' => $userA->id]);
        VaultEntry::factory()->count(2)->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/vault-entries');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'vault_entries')
            ->assertJsonStructure([
                'vault_entries',
                'counts' => ['total', 'favorites', 'logins', 'api_keys', 'cards', 'servers', 'weak_passwords'],
            ]);

        $vaultUserIds = collect($response->json('vault_entries'))->pluck('user_id')->unique();
        $this->assertEquals([$userA->id], $vaultUserIds->values()->all());
    }

    /**
     * Test authenticated user can create an encrypted vault entry and verify zero plaintext storage.
     */
    public function test_authenticated_user_can_create_encrypted_vault_entry(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('token')->plainTextToken;

        $plainSecret = 'SuperSecretP@ssw0rd!2026';
        $payload = [
            'title' => 'AWS Production Root Key',
            'category' => 'api_key',
            'username' => 'cloud-admin',
            'password' => $plainSecret,
            'url' => 'https://console.aws.amazon.com',
            'notes' => 'Primary production infrastructure key.',
            'is_favorite' => true,
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/vault-entries', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Secret securely encrypted and stored in vault.',
                'vault_entry' => [
                    'title' => 'AWS Production Root Key',
                    'username' => 'cloud-admin',
                    'password' => $plainSecret,
                    'user_id' => $user->id,
                    'is_favorite' => true,
                ],
            ]);

        // CRITICAL ZERO-PLAINTEXT CHECK:
        // Raw database query must NOT contain the plaintext password!
        $rawDbEntry = DB::table('vault_entries')->where('user_id', $user->id)->first();
        $this->assertNotNull($rawDbEntry);
        $this->assertNotEquals($plainSecret, $rawDbEntry->encrypted_password);
        $this->assertStringNotContainsString($plainSecret, $rawDbEntry->encrypted_password);
    }

    /**
     * Test IDOR/BOLA defense prevents cross-user access, updating, and deletion.
     */
    public function test_idor_protection_prevents_unauthorized_vault_access(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $entryB = VaultEntry::factory()->create(['user_id' => $userB->id]);

        $tokenA = $userA->createToken('token_a')->plainTextToken;

        // User A cannot view User B's credential
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson("/api/vault-entries/{$entryB->id}")
            ->assertStatus(403);

        // User A cannot update User B's credential
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson("/api/vault-entries/{$entryB->id}", ['title' => 'Hacked Vault Entry'])
            ->assertStatus(403);

        // User A cannot delete User B's credential
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->deleteJson("/api/vault-entries/{$entryB->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('vault_entries', ['id' => $entryB->id]);
    }

    /**
     * Test toggling favorite status on a vault credential.
     */
    public function test_user_can_toggle_favorite_status(): void
    {
        $user = User::factory()->create();
        $entry = VaultEntry::factory()->create([
            'user_id' => $user->id,
            'is_favorite' => false,
        ]);

        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson("/api/vault-entries/{$entry->id}/toggle-favorite");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Marked as favorite.',
                'vault_entry' => [
                    'id' => $entry->id,
                    'is_favorite' => true,
                ],
            ]);

        $this->assertTrue($entry->fresh()->is_favorite);
    }

    /**
     * Test recording access event timestamp.
     */
    public function test_user_can_record_credential_access(): void
    {
        $user = User::factory()->create();
        $entry = VaultEntry::factory()->create([
            'user_id' => $user->id,
            'last_used_at' => null,
        ]);

        $token = $user->createToken('token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/vault-entries/{$entry->id}/record-access");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Access timestamp updated.',
            ]);

        $this->assertNotNull($entry->fresh()->last_used_at);
    }
}
