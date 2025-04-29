<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trainee extends Model
{
    use HasFactory;

    protected $fillable = [
        'cef',
        'name',
        'first_name',
        'group_id',
    ];

    /**
     * Get the group that the trainee belongs to.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Get all absences for this trainee.
     */
    public function absences(): HasMany
    {
        return $this->hasMany(TraineeAbsence::class);
    }

    /**
     * Calculate the total absence hours for this trainee.
     */
    public function calculateTotalAbsenceHours(): float
    {
        $absences = $this->absences()
            ->where('is_justified', false)
            ->where('status', 'absent')
            ->get();
            
        $totalHours = 0;
        
        foreach ($absences as $absence) {
            $totalHours += $absence->absence_hours ?? 0;
        }
        
        return $totalHours;
    }

    /**
     * Calculate the disciplinary note based on absences.
     * 
     * @return float A score from 0 to 20
     */
    public function calculateDisciplinaryNote(): float
    {
        $absenceHours = $this->calculateTotalAbsenceHours();
        
        // Count late arrivals
        $lateArrivals = $this->absences()
            ->where('status', 'late')
            ->count();
        
        // Calculate deductions
        // -0.5 points per 2.5 hours of absence
        $absenceDeduction = floor($absenceHours / 2.5) * 0.5;
        
        // -1 point per 4 late arrivals
        $latenessDeduction = floor($lateArrivals / 4) * 1;
        
        // Calculate final score (minimum 0)
        $finalNote = max(0, 20 - $absenceDeduction - $latenessDeduction);
        
        // Round to 1 decimal place
        return round($finalNote, 1);
    }
}
