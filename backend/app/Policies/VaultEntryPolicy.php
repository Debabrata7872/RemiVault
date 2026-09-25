<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VaultEntry;

class VaultEntryPolicy
{
    /**
     * Determine whether the user can view any vault entries.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific vault entry.
     * IDOR Protection: Verifies user owns this vault credential.
     */
    public function view(User $user, VaultEntry $vaultEntry): bool
    {
        return $user->id === $vaultEntry->user_id;
    }

    /**
     * Determine whether the user can create vault entries.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the vault entry.
     * IDOR Protection: Strictly prevents cross-account mutation.
     */
    public function update(User $user, VaultEntry $vaultEntry): bool
    {
        return $user->id === $vaultEntry->user_id;
    }

    /**
     * Determine whether the user can delete the vault entry.
     * IDOR Protection: Strictly prevents cross-account deletion.
     */
    public function delete(User $user, VaultEntry $vaultEntry): bool
    {
        return $user->id === $vaultEntry->user_id;
    }
}
