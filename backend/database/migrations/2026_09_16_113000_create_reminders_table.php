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
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            // Foreign key constrained to users table with automatic cascade deletion
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('title', 255);
            $table->text('description')->nullable();
            
            // Normalized UTC target datetime when reminder should trigger
            $table->dateTime('remind_at');
            
            // Priority levels: low, medium, high, urgent
            $table->string('priority', 20)->default('medium');
            
            // Status: pending, completed, cancelled
            $table->string('status', 20)->default('pending');
            
            // Snooze target time if snoozed
            $table->dateTime('snooze_until')->nullable();

            // When the reminder was marked completed
            $table->dateTime('completed_at')->nullable();

            $table->timestamps();

            // High-performance compound indexes for user-scoped filtering & timeline ordering
            $table->index(['user_id', 'status', 'remind_at']);
            $table->index(['user_id', 'remind_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
