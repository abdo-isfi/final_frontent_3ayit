<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Dropout extends Model
{
    use HasFactory;

    protected $fillable = ['student_id', 'dropout_date', 'reason'];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
