<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Attendance extends Model
{
    protected $fillable = ['student_id', 'attendance_date', 'time_in', 'status', 'remarks'];
    protected $casts = [];
    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
