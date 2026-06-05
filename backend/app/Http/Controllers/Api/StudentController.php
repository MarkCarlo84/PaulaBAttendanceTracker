<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Section;
use App\Models\Student;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
class StudentController extends Controller
{
    protected $qrCodeService;
    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }
    public function index(Request $request)
    {
        $query = Student::query();
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }
        if ($request->section) {
            $query->where('section', $request->section);
        }
        if ($request->gender) {
            $query->where('gender', $request->gender);
        }
        $perPage = $request->per_page ? (int) $request->per_page : null;
        if ($perPage) {
            return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|unique:students,student_id',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'section' => 'required|string|max:255',
            'gender' => 'nullable|in:Male,Female',
        ]);
        $validated['uuid'] = (string) Str::uuid();
        $student = Student::create($validated);
        $student->qr_code_path = $this->qrCodeService->generate($student);
        $student->save();
        Section::firstOrCreate(['name' => $validated['section']]);
        return response()->json($student, 201);
    }
    public function show($id)
    {
        $student = Student::findOrFail($id);
        $student->qr_code = $this->qrCodeService->getQrCodeData($student);
        return response()->json($student);
    }
    public function update(Request $request, $id)
    {
        $student = Student::findOrFail($id);
        $validated = $request->validate([
            'student_id' => 'required|unique:students,student_id,' . $id,
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'section' => 'required|string|max:255',
            'gender' => 'nullable|in:Male,Female',
        ]);
        $student->update($validated);
        Section::firstOrCreate(['name' => $validated['section']]);
        return response()->json($student);
    }
    public function destroy($id)
    {
        $student = Student::findOrFail($id);
        $this->qrCodeService->delete($student);
        $student->delete();
        return response()->json(['message' => 'Student deleted successfully']);
    }
    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);
        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);
        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $line = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            $data = array_combine($header, $row);
            try {
                $validator = validator($data, [
                    'student_id' => 'required|string|max:255',
                    'first_name' => 'required|string|max:255',
                    'last_name' => 'required|string|max:255',
                    'section' => 'required|string|max:255',
                    'gender' => 'nullable|in:Male,Female',
                ]);
                if ($validator->fails()) {
                    $errors[] = "Line {$line}: " . implode(', ', $validator->errors()->all());
                    continue;
                }
                $existing = Student::where('student_id', $data['student_id'])->first();
                if ($existing) {
                    $changed = false;
                    foreach (['first_name', 'middle_name', 'last_name', 'section', 'gender'] as $field) {
                        $csvValue = $data[$field] ?? null;
                        if ($csvValue !== $existing->$field) {
                            $existing->$field = $csvValue;
                            $changed = true;
                        }
                    }
                    if ($changed) {
                        $existing->save();
                        Section::firstOrCreate(['name' => $data['section']]);
                        $updated++;
                    } else {
                        $skipped++;
                    }
                } else {
                    $student = Student::create([
                        'uuid' => (string) Str::uuid(),
                        'student_id' => $data['student_id'],
                        'first_name' => $data['first_name'],
                        'middle_name' => $data['middle_name'] ?? null,
                        'last_name' => $data['last_name'],
                        'section' => $data['section'],
                        'gender' => $data['gender'] ?? null,
                    ]);
                    $student->qr_code_path = $this->qrCodeService->generate($student);
                    $student->save();
                    Section::firstOrCreate(['name' => $data['section']]);
                    $imported++;
                }
            } catch (\Exception $e) {
                $errors[] = "Line {$line}: " . $e->getMessage();
            }
        }
        fclose($handle);
        $parts = [];
        if ($imported) $parts[] = "{$imported} new student(s)";
        if ($updated) $parts[] = "{$updated} updated";
        if ($skipped) $parts[] = "{$skipped} unchanged (skipped)";
        return response()->json([
            'message' => implode(', ', $parts) . ' successfully',
            'imported' => $imported,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:students,id',
        ]);
        $ids = $request->ids;
        $students = Student::whereIn('id', $ids)->get();
        foreach ($students as $student) {
            $this->qrCodeService->delete($student);
            $student->delete();
        }
        return response()->json(['message' => 'Deleted ' . count($ids) . ' students']);
    }
    public function attendanceHistory($id)
    {
        $student = Student::findOrFail($id);
        $records = Attendance::where('student_id', $student->id)
            ->orderBy('attendance_date', 'desc')
            ->limit(50)
            ->get();
        return response()->json($records);
    }
    public function export()
    {
        $students = Student::all();
        return response()->stream(function () use ($students) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['student_id', 'first_name', 'middle_name', 'last_name', 'section', 'gender']);
            foreach ($students as $student) {
                fputcsv($handle, [
                    $student->student_id,
                    $student->first_name,
                    $student->middle_name,
                    $student->last_name,
                    $student->section,
                    $student->gender ?? '',
                ]);
            }
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="students.csv"',
        ]);
    }
}
