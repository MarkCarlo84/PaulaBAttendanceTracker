<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
class AttendanceController extends Controller
{
    public static function getRolloverHour(): int
    {
        $setting = \App\Models\Setting::where('key', 'rollover_hour')->value('value');
        return $setting !== null ? (int) $setting : 17;
    }

    public static function getSchoolDay(): Carbon
    {
        $rollover = static::getRolloverHour();
        $now = Carbon::now();
        $cutoff = Carbon::today()->setHour($rollover)->setMinute(0)->setSecond(0);
        return $now->greaterThanOrEqualTo($cutoff) ? Carbon::tomorrow() : Carbon::today();
    }

    public function scan(Request $request)
    {
        if ($request->has('student_id') && !$request->has('qr_data')) {
            $request->validate(['student_id' => 'required|string']);
            $student = Student::where('student_id', $request->student_id)->first();
            if (!$student) {
                return response()->json(['message' => 'Student not found'], 404);
            }
        } else {
            $request->validate(['qr_data' => 'required|json']);
            $qrData = json_decode($request->qr_data, true);
            if (!$qrData || !isset($qrData['uuid']) || !isset($qrData['student_id'])) {
                return response()->json(['message' => 'Invalid QR code data'], 422);
            }
            $student = Student::where('uuid', $qrData['uuid'])
                ->where('student_id', $qrData['student_id'])
                ->first();
            if (!$student) {
                return response()->json(['message' => 'Student not found'], 404);
            }
            if (isset($qrData['v']) && $qrData['v'] < ($student->qr_version ?? 0)) {
                return response()->json(['message' => 'Outdated QR code. Please use the latest QR code for this student.'], 422);
            }
        }
        $today = static::getSchoolDay()->toDateString();
        $existing = Attendance::where('student_id', $student->id)
            ->whereDate('attendance_date', $today)
            ->first();
        if ($existing) {
        return response()->json([
            'message' => 'Attendance already recorded today.',
            'school_day' => $today,
            'student' => [
                    'name' => $student->full_name,
                    'student_id' => $student->student_id,
                    'section' => $student->section,
                ],
                'attendance' => $existing,
            ]);
        }
        $attendance = Attendance::create([
            'student_id' => $student->id,
            'attendance_date' => $today,
            'time_in' => Carbon::now()->toTimeString(),
            'status' => 'PRESENT',
            'remarks' => $request->input('remarks'),
        ]);
        return response()->json([
            'message' => 'Attendance recorded successfully',
            'school_day' => $today,
            'student' => [
                'name' => $student->full_name,
                'student_id' => $student->student_id,
                'section' => $student->section,
            ],
            'attendance' => $attendance,
        ], 201);
    }
    public function today(Request $request)
    {
        $today = static::getSchoolDay()->toDateString();
        $section = $request->input('section');
        $gender = $request->input('gender');
        $perPage = (int) $request->input('per_page', 10);
        $page = (int) $request->input('page', 1);

        $studentsQuery = Student::query();
        if ($section) {
            $studentsQuery->where('section', $section);
        }
        if ($gender) {
            $studentsQuery->where('gender', $gender);
        }
        $totalStudents = $studentsQuery->count();

        $allRecords = Attendance::whereDate('attendance_date', $today)
            ->with('student')
            ->orderByRaw("CASE WHEN status = 'PRESENT' THEN 0 WHEN status = 'LATE' THEN 1 ELSE 2 END")
            ->orderBy('time_in', 'desc');
        if ($section) {
            $allRecords->whereHas('student', function ($q) use ($section) {
                $q->where('section', $section);
            });
        }
        if ($gender) {
            $allRecords->whereHas('student', function ($q) use ($gender) {
                $q->where('gender', $gender);
            });
        }
        $allRecords = $allRecords->get();
        $totalRecords = $allRecords->count();

        $offset = ($page - 1) * $perPage;
        $paginated = $allRecords->slice($offset, $perPage)->values();

        $sections = Student::select('section')->distinct()->whereNotNull('section')->pluck('section')->sort()->values();

        $presentCount = $allRecords->where('status', 'PRESENT')->count();
        $absentCount = $allRecords->where('status', 'ABSENT')->count();
        $lateCount = $allRecords->where('status', 'LATE')->count();

        return response()->json([
            'attendances' => $paginated,
            'date' => $today,
            'school_day' => $today,
            'rollover_hour' => static::getRolloverHour(),
            'totals' => [
                'present' => $presentCount,
                'absent' => $absentCount,
                'late' => $lateCount,
                'total' => $totalStudents,
            ],
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalRecords,
                'last_page' => max(1, (int) ceil($totalRecords / $perPage)),
            ],
            'sections' => $sections,
            'total_by_section' => $section ? null : Student::selectRaw('section, count(*) as count')->whereNotNull('section')->groupBy('section')->pluck('count', 'section'),
        ]);
    }
    public function report(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);
        $dateFrom = $request->input('date_from', Carbon::today()->toDateString());
        $dateTo = $request->input('date_to', Carbon::today()->toDateString());
        $query = Attendance::with('student')
            ->whereBetween('attendance_date', [$dateFrom, $dateTo]);
        if ($request->filled('section')) {
            $section = $request->section;
            $query->whereHas('student', function ($q) use ($section) {
                $q->where('section', $section);
            });
        }
        if ($request->filled('gender')) {
            $gender = $request->gender;
            $query->whereHas('student', function ($q) use ($gender) {
                $q->where('gender', $gender);
            });
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_id', 'like', "%{$search}%");
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $perPage = (int) $request->input('per_page', 50);
        $attendances = $query->orderBy('attendance_date', 'desc')
            ->orderBy('time_in', 'desc')
            ->paginate($perPage);
        $summary = [
            'total_records' => (clone $query)->count(),
            'present' => (clone $query)->where('status', 'PRESENT')->count(),
            'absent' => (clone $query)->where('status', 'ABSENT')->count(),
            'late' => (clone $query)->where('status', 'LATE')->count(),
        ];
        return response()->json([
            'attendances' => $attendances,
            'summary' => $summary,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ]);
    }
    public function exportCsv(Request $request)
    {
        $dateFrom = $request->input('date_from', Carbon::today()->toDateString());
        $dateTo = $request->input('date_to', Carbon::today()->toDateString());
        $attendances = Attendance::with('student')
            ->whereBetween('attendance_date', [$dateFrom, $dateTo])
            ->when($request->filled('section'), fn($q) => $q->whereHas('student', fn($q) => $q->where('section', $request->section)))
            ->when($request->filled('gender'), fn($q) => $q->whereHas('student', fn($q) => $q->where('gender', $request->gender)))
            ->orderBy('attendance_date', 'desc')
            ->orderBy('time_in', 'desc')
            ->get();
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $headers = ['Student ID', 'Name', 'Section', 'Date', 'Time In', 'Status', 'Remarks'];
        $colLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        foreach ($colLetters as $i => $col) {
            $sheet->setCellValue($col . '1', $headers[$i]);
        }
        $row = 2;
        foreach ($attendances as $attendance) {
            $sheet->setCellValue('A' . $row, $attendance->student->student_id ?? '');
            $sheet->setCellValue('B' . $row, $attendance->student->full_name ?? '');
            $sheet->setCellValue('C' . $row, $attendance->student->section ?? '');
            $sheet->setCellValue('D' . $row, $attendance->attendance_date);
            $sheet->setCellValue('E' . $row, $attendance->time_in);
            $sheet->setCellValue('F' . $row, $attendance->status);
            $sheet->setCellValue('G' . $row, $attendance->remarks);
            $row++;
        }
        foreach ($colLetters as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();
        return response($content, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="attendance_report.xlsx"',
        ]);
    }
    public function mark(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer|exists:students,id',
            'status' => 'required|in:PRESENT,ABSENT,LATE',
            'remarks' => 'nullable|string|max:500',
        ]);
        $today = Carbon::today()->toDateString();
        $existing = Attendance::where('student_id', $request->student_id)
            ->whereDate('attendance_date', $today)
            ->first();
        if ($existing) {
            $existing->update([
                'status' => $request->status,
                'remarks' => $request->input('remarks', $existing->remarks),
            ]);
            return response()->json($existing);
        }
        $attendance = Attendance::create([
            'student_id' => $request->student_id,
            'attendance_date' => $today,
            'time_in' => Carbon::now()->toTimeString(),
            'status' => $request->status,
            'remarks' => $request->input('remarks'),
        ]);
        return response()->json($attendance, 201);
    }
    public function bulkMark(Request $request)
    {
        $request->validate([
            'section' => 'required|string',
            'status' => 'required|in:PRESENT,ABSENT,LATE',
            'date' => 'nullable|date',
            'remarks' => 'nullable|string|max:500',
        ]);
        $date = $request->input('date', Carbon::today()->toDateString());
        $students = Student::where('section', $request->section)->get();
        $count = 0;
        foreach ($students as $student) {
            Attendance::updateOrCreate(
                ['student_id' => $student->id, 'attendance_date' => $date],
                [
                    'time_in' => Carbon::now()->toTimeString(),
                    'status' => $request->status,
                    'remarks' => $request->input('remarks'),
                ]
            );
            $count++;
        }
        return response()->json(['message' => "{$count} attendance records created/updated.", 'count' => $count]);
    }
}
