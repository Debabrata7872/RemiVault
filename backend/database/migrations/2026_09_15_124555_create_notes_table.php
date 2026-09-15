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
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            // Foreign key to users table with automatic cascade deletion
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            
            $table->string('title', 255);
            $table->longText('content');
            $table->boolean('is_pinned')->default(false);
            $table->string('color', 30)->default('default');
            $table->timestamps();

            // Compound index for optimizing user-scoped queries ordered by pin state and date
            $table->index(['user_id', 'is_pinned', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
