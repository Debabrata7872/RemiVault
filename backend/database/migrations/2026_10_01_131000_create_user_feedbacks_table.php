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
        Schema::create('user_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('type', 30); // improvement, feature, bug
            $table->text('message');
            $table->string('device_info', 500)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('submitted_at_kolkata', 60)->nullable();
            $table->string('status', 30)->default('new'); // new, reviewed, resolved
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            // Indexes for fast querying in admin panel
            $table->index('user_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_feedbacks');
    }
};
