<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'filiere',
        'annee',
    ];

    /**
     * Get the trainees associated with this group.
     */
    public function trainees(): HasMany
    {
        return $this->hasMany(Trainee::class);
    }

    /**
     * Get the absence records associated with this group.
     */
    public function absenceRecords(): HasMany
    {
        return $this->hasMany(AbsenceRecord::class);
    }
} 