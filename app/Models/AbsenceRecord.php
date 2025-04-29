<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AbsenceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'group_id',
        'teacher_id',
        'start_time',
        'end_time',
    ];

    /**
     * Get the group associated with this absence record.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Get the teacher associated with this absence record.
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get the individual trainee absences for this record.
     */
    public function traineeAbsences(): HasMany
    {
        return $this->hasMany(TraineeAbsence::class);
    }
} 