<?php
namespace App\Services;
use App\Models\Student;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Storage;
class QrCodeService
{
    public function generate(Student $student): string
    {
        $data = json_encode([
            'uuid' => $student->uuid,
            'student_id' => $student->student_id,
            'v' => $student->qr_version ?? 0,
        ]);
        $renderer = new ImageRenderer(
            new RendererStyle(400),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($data);
        $filename = 'qrcodes/' . $student->uuid . '.svg';
        Storage::disk('public')->put($filename, $svg);
        return $filename;
    }
    public function getQrCodeData(Student $student): array
    {
        $data = json_encode([
            'uuid' => $student->uuid,
            'student_id' => $student->student_id,
            'v' => $student->qr_version ?? 0,
        ]);
        $svgUrl = Storage::disk('public')->exists($student->qr_code_path)
            ? url('storage/' . $student->qr_code_path)
            : null;
        return [
            'student_id' => $student->id,
            'student_name' => $student->full_name,
            'data' => $data,
            'svg_url' => $svgUrl,
            'uuid' => $student->uuid,
            'qr_version' => $student->qr_version ?? 0,
        ];
    }
    public function delete(Student $student): void
    {
        if ($student->qr_code_path && Storage::disk('public')->exists($student->qr_code_path)) {
            Storage::disk('public')->delete($student->qr_code_path);
        }
    }
}
