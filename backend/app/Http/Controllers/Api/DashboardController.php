<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use Carbon\Carbon;
class DashboardController extends Controller
{
    public function index()
    {
        $section = request('section');
        $gender = request('gender');
        $studentsQuery = Student::query();
        if ($section) {
            $studentsQuery->where('section', $section);
        }
        if ($gender) {
            $studentsQuery->where('gender', $gender);
        }
        $totalStudents = $studentsQuery->count();
        $today = Carbon::today()->toDateString();
        $studentIds = $section ? $studentsQuery->pluck('id')->toArray() : null;
        $presentToday = Attendance::whereDate('attendance_date', $today)
            ->where('status', 'PRESENT');
        if ($studentIds !== null) {
            $presentToday->whereIn('student_id', $studentIds);
        }
        $presentToday = $presentToday->count();

        $absentToday = Attendance::whereDate('attendance_date', $today)
            ->where('status', 'ABSENT');
        if ($studentIds !== null) {
            $absentToday->whereIn('student_id', $studentIds);
        }
        $absentToday = $absentToday->count();

        $attendanceRate = $totalStudents > 0 ? round(($presentToday / $totalStudents) * 100, 1) : 0;
        return response()->json([
            'total_students' => $totalStudents,
            'present_today' => $presentToday,
            'absent_today' => $absentToday,
            'attendance_rate' => $attendanceRate,
        ]);
    }
    public function trend()
    {
        $section = request('section');
        $gender = request('gender');
        $studentsQuery = Student::query();
        if ($section) {
            $studentsQuery->where('section', $section);
        }
        if ($gender) {
            $studentsQuery->where('gender', $gender);
        }
        $totalStudents = $studentsQuery->count();
        if ($totalStudents === 0) {
            return response()->json(['trend' => []]);
        }
        $studentIds = $section ? $studentsQuery->pluck('id')->toArray() : null;
        $days = 14;
        $trend = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $attendanceQuery = Attendance::whereDate('attendance_date', $date);
            if ($studentIds !== null) {
                $attendanceQuery->whereIn('student_id', $studentIds);
            }
            $present = $attendanceQuery->count();
            $trend[] = [
                'date' => $date,
                'present' => $present,
                'rate' => round(($present / $totalStudents) * 100, 1),
            ];
        }
        return response()->json(['trend' => $trend, 'total_students' => $totalStudents]);
    }
}
