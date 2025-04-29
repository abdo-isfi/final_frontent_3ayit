<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AbsenceRecord;
use App\Models\Group;
use App\Models\Trainee;
use App\Models\TraineeAbsence;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AbsenceController extends Controller
{
    /**
     * Get all absence records
     */
    public function index(Request $request): JsonResponse
    {
        $query = AbsenceRecord::query()->with(['group', 'teacher']);
        
        // Filter by group
        if ($request->has('group_id')) {
            $query->where('group_id', $request->group_id);
        }
        
        // Filter by date
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        
        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        
        // Order by date (most recent first)
        $records = $query->orderBy('date', 'desc')->get();
        
        return response()->json($records);
    }

    /**
     * Create a new absence record
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'group_id' => 'required|exists:groups,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'students' => 'required|array',
            'students.*.trainee_id' => 'required|exists:trainees,id',
            'students.*.status' => 'required|in:absent,late,present',
        ]);
        
        // Start a transaction to ensure all related records are created
        return DB::transaction(function () use ($validated) {
            // Create the absence record
            $absenceRecord = AbsenceRecord::create([
                'date' => $validated['date'],
                'group_id' => $validated['group_id'],
                'teacher_id' => $validated['teacher_id'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
            ]);
            
            // Create individual trainee absences
            $traineeAbsences = [];
            
            foreach ($validated['students'] as $student) {
                $traineeAbsence = TraineeAbsence::create([
                    'trainee_id' => $student['trainee_id'],
                    'absence_record_id' => $absenceRecord->id,
                    'status' => $student['status'],
                    'is_validated' => false,
                    'is_justified' => false,
                    'has_billet_entree' => false,
                ]);
                
                // Calculate and set absence hours
                $absenceHours = $traineeAbsence->calculateAbsenceHours();
                $traineeAbsence->update(['absence_hours' => $absenceHours]);
                
                $traineeAbsences[] = $traineeAbsence;
            }
            
            // Load relationships for the response
            $absenceRecord->load(['group', 'teacher', 'traineeAbsences.trainee']);
            
            return response()->json($absenceRecord, 201);
        });
    }

    /**
     * Get a specific absence record
     */
    public function show(AbsenceRecord $absenceRecord): JsonResponse
    {
        $absenceRecord->load(['group', 'teacher', 'traineeAbsences.trainee']);
        return response()->json($absenceRecord);
    }

    /**
     * Update an absence record
     */
    public function update(Request $request, AbsenceRecord $absenceRecord): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'date',
            'group_id' => 'exists:groups,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'start_time' => 'date_format:H:i',
            'end_time' => 'date_format:H:i|after:start_time',
        ]);

        $absenceRecord->update($validated);
        
        // If time changed, recalculate absence hours for all trainee absences
        if ($request->has('start_time') || $request->has('end_time')) {
            foreach ($absenceRecord->traineeAbsences as $traineeAbsence) {
                $absenceHours = $traineeAbsence->calculateAbsenceHours();
                $traineeAbsence->update(['absence_hours' => $absenceHours]);
            }
        }
        
        $absenceRecord->load(['group', 'teacher', 'traineeAbsences.trainee']);
        return response()->json($absenceRecord);
    }

    /**
     * Delete an absence record
     */
    public function destroy(AbsenceRecord $absenceRecord): JsonResponse
    {
        // This will cascade delete all trainee absences related to this record
        $absenceRecord->delete();
        return response()->json(null, 204);
    }
    
    /**
     * Get absences for a specific group
     */
    public function groupAbsences(Group $group, Request $request): JsonResponse
    {
        $query = AbsenceRecord::where('group_id', $group->id)
            ->with(['traineeAbsences.trainee']);
            
        // Filter by date
        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        
        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
        
        $records = $query->orderBy('date', 'desc')->get();
        
        return response()->json($records);
    }
    
    /**
     * Validate trainee absences
     */
    public function validateAbsences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'absences' => 'required|array',
            'absences.*' => 'exists:trainee_absences,id',
            'validated_by' => 'required|string',
        ]);
        
        $count = 0;
        $errors = [];
        
        foreach ($validated['absences'] as $absenceId) {
            try {
                $traineeAbsence = TraineeAbsence::findOrFail($absenceId);
                $traineeAbsence->update([
                    'is_validated' => true,
                    'validated_by' => $validated['validated_by'],
                    'validated_at' => now(),
                ]);
                $count++;
            } catch (\Exception $e) {
                $errors[] = [
                    'id' => $absenceId,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'validated_count' => $count,
            'errors' => $errors
        ]);
    }
    
    /**
     * Justify trainee absences
     */
    public function justifyAbsences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'absences' => 'required|array',
            'absences.*' => 'exists:trainee_absences,id',
            'justification_comment' => 'nullable|string',
        ]);
        
        $count = 0;
        $errors = [];
        
        foreach ($validated['absences'] as $absenceId) {
            try {
                $traineeAbsence = TraineeAbsence::findOrFail($absenceId);
                $traineeAbsence->update([
                    'is_justified' => true,
                    'justification_comment' => $validated['justification_comment'],
                ]);
                
                // Update absence hours (justified absences have 0 hours)
                $traineeAbsence->update(['absence_hours' => 0]);
                
                $count++;
            } catch (\Exception $e) {
                $errors[] = [
                    'id' => $absenceId,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return response()->json([
            'success' => true,
            'justified_count' => $count,
            'errors' => $errors
        ]);
    }
    
    /**
     * Mark trainee as having a billet d'entrée
     */
    public function markBilletEntree(TraineeAbsence $absence): JsonResponse
    {
        $absence->update([
            'has_billet_entree' => true
        ]);
        
        return response()->json($absence);
    }
    
    /**
     * Get weekly report data for a group
     */
    public function weeklyReport(Group $group, Request $request): JsonResponse
    {
        // Validate request
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);
        
        // Get date range
        $startDate = Carbon::parse($validated['start_date'])->startOfDay();
        $endDate = Carbon::parse($validated['end_date'])->endOfDay();
        
        // Get all trainees in the group
        $trainees = $group->trainees()->orderBy('name')->get();
        
        // Get all absence records for this group and date range
        $absenceRecords = AbsenceRecord::where('group_id', $group->id)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with(['traineeAbsences.trainee'])
            ->orderBy('date')
            ->get();
        
        // Prepare daily data
        $days = [];
        $current = clone $startDate;
        
        while ($current <= $endDate) {
            $dayName = $current->format('D');
            $dayNumber = $current->day;
            $dateString = $current->toDateString();
            
            // Only include weekdays (Monday-Saturday)
            if ($dayName !== 'Sun') {
                // Map day names to French abbreviations
                $dayNameMap = [
                    'Mon' => 'LUN',
                    'Tue' => 'MAR',
                    'Wed' => 'MERC',
                    'Thu' => 'JEU',
                    'Fri' => 'VEN',
                    'Sat' => 'SAM',
                ];
                
                $days[] = [
                    'name' => $dayNameMap[$dayName],
                    'date' => $dateString,
                    'day' => $dayNumber,
                    'absences' => $absenceRecords->where('date', $dateString)->values(),
                ];
            }
            
            $current->addDay();
        }
        
        // Prepare trainee data with their absences
        $traineeData = [];
        
        foreach ($trainees as $trainee) {
            $traineeAbsences = [];
            
            // For each day, find this trainee's absences
            foreach ($days as $day) {
                $dayAbsences = [];
                
                // Check all absence records for this day
                foreach ($day['absences'] as $record) {
                    // Find this trainee's absence in the record
                    $absence = $record->traineeAbsences->first(function ($item) use ($trainee) {
                        return $item->trainee_id == $trainee->id;
                    });
                    
                    if ($absence) {
                        $dayAbsences[] = [
                            'id' => $absence->id,
                            'status' => $absence->status,
                            'is_justified' => $absence->is_justified,
                            'start_time' => $record->start_time,
                            'end_time' => $record->end_time,
                            'absence_hours' => $absence->absence_hours,
                        ];
                    }
                }
                
                $traineeAbsences[] = [
                    'date' => $day['date'],
                    'absences' => $dayAbsences,
                    'is_absent' => collect($dayAbsences)->contains('status', 'absent'),
                    'is_late' => collect($dayAbsences)->contains('status', 'late'),
                ];
            }
            
            $traineeData[] = [
                'id' => $trainee->id,
                'cef' => $trainee->cef,
                'name' => $trainee->name,
                'first_name' => $trainee->first_name,
                'week_absences' => $traineeAbsences,
            ];
        }
        
        return response()->json([
            'group' => $group,
            'days' => $days,
            'trainees' => $traineeData,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'formatted_start' => $startDate->format('d/m/Y'),
            'formatted_end' => $endDate->format('d/m/Y'),
        ]);
    }
} 