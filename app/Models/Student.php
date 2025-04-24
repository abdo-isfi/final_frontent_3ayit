<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = ['cef', 'name', 'surname', 'group', 'phone'];

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function dropout()
    {
        return $this->hasOne(Dropout::class);
    }
}
