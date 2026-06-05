<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->date('attendance_date');
            $table->time('time_in');
            $table->enum('status', ['PRESENT'])->default('PRESENT');
            $table->timestamps();
            $table->unique(['student_id', 'attendance_date']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
