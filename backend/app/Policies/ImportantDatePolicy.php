<?php

namespace App\Policies;

use App\Models\ImportantDate;
use App\Models\User;

class ImportantDatePolicy
{
    /**
     * Determine whether the user can view any important dates.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific important date.
     * IDOR Protection: Verifies user owns this important date record.
     */
    public function view(User $user, ImportantDate $importantDate): bool
    {
        return $user->id === $importantDate->user_id;
    }

    /**
     * Determine whether the user can create important dates.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the important date.
     * IDOR Protection: Strictly prevents cross-account mutation.
     */
    public function update(User $user, ImportantDate $importantDate): bool
    {
        return $user->id === $importantDate->user_id;
    }

    /**
     * Determine whether the user can delete the important date.
     * IDOR Protection: Strictly prevents cross-account deletion.
     */
    public function delete(User $user, ImportantDate $importantDate): bool
    {
        return $user->id === $importantDate->user_id;
    }
}
