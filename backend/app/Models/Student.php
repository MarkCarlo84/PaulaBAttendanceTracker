<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
class Student extends Model
{
    protected $fillable = [
        'uuid', 'student_id', 'first_name', 'middle_name',
        'last_name', 'section', 'gender', 'qr_code_path'
    ];
    protected $casts = [
        'uuid' => 'string',
    ];
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . ($this->middle_name ? $this->middle_name . ' ' : '') . $this->last_name);
    }
}
