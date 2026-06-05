<?php
namespace Database\Seeders;
use App\Models\Student;
use App\Services\QrCodeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $sections = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];
        $firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Luisa', 'Carlos', 'Sofia', 'Miguel', 'Isabella', 'Antonio', 'Carmen', 'Ramon', 'Elena', 'Francisco', 'Teresa', 'Manuel', 'Rosa', 'Jorge', 'Martha', 'Ricardo', 'Luz', 'Eduardo', 'Lilia', 'Fernando', 'Gloria', 'Alberto', 'Cecilia', 'Raul', 'Monica', 'Luis', 'Clara', 'Javier', 'Rita', 'Hector', 'Aurora', 'Pablo', 'Nora', 'Sergio', 'Olga', 'Diego', 'Alicia', 'Marcos', 'Lourdes', 'Angel', 'Leticia', 'Rafael', 'Sara', 'Adrian', 'Patricia'];
        $lastNames = ['Cruz', 'Santos', 'Reyes', 'Gonzales', 'Mendoza', 'Garcia', 'Martinez', 'Lopez', 'Fernandez', 'Torres', 'Rivera', 'Morales', 'Ramos', 'Delgado', 'Castillo', 'Villanueva', 'Paredes', 'Aquino', 'Dizon', 'Manalo', 'Navarro', 'Salazar', 'Bautista', 'Luna', 'Velasco', 'Romero', 'Dela Cruz', 'Aguilar', 'Mercado', 'Tolentino', 'De Leon', 'Vergara', 'Silva', 'Pascual', 'Estrada', 'Cortez', 'Domingo', 'Gutierrez', 'Santiago', 'Lara', 'Padilla', 'Rosario', 'Villa', 'Miranda', 'Solís', 'Medina', 'Corpus', 'Fajardo', 'Burgos', 'Valdez'];
        $middleNames = [null, null, null, 'Dela', 'Luna', 'Ramos', null, null, 'M.', 'D.', 'S.', null, null, 'A.', 'B.', null, null, 'C.', 'E.', null, 'F.', null, 'G.', null, 'H.', null, 'I.', null, 'J.', null, 'K.', null, 'L.', null, 'N.', null, 'O.', null, 'P.', null, 'Q.', null, 'R.', null, 'S.', null, 'T.', null, 'U.', null];

        $qrService = new QrCodeService();
        $count = 1;

        foreach ($sections as $section) {
            $studentsInSection = ($section === 'Grade 11-B') ? 50 : 50;

            for ($i = 0; $i < $studentsInSection; $i++) {
                $studentId = str_pad(20260000 + $count, 8, '0', STR_PAD_LEFT);
                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                $middleName = $middleNames[array_rand($middleNames)];

                $data = [
                    'uuid' => (string) Str::uuid(),
                    'student_id' => $studentId,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'section' => $section,
                ];

                $student = Student::firstOrCreate(
                    ['student_id' => $data['student_id']],
                    $data
                );

                if (!$student->qr_code_path) {
                    $student->qr_code_path = $qrService->generate($student);
                    $student->save();
                }

                $count++;
            }
        }
    }
}
