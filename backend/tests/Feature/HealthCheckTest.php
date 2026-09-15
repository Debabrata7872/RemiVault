<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_health_check_returns_ok_and_database_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'application',
                'environment',
                'database',
                'timestamp',
            ])
            ->assertJson([
                'status' => 'ok',
                'application' => 'RemiVault',
                'database' => 'connected',
            ]);
    }
}
