<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful user registration.
     */
    public function test_user_can_register_with_valid_data(): void
    {
        $payload = [
            'name' => 'Alice Security',
            'email' => 'alice@remivault.local',
            'password' => 'Passw0rd123!',
            'password_confirmation' => 'Passw0rd123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'created_at'],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'name' => 'Alice Security',
                    'email' => 'alice@remivault.local',
                ],
            ]);

        // Security check: Verify user is saved in DB and password is NOT plaintext
        $user = User::where('email', 'alice@remivault.local')->first();
        $this->assertNotNull($user);
        $this->assertNotEquals('Passw0rd123!', $user->password, 'Password must never be saved as plaintext!');
        $this->assertTrue(Hash::check('Passw0rd123!', $user->password), 'Password must be validly hashed.');
    }

    /**
     * Test that registration prevents duplicate email registration.
     */
    public function test_registration_fails_if_email_is_duplicate(): void
    {
        User::factory()->create([
            'email' => 'existing@remivault.local',
        ]);

        $payload = [
            'name' => 'Duplicate User',
            'email' => 'existing@remivault.local',
            'password' => 'Passw0rd123!',
            'password_confirmation' => 'Passw0rd123!',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test that weak passwords are rejected during registration.
     */
    public function test_registration_fails_with_weak_password(): void
    {
        $payload = [
            'name' => 'Weak Pass User',
            'email' => 'weak@remivault.local',
            'password' => 'simple', // Less than 8 chars, no numbers
            'password_confirmation' => 'simple',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * Test successful login with valid credentials.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'bob@remivault.local',
            'password' => 'V@ultSecret456!',
        ]);

        $payload = [
            'email' => 'bob@remivault.local',
            'password' => 'V@ultSecret456!',
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => 'bob@remivault.local',
                ],
            ]);
    }

    /**
     * Test login failure with invalid password.
     */
    public function test_user_cannot_login_with_incorrect_password(): void
    {
        User::factory()->create([
            'email' => 'bob@remivault.local',
            'password' => 'CorrectPassword1!',
        ]);

        $payload = [
            'email' => 'bob@remivault.local',
            'password' => 'WrongPassword123!',
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Test authenticated user can access their own profile.
     */
    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Carol Authenticated',
            'email' => 'carol@remivault.local',
        ]);

        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => 'Carol Authenticated',
                    'email' => 'carol@remivault.local',
                ],
            ]);
    }

    /**
     * Test unauthenticated requests to protected endpoints return 401.
     */
    public function test_unauthenticated_request_to_profile_is_rejected(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Test user can log out and revoke their access token.
     */
    public function test_user_can_logout_and_revoke_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        // Verify token exists in database before logout
        $this->assertDatabaseCount('personal_access_tokens', 1);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Successfully logged out.']);

        // Verify token was deleted from database
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
