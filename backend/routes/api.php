<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\SettingController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/attendance/scan', [AttendanceController::class, 'scan']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/trend', [DashboardController::class, 'trend']);

    Route::post('/students/bulk-import', [StudentController::class, 'bulkImport']);
    Route::post('/students/bulk-delete', [StudentController::class, 'bulkDelete']);
    Route::get('/students/export/csv', [StudentController::class, 'export']);
    Route::get('/students/{id}/attendance', [StudentController::class, 'attendanceHistory']);
    Route::resource('students', StudentController::class);

    Route::get('/students/{id}/qr', [QrCodeController::class, 'show']);
    Route::post('/students/{id}/regenerate-qr', [QrCodeController::class, 'regenerate']);
    Route::get('/qr-codes/all', [QrCodeController::class, 'all']);

    Route::get('/attendance/report', [AttendanceController::class, 'report']);
    Route::get('/attendance/export/xlsx', [AttendanceController::class, 'exportCsv']);
    Route::post('/attendance/mark', [AttendanceController::class, 'mark']);
    Route::post('/attendance/bulk-mark', [AttendanceController::class, 'bulkMark']);
    Route::get('/attendance/today', [AttendanceController::class, 'today']);

    Route::get('/sections', [SectionController::class, 'index']);
    Route::post('/sections', [SectionController::class, 'store']);
    Route::put('/sections/{id}', [SectionController::class, 'update']);
    Route::delete('/sections/{id}', [SectionController::class, 'destroy']);

    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'save']);
});
