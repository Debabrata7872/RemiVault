<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\ImportantDateController;
use App\Http\Controllers\Api\VaultEntryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/**
 * Public Infrastructure Health Check
 */
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Throwable $e) {
        $dbStatus = 'disconnected: ' . $e->getMessage();
    }

    return response()->json([
        'status' => 'ok',
        'application' => config('app.name'),
        'environment' => config('app.env'),
        'database' => $dbStatus,
        'timestamp' => now()->toIso8601String(),
    ]);
});

/**
 * Authentication Endpoints (Rate-limited to protect against brute-force attacks)
 */
Route::prefix('auth')->group(function () {
    // Registration: Allow up to 10 requests per minute per IP
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:10,1');

    // Login: Strict limit of 5 attempts per minute per IP/account to prevent brute force
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // Protected routes requiring a valid Bearer token via Laravel Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/**
 * User-Scoped Data Resources (Protected by Sanctum Token)
 */
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('notes', NoteController::class);

    // Stage 5: Reminders Resource and Workflow Endpoints
    Route::apiResource('reminders', ReminderController::class);
    Route::patch('/reminders/{reminder}/toggle-complete', [ReminderController::class, 'toggleComplete']);
    Route::post('/reminders/{reminder}/snooze', [ReminderController::class, 'snooze']);

    // Stage 6: Important Dates Resource and Workflow Endpoints
    Route::apiResource('important-dates', ImportantDateController::class);
    Route::patch('/important-dates/{importantDate}/toggle-pin', [ImportantDateController::class, 'togglePin']);

    // Stage 7: Password Vault Resource and Workflow Endpoints
    Route::apiResource('vault-entries', VaultEntryController::class);
    Route::patch('/vault-entries/{vaultEntry}/toggle-favorite', [VaultEntryController::class, 'toggleFavorite']);
    Route::post('/vault-entries/{vaultEntry}/record-access', [VaultEntryController::class, 'recordAccess']);
});

// Legacy /user endpoint for standard Sanctum checks
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
