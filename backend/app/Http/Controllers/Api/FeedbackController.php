<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserFeedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    /**
     * Store new user feedback / review / query.
     * Records user_id, name, email, type, message, device info, client IP,
     * and an explicit timestamp in Asia/Kolkata timezone.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:improvement,feature,bug',
            'message' => 'required|string|min:3|max:5000',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
        ]);

        $user = $request->user();

        // Calculate explicit Asia/Kolkata timestamp
        $kolkataTime = now()->setTimezone('Asia/Kolkata')->format('Y-m-d H:i:s T');

        // Extract client device details
        $userAgent = substr((string) $request->header('User-Agent', 'Unknown'), 0, 500);
        $clientIp = $request->ip();

        $feedback = UserFeedback::create([
            'user_id' => $user?->id,
            'name' => $user?->name ?? ($validated['name'] ?? 'Anonymous Vault User'),
            'email' => $user?->email ?? ($validated['email'] ?? 'unspecified@remivault.local'),
            'type' => $validated['type'],
            'message' => trim($validated['message']),
            'device_info' => $userAgent,
            'ip_address' => $clientIp,
            'submitted_at_kolkata' => $kolkataTime,
            'status' => 'new',
        ]);

        return response()->json([
            'message' => 'Thank you! Your feedback has been received and securely recorded.',
            'feedback' => [
                'id' => $feedback->id,
                'type' => $feedback->type,
                'submitted_at' => $feedback->submitted_at_kolkata,
                'status' => $feedback->status,
            ],
        ], 201);
    }
}
