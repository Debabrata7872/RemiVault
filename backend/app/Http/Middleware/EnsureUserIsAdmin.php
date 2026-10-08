<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     * Enforce strict role-based access for Super Administrator only.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $adminEmail = strtolower(trim(config('app.admin_email', 'debabratasahoo499905@gmail.com')));
        $userEmail = strtolower(trim($user->email));

        if ($userEmail !== $adminEmail) {
            return response()->json([
                'message' => 'Access denied: You do not have Super Administrator privileges.',
            ], 403);
        }

        return $next($request);
    }
}
