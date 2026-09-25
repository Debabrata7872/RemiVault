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
        Schema::create('important_dates', function (Blueprint $table) {
            $table->id();
            // Foreign key constrained to users table with automatic cascade deletion
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title', 255);
            
            // Categories: passport, license, anniversary, birthday, warranty, subscription, custom
            $table->string('category', 50)->default('custom');

            // Target or reference date (e.g. expiration date, birthday, anniversary date)
            $table->date('target_date');

            // Recurrence cycle: none, yearly, monthly
            $table->string('recurrence', 20)->default('none');

            // Advance notification window in days (e.g., 30 days before)
            $table->unsignedSmallInteger('notify_days_before')->default(30);

            // Whether the item is pinned to the top of the list
            $table->boolean('is_pinned')->default(false);

            // Optional notes or metadata
            $table->text('notes')->nullable();

            $table->timestamps();

            // Compound indexes for user-scoped filtering, categorization, and timeline queries
            $table->index(['user_id', 'target_date']);
            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'is_pinned']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('important_dates');
    }
};
