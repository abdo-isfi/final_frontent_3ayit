<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    /**
     * Get all groups
     */
    public function index(): JsonResponse
    {
        $groups = Group::orderBy('name')->get();
        return response()->json($groups);
    }

    /**
     * Create a new group
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:groups,name',
            'filiere' => 'nullable|string',
            'annee' => 'nullable|string',
        ]);

        $group = Group::create($validated);
        return response()->json($group, 201);
    }

    /**
     * Get a specific group
     */
    public function show(Group $group): JsonResponse
    {
        return response()->json($group);
    }

    /**
     * Update a group
     */
    public function update(Request $request, Group $group): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'string|unique:groups,name,' . $group->id,
            'filiere' => 'nullable|string',
            'annee' => 'nullable|string',
        ]);

        $group->update($validated);
        return response()->json($group);
    }

    /**
     * Delete a group
     */
    public function destroy(Group $group): JsonResponse
    {
        $group->delete();
        return response()->json(null, 204);
    }

    /**
     * Get all trainees in a group
     */
    public function trainees(Group $group): JsonResponse
    {
        $trainees = $group->trainees()->orderBy('name')->get();
        return response()->json($trainees);
    }
} 