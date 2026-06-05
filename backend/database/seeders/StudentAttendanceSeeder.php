<?php
namespace Database\Seeders;

use App\Models\Student;
use App\Models\Section;
use App\Models\Attendance;
use App\Services\QrCodeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StudentAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $sections = ['Diamond', 'Ruby', 'Emerald', 'Sapphire'];

        $firstNames = [
            'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Luisa', 'Carlos', 'Elena', 'Miguel', 'Sofia',
            'Antonio', 'Isabella', 'Francisco', 'Carmen', 'Manuel', 'Angela', 'Ramon', 'Teresa', 'Victor', 'Rosa',
            'Eduardo', 'Luz', 'Fernando', 'Lourdes', 'Ricardo', 'Gloria', 'Alberto', 'Martha', 'Luis', 'Clara',
            'Jorge', 'Dolores', 'Raul', 'Julia', 'Oscar', 'Cristina', 'Rolando', 'Merced', 'Daniel', 'Leticia',
            'Mario', 'Guadalupe', 'Cesar', 'Adela', 'Rafael', 'Estela', 'Arturo', 'Florencia', 'Enrique', 'Magdalena',
            'Rodrigo', 'Marilou', 'Benigno', 'Vilma', 'Gerardo', 'Nenita', 'Felipe', 'Corazon', 'Julio', 'Aurora',
            'Romeo', 'Luzviminda', 'Rudy', 'Milagros', 'Allan', 'Rosario', 'Edwin', 'Evelyn', 'Dante', 'Imelda',
            'Rogelio', 'Zenaida', 'Gregorio', 'Adoracion', 'Roberto', 'Lilibeth', 'Celso', 'Loreta', 'Nelson', 'Remedios',
            'Gilbert', 'Nieves', 'Adrian', 'Perlita', 'Elmer', 'Visitacion', 'Dennis', 'Cecilia', 'Reynaldo', 'Belinda',
            'Emilio', 'Consuelo', 'Teodoro', 'Natividad', 'Bonifacio', 'Concepcion', 'Alfredo', 'Rufina', 'Dominador', 'Apolonia',
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Aquino', 'Flores', 'Gonzales', 'Perez',
            'Villanueva', 'Navarro', 'De Leon', 'Lopez', 'Fernandez', 'Martinez', 'Rodriguez', 'Romero', 'Torres', 'Rivera',
            'Dela Cruz', 'Castillo', 'Diaz', 'Santiago', 'Ramos', 'Alcantara', 'Moreno', 'Gutierrez', 'Vargas', 'Miranda',
            'Magsaysay', 'Macapagal', 'Pascual', 'Domingo', 'Jimenez', 'Castro', 'Luna', 'Salazar', 'Beltran', 'Valdez',
            'Velasco', 'Molina', 'Sarmiento', 'Estrada', 'Mercado', 'Villa', 'Ramirez', 'Padilla', 'Ortega', 'Suarez',
        ];

        $qrService = new QrCodeService();

        $allGenders = ['Male', 'Female'];

        $studentCount = 0;
        foreach ($sections as $sectionName) {
            Section::firstOrCreate(['name' => $sectionName]);

            for ($i = 0; $i < 50; $i++) {
                $studentCount++;
                $studentId = '2026' . str_pad($studentCount, 4, '0', STR_PAD_LEFT);
                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                $middleName = rand(0, 1) ? $firstNames[array_rand($firstNames)] : null;
                $gender = $allGenders[array_rand($allGenders)];

                $student = Student::create([
                    'uuid' => (string) Str::uuid(),
                    'student_id' => $studentId,
                    'first_name' => $firstName,
                    'middle_name' => $middleName,
                    'last_name' => $lastName,
                    'section' => $sectionName,
                    'gender' => $gender,
                ]);

                $student->qr_code_path = $qrService->generate($student);
                $student->save();
            }
        }

        $this->command->info("Created {$studentCount} students across " . count($sections) . " sections.");

        $allStudents = Student::all();
        $statuses = ['PRESENT', 'ABSENT', 'LATE'];
        $remarksOptions = ['', 'On time', 'Traffic', 'Sick', 'Personal reason', 'Family emergency', 'Doctor appointment', 'N/A'];

        $startDate = now()->subWeekdays(20);
        $dates = [];
        for ($d = clone $startDate; $d->lte(now()->subDay()); $d->addDay()) {
            if ($d->isWeekday()) {
                $dates[] = $d->format('Y-m-d');
            }
        }

        $attendanceCount = 0;
        foreach ($allStudents as $student) {
            $absenceRate = rand(5, 20) / 100;
            $lateRate = rand(5, 15) / 100;

            foreach ($dates as $date) {
                $rand = rand(1, 100) / 100;

                if ($rand < $absenceRate) {
                    $status = 'ABSENT';
                    $timeIn = '00:00:00';
                    $remarks = $remarksOptions[array_rand($remarksOptions)];
                } elseif ($rand < $absenceRate + $lateRate) {
                    $status = 'LATE';
                    $hour = rand(8, 9);
                    $minute = rand(0, 59);
                    $timeIn = sprintf('%02d:%02d:00', $hour, $minute);
                    $remarks = $remarksOptions[array_rand($remarksOptions)];
                } else {
                    $status = 'PRESENT';
                    $hour = rand(6, 7);
                    $minute = rand(0, 59);
                    $timeIn = sprintf('%02d:%02d:00', $hour, $minute);
                    $remarks = '';
                }

                Attendance::create([
                    'student_id' => $student->id,
                    'attendance_date' => $date,
                    'time_in' => $timeIn,
                    'status' => $status,
                    'remarks' => $remarks,
                ]);
                $attendanceCount++;
            }
        }

        $this->command->info("Created {$attendanceCount} attendance records across " . count($dates) . " school days.");
    }
}
