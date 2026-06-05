<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('attendances_new');

        DB::statement("CREATE TABLE attendances_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            student_id INTEGER NOT NULL,
            attendance_date DATE NOT NULL,
            time_in TIME NOT NULL,
            status VARCHAR CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')) NOT NULL DEFAULT 'PRESENT',
            created_at DATETIME,
            updated_at DATETIME,
            remarks TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )");

        $columns = Schema::hasColumn('attendances', 'remarks')
            ? 'id, student_id, attendance_date, time_in, status, created_at, updated_at, remarks'
            : 'id, student_id, attendance_date, time_in, status, created_at, updated_at';

        DB::statement("INSERT INTO attendances_new SELECT {$columns} FROM attendances");

        DB::statement("DROP TABLE attendances");

        DB::statement("ALTER TABLE attendances_new RENAME TO attendances");

        try {
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS attendances_student_id_attendance_date_unique ON attendances (student_id, attendance_date)");
        } catch (\Exception $e) {}
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances_new');

        DB::statement("CREATE TABLE attendances_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            student_id INTEGER NOT NULL,
            attendance_date DATE NOT NULL,
            time_in TIME NOT NULL,
            status VARCHAR CHECK (status IN ('PRESENT')) NOT NULL DEFAULT 'PRESENT',
            created_at DATETIME,
            updated_at DATETIME,
            remarks TEXT,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )");

        $columns = Schema::hasColumn('attendances', 'remarks')
            ? 'id, student_id, attendance_date, time_in, status, created_at, updated_at, remarks'
            : 'id, student_id, attendance_date, time_in, status, created_at, updated_at';

        DB::statement("INSERT INTO attendances_new SELECT {$columns} FROM attendances");
        DB::statement("DROP TABLE attendances");
        DB::statement("ALTER TABLE attendances_new RENAME TO attendances");
    }
};
