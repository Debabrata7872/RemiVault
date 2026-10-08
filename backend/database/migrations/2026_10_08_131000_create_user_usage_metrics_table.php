<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Dedicated table for tracking how often each user opens RemiVault
     * and their total active usage duration.
     */
    public function up(): void
    {
        Schema::create('user_usage_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->unsignedInteger('app_opens')->default(0);
            $table->unsignedBigInteger('total_time_spent_seconds')->default(0);
            $table->timestamp('last_session_started_at')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_usage_metrics');
    }
};
