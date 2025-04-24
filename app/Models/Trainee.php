<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trainee extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'class', 'absence_count', 'import_batch'];
    
    // Always set absence_count to 0 by default
    protected $attributes = [
        'absence_count' => 0,
    ];
    
    // Ensure absence_count is always returned as 0 when accessed
    public function getAbsenceCountAttribute($value)
    {
        return 0;
    }
}
