<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user account and issue an initial API Bearer token.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // The User model casts 'password' => 'hashed', automatically invoking Bcrypt
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        // Generate a new Personal Access Token via Laravel Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Authenticate an existing user and issue an API Bearer token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $input = trim($validated['email']);

        // Check if input is a phone number (does not contain @) or email
        if (!str_contains($input, '@')) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $input);
            $user = User::where('email', "phone_{$cleanPhone}@auth.remivault.local")
                ->orWhere('email', "phone_{$cleanPhone}@remivault.local")
                ->first();
        } else {
            $user = User::where('email', strtolower($input))->first();
        }

        // Verify password hash using constant-time comparison
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Pre-validate an OTP code before showing the password setup panel.
     */
    public function checkEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'type' => 'required|in:register,forgot_password',
            'otp' => 'required|string|size:6',
        ]);

        $email = strtolower(trim($validated['email']));
        $type = $validated['type'];
        $cacheKey = "otp_{$type}_{$email}";
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$cached) {
            return response()->json([
                'message' => 'Verification code has expired or was not requested. Please request a new code.',
            ], 422);
        }

        if (($cached['attempts'] ?? 0) >= 5) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json([
                'message' => 'Too many invalid attempts. Please request a new verification code.',
            ], 429);
        }

        if (!Hash::check($validated['otp'], $cached['code'])) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            \Illuminate\Support\Facades\Cache::put($cacheKey, $cached, now()->addMinutes(10));

            return response()->json([
                'message' => 'Invalid verification code. Please check your email and try again.',
                'remaining_attempts' => 5 - $cached['attempts'],
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Verification code confirmed.',
        ]);
    }

    /**
     * Return the currently authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Revoke the current access token (Log out).
     */
     public function logout(Request $request): JsonResponse
     {
         // Delete only the token used to authenticate the current request
         $request->user()->currentAccessToken()->delete();

         return response()->json([
             'message' => 'Successfully logged out.',
         ]);
     }

    /**
     * Change account password for authenticated user.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.',
                'errors' => [
                    'current_password' => ['The provided current password does not match our records.'],
                ],
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Update profile avatar URL for the authenticated user.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar_url' => 'required|url|max:1024',
        ]);

        $user = $request->user();
        $user->avatar_url = $validated['avatar_url'];
        $user->save();

        return response()->json([
            'message' => 'Profile picture updated successfully.',
            'avatar_url' => $user->avatar_url,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Set or update the user's 4-digit security PIN.
     */
    public function setSecurityPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|regex:/^\d{4}$/',
        ]);

        $user = $request->user();
        $user->security_pin = Hash::make($validated['pin']);
        $user->save();

        return response()->json([
            'message' => '4-Digit Profile PIN updated successfully.',
            'has_pin' => true,
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Verify the user's 4-digit security PIN.
     */
    public function verifySecurityPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|regex:/^\d{4}$/',
        ]);

        $user = $request->user();

        if (empty($user->security_pin) || !Hash::check($validated['pin'], $user->security_pin)) {
            return response()->json([
                'valid' => false,
                'message' => 'Incorrect PIN. Please try again.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'PIN verified successfully.',
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Helper to format user payload consistently across all auth endpoints.
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'has_pin' => !empty($user->security_pin),
            'created_at' => $user->created_at,
        ];
    }

    /**
     * Send a 6-digit OTP code to the user's email address for registration or password reset.
     */
    public function sendEmailOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|max:255',
                'type' => 'required|in:register,forgot_password',
                'name' => 'nullable|string|max:100',
            ]);

            $email = strtolower(trim($validated['email']));
            $type = $validated['type'];
            $name = $validated['name'] ?? null;

            // Validation for registration: make sure email isn't already taken
            if ($type === 'register' && User::where('email', $email)->exists()) {
                return response()->json([
                    'message' => 'This email address is already registered. Please sign in instead.',
                ], 422);
            }

            // Validation for forgot_password: make sure account exists
            if ($type === 'forgot_password' && !User::where('email', $email)->exists()) {
                return response()->json([
                    'message' => 'No RemiVault account found with this email address.',
                ], 404);
            }

            // 60-second cooldown check to prevent abuse and spamming
            $cooldownKey = "otp_cooldown_{$type}_{$email}";
            if (\Illuminate\Support\Facades\Cache::has($cooldownKey)) {
                return response()->json([
                    'message' => 'Please wait 60 seconds before requesting another code.',
                ], 429);
            }

            // Generate cryptographically random 6-digit code
            $otp = (string) random_int(100000, 999999);

            // Store hashed OTP in cache for 10 minutes
            $cacheKey = "otp_{$type}_{$email}";
            \Illuminate\Support\Facades\Cache::put($cacheKey, [
                'code' => Hash::make($otp),
                'attempts' => 0,
                'name' => $name,
            ], now()->addMinutes(10));

            // Set cooldown for 60 seconds
            \Illuminate\Support\Facades\Cache::put($cooldownKey, true, now()->addSeconds(60));

            // Dispatch custom branded HTML email
            try {
                \Illuminate\Support\Facades\Mail::to($email)->send(new \App\Mail\OtpMail($otp, $type, $name));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Failed to send OTP email: {$e->getMessage()}");
                return response()->json([
                    'message' => 'Failed to send verification email. Please check your email configuration.',
                ], 500);
            }

            return response()->json([
                'message' => 'A 6-digit verification code has been sent to your email.',
                'cooldown_seconds' => 60,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->validator->errors()->first() ?: 'Validation failed.',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("sendEmailOtp exception: {$e->getMessage()}");
            return response()->json([
                'message' => 'Unable to dispatch verification code: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify email OTP and complete new account registration.
     */
    public function verifyEmailOtpRegister(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'otp' => 'required|string|size:6',
        ]);

        $email = strtolower(trim($validated['email']));
        $cacheKey = "otp_register_{$email}";
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$cached) {
            return response()->json([
                'message' => 'Verification code has expired or was not requested. Please request a new code.',
            ], 422);
        }

        // Check attempts limit (max 5)
        if (($cached['attempts'] ?? 0) >= 5) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json([
                'message' => 'Too many invalid attempts. Please request a new verification code.',
            ], 429);
        }

        // Validate code hash
        if (!Hash::check($validated['otp'], $cached['code'])) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            \Illuminate\Support\Facades\Cache::put($cacheKey, $cached, now()->addMinutes(10));

            return response()->json([
                'message' => 'Invalid verification code. Please check your email and try again.',
                'remaining_attempts' => 5 - $cached['attempts'],
            ], 422);
        }

        // Valid code: purge OTP cache
        \Illuminate\Support\Facades\Cache::forget($cacheKey);

        // Create verified user account
        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'password' => $validated['password'],
            'email_verified_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified and account registered successfully.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Verify email OTP and reset user password.
     */
    public function verifyEmailOtpReset(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|max:255|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
            'otp' => 'required|string|size:6',
        ]);

        $email = strtolower(trim($validated['email']));
        $cacheKey = "otp_forgot_password_{$email}";
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$cached) {
            return response()->json([
                'message' => 'Verification code has expired or was not requested. Please request a new code.',
            ], 422);
        }

        // Check attempts limit (max 5)
        if (($cached['attempts'] ?? 0) >= 5) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json([
                'message' => 'Too many invalid attempts. Please request a new verification code.',
            ], 429);
        }

        // Validate code hash
        if (!Hash::check($validated['otp'], $cached['code'])) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            \Illuminate\Support\Facades\Cache::put($cacheKey, $cached, now()->addMinutes(10));

            return response()->json([
                'message' => 'Invalid verification code. Please check your email and try again.',
                'remaining_attempts' => 5 - $cached['attempts'],
            ], 422);
        }

        // Valid code: purge OTP cache
        \Illuminate\Support\Facades\Cache::forget($cacheKey);

        $user = User::where('email', $email)->first();
        $user->password = $validated['password'];
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Password reset successfully. You are now logged in.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Authenticate or register a user verified via Firebase (Google Sign-In or Phone Auth).
     */
    public function firebaseLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'idToken' => 'required|string',
            'email' => 'nullable|email',
            'name' => 'nullable|string',
            'phone' => 'nullable|string',
            'photo_url' => 'nullable|string|max:1024',
        ]);

        $idToken = $validated['idToken'];
        $firebaseApiKey = env('FIREBASE_API_KEY', 'AIzaSyBgc2Dap9csYQ0foT_1L0fGQgDO4GiCBZc');
        $verifiedPhotoUrl = $validated['photo_url'] ?? null;

        // Verify Firebase ID Token using Google Identity Toolkit REST API
        try {
            $response = \Illuminate\Support\Facades\Http::post(
                "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={$firebaseApiKey}",
                ['idToken' => $idToken]
            );

            if ($response->failed() || empty($response->json('users'))) {
                // Secondary check: verify via Google tokeninfo
                $googleCheck = \Illuminate\Support\Facades\Http::get(
                    "https://oauth2.googleapis.com/tokeninfo?id_token={$idToken}"
                );

                if ($googleCheck->failed()) {
                    return response()->json([
                        'message' => 'Invalid or expired Firebase authentication token.',
                    ], 401);
                }

                $googleData = $googleCheck->json();
                $verifiedEmail = $googleData['email'] ?? null;
                $verifiedName = $googleData['name'] ?? null;
                $verifiedPhotoUrl = $verifiedPhotoUrl ?: ($googleData['picture'] ?? null);
            } else {
                $firebaseUser = $response->json('users')[0];
                $verifiedEmail = $firebaseUser['email'] ?? null;
                $verifiedName = $firebaseUser['displayName'] ?? null;
                $verifiedPhone = $firebaseUser['phoneNumber'] ?? null;
                $verifiedPhotoUrl = $verifiedPhotoUrl ?: ($firebaseUser['photoUrl'] ?? null);

                // If phone login without email, generate a deterministic synthetic email
                if (!$verifiedEmail && !empty($verifiedPhone)) {
                    $cleanPhone = preg_replace('/[^0-9]/', '', $verifiedPhone);
                    $verifiedEmail = "phone_{$cleanPhone}@auth.remivault.local";
                    $verifiedName = $verifiedName ?: "User {$verifiedPhone}";
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Firebase auth verification error: {$e->getMessage()}");
            return response()->json([
                'message' => 'Unable to verify authentication credentials with Firebase.',
            ], 500);
        }

        if (empty($verifiedEmail)) {
            return response()->json([
                'message' => 'Could not determine a verified email address from your account.',
            ], 422);
        }

        // Find existing user or register new verified user
        $user = User::where('email', $verifiedEmail)->first();

        if (!$user) {
            $user = User::create([
                'name' => $verifiedName ?: ($validated['name'] ?? 'Verified User'),
                'email' => $verifiedEmail,
                'avatar_url' => $verifiedPhotoUrl,
                'password' => \Illuminate\Support\Str::random(32),
                'email_verified_at' => now(),
            ]);
        } else {
            $updated = false;
            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
                $updated = true;
            }
            if ($verifiedPhotoUrl && $user->avatar_url !== $verifiedPhotoUrl) {
                $user->avatar_url = $verifiedPhotoUrl;
                $updated = true;
            }
            if ($updated) {
                $user->save();
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Authenticated successfully via Firebase.',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }
}
