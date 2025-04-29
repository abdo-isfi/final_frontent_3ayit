<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\GroupController;
use App\Http\Controllers\API\TraineeController;
use App\Http\Controllers\API\AbsenceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Public API routes accessible without authentication
Route::get('/status', function() {
    return response()->json([
        'status' => 'ok',
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString(),
        'cors' => 'enabled'
    ]);
});

// Test route for CORS
Route::options('/test-cors', function() {
    return response()->json(['message' => 'CORS is working!']);
});

// Group routes
Route::apiResource('groups', GroupController::class);
Route::get('groups/{group}/trainees', [GroupController::class, 'trainees']);

// Trainee routes
Route::apiResource('trainees', TraineeController::class);
Route::get('trainees/{trainee}/absences', [TraineeController::class, 'absences']);
Route::get('trainees/{trainee}/statistics', [TraineeController::class, 'statistics']);
Route::post('trainees/bulk-import', [TraineeController::class, 'bulkImport']);

// Absence routes
Route::apiResource('absences', AbsenceController::class);
Route::get('groups/{group}/absences', [AbsenceController::class, 'groupAbsences']);
Route::post('absences/validate', [AbsenceController::class, 'validateAbsences']);
Route::post('absences/justify', [AbsenceController::class, 'justifyAbsences']);
Route::patch('absences/{absence}/billet-entree', [AbsenceController::class, 'markBilletEntree']);
Route::get('groups/{group}/weekly-report', [AbsenceController::class, 'weeklyReport']); 