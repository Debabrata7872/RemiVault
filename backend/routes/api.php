<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ImportantDateController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ReminderController;
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

    // Email OTP Verification Endpoints
    Route::post('/send-email-otp', [AuthController::class, 'sendEmailOtp'])
        ->middleware('throttle:6,1');
    Route::post('/check-email-otp', [AuthController::class, 'checkEmailOtp'])
        ->middleware('throttle:10,1');
    Route::post('/verify-email-otp-register', [AuthController::class, 'verifyEmailOtpRegister'])
        ->middleware('throttle:10,1');
    Route::post('/verify-email-otp-reset', [AuthController::class, 'verifyEmailOtpReset'])
        ->middleware('throttle:10,1');
    Route::post('/verify-email-otp-pin', [AuthController::class, 'verifyEmailOtpResetPin'])
        ->middleware('throttle:10,1');

    // Firebase Authentication (Google Sign-In & Phone OTP)
    Route::post('/firebase-login', [AuthController::class, 'firebaseLogin'])
        ->middleware('throttle:10,1');

    // Protected routes requiring a valid Bearer token via Laravel Sanctum
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword'])
            ->middleware('throttle:6,1');
        Route::post('/update-avatar', [AuthController::class, 'updateAvatar']);
        Route::post('/security-pin', [AuthController::class, 'setSecurityPin'])
            ->middleware('throttle:10,1');
        Route::post('/security-pin/verify', [AuthController::class, 'verifySecurityPin'])
            ->middleware('throttle:15,1');
    });
});

// User Feedback & Review (Support / Suggestions / Bug Reports)
Route::post('/feedback', [FeedbackController::class, 'store'])
    ->middleware('throttle:10,1');

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

    // Stage 8: Consolidated High-Speed Dashboard & Adaptive Preload
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);

    // User Usage & Activity Tracking (App opens count and active time spent)
    Route::post('/activity/session-start', [ActivityController::class, 'sessionStart']);
    Route::post('/activity/heartbeat', [ActivityController::class, 'heartbeat'])
        ->middleware('throttle:60,1');
});

/**
 * Super Administrator Console (Exclusively for authorized Super Admin with Master PIN verification)
 */
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/verify-pin', [AdminController::class, 'verifyPin'])
        ->middleware('throttle:5,1');
    Route::post('/change-pin', [AdminController::class, 'changePin'])
        ->middleware('throttle:6,1');
    Route::get('/overview', [AdminController::class, 'overview']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/feedback', [AdminController::class, 'feedback']);
    Route::patch('/feedback/{id}/status', [AdminController::class, 'updateFeedbackStatus']);
});

// Legacy /user endpoint for standard Sanctum checks
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/**
 * Public App Release & Version Information Endpoint
 */
Route::get('/app/version', function () {
    $manifestFile = storage_path('app/app_release.json');
    if (file_exists($manifestFile)) {
        $custom = json_decode(file_get_contents($manifestFile), true);
        if (is_array($custom)) {
            return response()->json($custom);
        }
    }

    $apkPath = base_path('../frontend/public/downloads/RemiVault.apk');
    if (!file_exists($apkPath)) {
        $apkPath = base_path('../frontend/android/app/build/outputs/apk/debug/app-debug.apk');
    }
    $sizeBytes = file_exists($apkPath) ? filesize($apkPath) : 18365203;
    $sizeMb = round($sizeBytes / (1024 * 1024), 1);

    // Dynamic test/simulation support via query param or header
    $simulate = request()->boolean('simulate_update') || request()->header('X-Simulate-Update') === 'true';
    $version = $simulate ? '0.3.0' : '0.2.0';
    $versionCode = $simulate ? 3 : 2;

    return response()->json([
        'version' => $version,
        'version_code' => $versionCode,
        'package_name' => 'com.remivault.app',
        'apk_filename' => 'RemiVault.apk',
        'apk_size_bytes' => $sizeBytes,
        'apk_size_formatted' => $sizeMb . ' MB',
        'min_android' => 'Android 8.0 (API 26)+',
        'target_android' => 'Android 14 (API 34)',
        'download_url' => '/api/download/apk',
        'release_date' => $simulate ? '2026-10-30' : '2026-10-29',
        'is_mandatory' => false,
        'changelog' => $simulate ? [
            '🚀 Live in-app version upgrade alerts with bandwidth awareness',
            '⚡ Ultra-smooth progressive hydration & instant vault access',
            '🔒 Hardware-backed biometric PIN encryption & auto-lock',
            '🔔 Status bar notifications for expiring passports & warranties',
        ] : [
            'Standalone Android APK with hardware-backed performance',
            'Full-screen vault experience with zero browser address bar clutter',
            'Real-time system tray & status bar alerts for due tasks',
            'High-security 4-digit PIN authentication & auto-lock',
        ],
    ]);
});

/**
 * Toggle Simulation of New Version Release (For Development, Demo & Testing)
 */
Route::post('/app/toggle-simulated-release', function (\Illuminate\Http\Request $request) {
    $manifestFile = storage_path('app/app_release.json');
    $enable = $request->boolean('enable', true);

    if (!$enable) {
        if (file_exists($manifestFile)) {
            unlink($manifestFile);
        }
        return response()->json(['simulated' => false, 'message' => 'Reset to standard v0.2.0']);
    }

    $apkPath = base_path('../frontend/public/downloads/RemiVault.apk');
    $sizeBytes = file_exists($apkPath) ? filesize($apkPath) : 18365203;
    $sizeMb = round($sizeBytes / (1024 * 1024), 1);

    $manifest = [
        'version' => '0.3.0',
        'version_code' => 3,
        'package_name' => 'com.remivault.app',
        'apk_filename' => 'RemiVault.apk',
        'apk_size_bytes' => $sizeBytes,
        'apk_size_formatted' => $sizeMb . ' MB',
        'min_android' => 'Android 8.0 (API 26)+',
        'target_android' => 'Android 14 (API 34)',
        'download_url' => '/api/download/apk',
        'release_date' => '2026-10-30',
        'is_mandatory' => false,
        'changelog' => [
            '🚀 Live in-app version upgrade alerts with bandwidth awareness',
            '⚡ Ultra-smooth progressive hydration & instant vault access',
            '🔒 Hardware-backed biometric PIN encryption & auto-lock',
            '🔔 Status bar notifications for expiring passports & warranties',
        ],
    ];

    file_put_contents($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT));
    return response()->json(['simulated' => true, 'manifest' => $manifest]);
});

/**
 * Public Direct APK Download Endpoint
 * Serves the APK with explicit android package headers to prevent browsers from appending .zip
 */
Route::get('/download/apk', function () {
    $apkPath = base_path('../frontend/public/downloads/RemiVault.apk');
    if (!file_exists($apkPath)) {
        $apkPath = base_path('../frontend/android/app/build/outputs/apk/debug/app-debug.apk');
    }
    if (!file_exists($apkPath)) {
        return response()->json(['message' => 'APK package not found on server.'], 404);
    }
    return response()->download($apkPath, 'RemiVault.apk', [
        'Content-Type' => 'application/vnd.android.package-archive',
        'Content-Disposition' => 'attachment; filename="RemiVault.apk"',
        'X-Content-Type-Options' => 'nosniff',
    ]);
});


