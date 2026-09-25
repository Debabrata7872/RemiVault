<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vault_entries', function (Blueprint $table) {
            $table->id();
            // Foreign key constrained to users table with automatic cascade deletion
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title', 255);

            // Categories: login, credit_card, api_key, server, secure_note, other
            $table->string('category', 50)->default('login');

            // Username, email, or account identifier
            $table->string('username', 255)->nullable();

            // Symmetrically encrypted secret payload (AES-256)
            $table->text('encrypted_password');

            // Optional website or service URL
            $table->string('url', 2048)->nullable();

            // Encrypted or plain confidential notes
            $table->text('notes')->nullable();

            // Whether the credential is marked as a starred favorite
            $table->boolean('is_favorite')->default(false);

            // Password strength rating: weak, fair, good, strong
            $table->string('password_strength', 20)->default('good');

            // Timestamp tracking when the secret was last copied or accessed
            $table->timestamp('last_used_at')->nullable();

            $table->timestamps();

            // Compound indexes for user-scoped filtering, categorization, and favorites
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'is_favorite']);
            $table->index(['user_id', 'title']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vault_entries');
    }
};
