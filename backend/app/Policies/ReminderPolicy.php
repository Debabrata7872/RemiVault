<?php

namespace App\Policies;

use App\Models\Reminder;
use App\Models\User;

class ReminderPolicy
{
    /**
     * Determine whether the user can view any reminders.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific reminder.
     * IDOR Protection: Verifies that user owns this reminder record.
     */
    public function view(User $user, Reminder $reminder): bool
    {
        return $user->id === $reminder->user_id;
    }

    /**
     * Determine whether the user can create reminders.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the reminder.
     * IDOR Protection: Strictly prevents cross-account mutation.
     */
    public function update(User $user, Reminder $reminder): bool
    {
        return $user->id === $reminder->user_id;
    }

    /**
     * Determine whether the user can delete the reminder.
     * IDOR Protection: Strictly prevents cross-account deletion.
     */
    public function delete(User $user, Reminder $reminder): bool
    {
        return $user->id === $reminder->user_id;
    }
}
