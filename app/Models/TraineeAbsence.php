<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TraineeAbsence extends Model
{
    use HasFactory;

    protected $fillable = [
        'trainee_id',
        'absence_record_id',
        'status',
        'is_validated',
        'is_justified',
        'has_billet_entree',
        'validated_by',
        'validated_at',
        'justification_comment',
        'absence_hours',
    ];

    protected $casts = [
        'is_validated' => 'boolean',
        'is_justified' => 'boolean',
        'has_billet_entree' => 'boolean',
        'validated_at' => 'datetime',
        'absence_hours' => 'float',
    ];

    /**
     * Get the trainee associated with this absence.
     */
    public function trainee(): BelongsTo
    {
        return $this->belongsTo(Trainee::class);
    }

    /**
     * Get the absence record associated with this absence.
     */
    public function absenceRecord(): BelongsTo
    {
        return $this->belongsTo(AbsenceRecord::class);
    }

    /**
     * Calculate absence hours based on status and time range.
     */
    public function calculateAbsenceHours(): float
    {
        if ($this->status === 'present' || $this->is_justified) {
            return 0;
        }

        if ($this->status === 'absent') {
            $absenceRecord = $this->absenceRecord;
            
            if (!$absenceRecord) {
                return 0;
            }
            
            // Calculate hours based on time range
            $startTime = strtotime($absenceRecord->start_time);
            $endTime = strtotime($absenceRecord->end_time);
            
            $hoursDiff = ($endTime - $startTime) / 3600;
            
            // Determine if it's a half-day or full-day absence
            if ($hoursDiff <= 3) {
                return 2.5; // Half-day absence (2.5 hours)
            } else {
                return 5.0; // Full-day absence (5 hours)
            }
        } elseif ($this->status === 'late') {
            // For late status, we don't count hours directly
            return 0;
        }
        
        return 0;
    }
} 