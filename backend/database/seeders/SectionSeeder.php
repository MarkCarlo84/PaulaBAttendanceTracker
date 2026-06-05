<?php
namespace Database\Seeders;
use App\Models\Section;
use Illuminate\Database\Seeder;
class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = ['Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 11-B'];
        foreach ($sections as $name) {
            Section::firstOrCreate(['name' => $name]);
        }
    }
}
