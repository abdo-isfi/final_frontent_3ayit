<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Trainee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TraineeController extends Controller
{
    /**
     * Get all trainees
     */
    public function index(): JsonResponse
    {
        $trainees = Trainee::with('group')->orderBy('name')->get();
        return response()->json($trainees);
    }

    /**
     * Create a new trainee
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cef' => 'required|string|unique:trainees,cef',
            'name' => 'required|string',
            'first_name' => 'required|string',
            'group_id' => 'required|exists:groups,id',
        ]);

        $trainee = Trainee::create($validated);
        return response()->json($trainee, 201);
    }

    /**
     * Get a specific trainee
     */
    public function show(Trainee $trainee): JsonResponse
    {
        $trainee->load('group');
        return response()->json($trainee);
    }

    /**
     * Update a trainee
     */
    public function update(Request $request, Trainee $trainee): JsonResponse
    {
        $validated = $request->validate([
            'cef' => 'string|unique:trainees,cef,' . $trainee->id,
            'name' => 'string',
            'first_name' => 'string',
            'group_id' => 'exists:groups,id',
        ]);

        $trainee->update($validated);
        return response()->json($trainee);
    }

    /**
     * Delete a trainee
     */
    public function destroy(Trainee $trainee): JsonResponse
    {
        $trainee->delete();
        return response()->json(null, 204);
    }

    /**
     * Get all absences for a trainee
     */
    public function absences(Trainee $trainee): JsonResponse
    {
        $absences = $trainee->absences()
            ->with('absenceRecord')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($absences);
    }
    
    /**
     * Get trainee statistics
     */
    public function statistics(Trainee $trainee): JsonResponse
    {
        $totalAbsenceHours = $trainee->calculateTotalAbsenceHours();
        $disciplinaryNote = $trainee->calculateDisciplinaryNote();
        
        $lateCount = $trainee->absences()
            ->where('status', 'late')
            ->count();
            
        $absentCount = $trainee->absences()
            ->where('status', 'absent')
            ->count();
            
        $justifiedCount = $trainee->absences()
            ->where('is_justified', true)
            ->count();
            
        return response()->json([
            'total_absence_hours' => $totalAbsenceHours,
            'disciplinary_note' => $disciplinaryNote,
            'late_count' => $lateCount,
            'absent_count' => $absentCount,
            'justified_count' => $justifiedCount,
        ]);
    }
    
    /**
     * Bulk import trainees
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $request->validate([
            'trainees' => 'required|array',
            'trainees.*.cef' => 'required|string',
            'trainees.*.name' => 'required|string',
            'trainees.*.first_name' => 'required|string',
            'trainees.*.group_id' => 'required|exists:groups,id',
        ]);
        
        $importedCount = 0;
        $errors = [];
        
        foreach ($request->trainees as $traineeData) {
            try {
                // Check if trainee with this CEF already exists
                $existingTrainee = Trainee::where('cef', $traineeData['cef'])->first();
                
                if ($existingTrainee) {
                    // Update existing trainee
                    $existingTrainee->update($traineeData);
                } else {
                    // Create new trainee
                    Trainee::create($traineeData);
                }
                
                $importedCount++;
            } catch (\Exception $e) {
                $errors[] = [
                    'cef' => $traineeData['cef'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'imported' => $importedCount,
            'errors' => $errors
        ]);
    }
} 