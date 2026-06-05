<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\QrCodeService;
use Illuminate\Http\Request;
class QrCodeController extends Controller
{
    protected $qrCodeService;
    public function __construct(QrCodeService $qrCodeService)
    {
        $this->qrCodeService = $qrCodeService;
    }
    public function show($id)
    {
        $student = Student::findOrFail($id);
        $qrData = $this->qrCodeService->getQrCodeData($student);
        return response()->json($qrData);
    }
    public function regenerate($id)
    {
        $student = Student::findOrFail($id);
        $this->qrCodeService->delete($student);
        $student->qr_version = ($student->qr_version ?? 0) + 1;
        $student->qr_code_path = $this->qrCodeService->generate($student);
        $student->save();
        $qrData = $this->qrCodeService->getQrCodeData($student);
        return response()->json($qrData);
    }
    public function all()
    {
        $students = Student::all();
        $qrCodes = $students->map(function ($student) {
            return $this->qrCodeService->getQrCodeData($student);
        });
        return response()->json($qrCodes);
    }
}
