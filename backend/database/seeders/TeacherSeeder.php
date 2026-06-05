<?php
namespace Database\Seeders;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        Teacher::firstOrCreate(
            ['email' => 'teacher@school.com'],
            ['name' => 'Teacher', 'password' => Hash::make('password')]
        );
    }
}
