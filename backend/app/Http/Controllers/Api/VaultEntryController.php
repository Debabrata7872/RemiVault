<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vault\StoreVaultEntryRequest;
use App\Http\Requests\Vault\UpdateVaultEntryRequest;
use App\Models\VaultEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class VaultEntryController extends Controller
{
    /**
     * Display a listing of the user's vault credentials.
     * Strictly isolated to the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->vaultEntries();

        // Search in title, username, and url
        if ($request->filled('search')) {
            $search = '%' . $request->query('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('username', 'like', $search)
                  ->orWhere('url', 'like', $search);
            });
        }

        // Category filter
        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        // Filter by favorites
        if ($request->query('favorites') === 'true' || $request->query('filter') === 'favorites') {
            $query->where('is_favorite', true);
        }

        // Get all user entries for aggregate metrics
        $allEntries = $user->vaultEntries()->get();

        $totalCount = $allEntries->count();
        $favoritesCount = $allEntries->where('is_favorite', true)->count();
        $loginsCount = $allEntries->where('category', 'login')->count();
        $apiKeysCount = $allEntries->where('category', 'api_key')->count();
        $cardsCount = $allEntries->where('category', 'credit_card')->count();
        $serversCount = $allEntries->where('category', 'server')->count();
        $weakCount = $allEntries->where('password_strength', 'weak')->count();

        // Order: Favorites first, then most recently updated
        $entries = $query
            ->orderBy('is_favorite', 'desc')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'vault_entries' => $entries,
            'counts' => [
                'total' => $totalCount,
                'favorites' => $favoritesCount,
                'logins' => $loginsCount,
                'api_keys' => $apiKeysCount,
                'cards' => $cardsCount,
                'servers' => $serversCount,
                'weak_passwords' => $weakCount,
            ],
        ]);
    }

    /**
     * Store a newly encrypted vault secret.
     */
    public function store(StoreVaultEntryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Calculate password entropy & strength
        $validated['password_strength'] = VaultEntry::calculateStrength($validated['password']);
        $validated['category'] = $validated['category'] ?? 'login';
        $validated['is_favorite'] = $validated['is_favorite'] ?? false;

        $vaultEntry = $request->user()->vaultEntries()->create($validated)->fresh();

        return response()->json([
            'message' => 'Secret securely encrypted and stored in vault.',
            'vault_entry' => $vaultEntry,
        ], 201);
    }

    /**
     * Display the specified vault entry.
     * IDOR Protection: Gate::authorize invokes VaultEntryPolicy::view.
     */
    public function show(VaultEntry $vaultEntry): JsonResponse
    {
        Gate::authorize('view', $vaultEntry);

        return response()->json([
            'vault_entry' => $vaultEntry,
        ]);
    }

    /**
     * Update the specified vault entry.
     * IDOR Protection: Gate::authorize invokes VaultEntryPolicy::update.
     */
    public function update(UpdateVaultEntryRequest $request, VaultEntry $vaultEntry): JsonResponse
    {
        Gate::authorize('update', $vaultEntry);

        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password_strength'] = VaultEntry::calculateStrength($validated['password']);
        }

        $vaultEntry->update($validated);

        return response()->json([
            'message' => 'Vault secret updated successfully.',
            'vault_entry' => $vaultEntry->fresh(),
        ]);
    }

    /**
     * Remove the specified vault entry.
     * IDOR Protection: Gate::authorize invokes VaultEntryPolicy::delete.
     */
    public function destroy(VaultEntry $vaultEntry): JsonResponse
    {
        Gate::authorize('delete', $vaultEntry);

        $vaultEntry->delete();

        return response()->json([
            'message' => 'Vault entry securely removed.',
        ]);
    }

    /**
     * Fast atomic toggle for favorite status.
     */
    public function toggleFavorite(VaultEntry $vaultEntry): JsonResponse
    {
        Gate::authorize('update', $vaultEntry);

        $newFav = !$vaultEntry->is_favorite;
        $vaultEntry->update(['is_favorite' => $newFav]);

        $message = $newFav ? 'Marked as favorite.' : 'Removed from favorites.';

        return response()->json([
            'message' => $message,
            'vault_entry' => $vaultEntry->fresh(),
        ]);
    }

    /**
     * Record credential access/copy event.
     */
    public function recordAccess(VaultEntry $vaultEntry): JsonResponse
    {
        Gate::authorize('view', $vaultEntry);

        $vaultEntry->update([
            'last_used_at' => Carbon::now(),
        ]);

        return response()->json([
            'message' => 'Access timestamp updated.',
            'last_used_at' => $vaultEntry->last_used_at,
        ]);
    }
}
