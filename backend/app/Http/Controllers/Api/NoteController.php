<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\StoreNoteRequest;
use App\Http\Requests\Notes\UpdateNoteRequest;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NoteController extends Controller
{
    /**
     * Display a listing of the authenticated user's notes.
     * Note: Queries strictly through the user relationship, guaranteeing zero data leakage across accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $notes = $request->user()
            ->notes()
            ->orderByDesc('is_pinned')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'notes' => $notes,
        ]);
    }

    /**
     * Store a newly created note belonging to the authenticated user.
     */
    public function store(StoreNoteRequest $request): JsonResponse
    {
        $note = $request->user()->notes()->create($request->validated());

        return response()->json([
            'message' => 'Note created successfully.',
            'note' => $note,
        ], 201);
    }

    /**
     * Display the specified note.
     * IDOR Protection: Gate::authorize invokes NotePolicy::view to prevent unauthorized access.
     */
    public function show(Note $note): JsonResponse
    {
        Gate::authorize('view', $note);

        return response()->json([
            'note' => $note,
        ]);
    }

    /**
     * Update the specified note.
     * IDOR Protection: Gate::authorize invokes NotePolicy::update.
     */
    public function update(UpdateNoteRequest $request, Note $note): JsonResponse
    {
        Gate::authorize('update', $note);

        $note->update($request->validated());

        return response()->json([
            'message' => 'Note updated successfully.',
            'note' => $note->fresh(),
        ]);
    }

    /**
     * Remove the specified note.
     * IDOR Protection: Gate::authorize invokes NotePolicy::delete.
     */
    public function destroy(Note $note): JsonResponse
    {
        Gate::authorize('delete', $note);

        $note->delete();

        return response()->json([
            'message' => 'Note deleted successfully.',
        ]);
    }
}
