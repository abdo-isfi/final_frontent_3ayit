<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ExcelImportService;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;

class ApiController extends Controller
{
    protected $excelImportService;

    public function __construct(ExcelImportService $excelImportService)
    {
        $this->excelImportService = $excelImportService;
        
        // Explicitly disable CSRF verification for this controller
        $this->middleware(function ($request, $next) {
            app()->instance(VerifyCsrfToken::class, new class extends VerifyCsrfToken {
                public function handle($request, \Closure $next)
                {
                    return $next($request);
                }
            });
            return $next($request);
        });
    }

    /**
     * Handle Excel file upload from the React frontend
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadExcel(Request $request)
    {
        try {
            Log::info('API Excel upload initiated');
            
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $file = $request->file('file');
            $filename = 'uploaded_trainees_' . time() . '.' . $file->getClientOriginalExtension();
            
            // Make uploads directory
            $uploadDir = storage_path('app/uploads');
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            // Store file using PHP copy
            $tempPath = $file->getRealPath();
            $destinationPath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
            
            if (copy($tempPath, $destinationPath)) {
                Log::info("File successfully copied to: $destinationPath");
                
                // Normalize path separators
                $fullPath = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $destinationPath);
                
                // Clear previous data to ensure we start fresh
                try {
                    // IMPORTANT: Truncate all related tables to start fresh
                    DB::statement('SET FOREIGN_KEY_CHECKS=0');
                    
                    // Truncate trainees table
                    DB::table('trainees')->truncate();
                    Log::info("Truncated trainees table before import");
                    
                    // Also truncate absences table if it exists
                    if (Schema::hasTable('absences')) {
                        DB::table('absences')->truncate();
                        Log::info("Truncated absences table before import");
                    }
                    
                    // Also truncate other related tables if needed
                    if (Schema::hasTable('students')) {
                        DB::table('students')->truncate();
                        Log::info("Truncated students table before import");
                    }
                    
                    if (Schema::hasTable('dropouts')) {
                        DB::table('dropouts')->truncate();
                        Log::info("Truncated dropouts table before import");
                    }
                    
                    DB::statement('SET FOREIGN_KEY_CHECKS=1');
                } catch (\Exception $e) {
                    Log::warning("Failed to truncate tables: " . $e->getMessage());
                }
                
                // Import the data
                $importResult = $this->excelImportService->importTraineesFromExcel($fullPath);
                
                if ($importResult !== false) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Excel file successfully imported. All absence counts have been reset to 0.',
                        'data' => $importResult,
                        'count' => count($importResult)
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to import Excel data'
                    ], 500);
                }
            } else {
                Log::error("Failed to copy file from $tempPath to $destinationPath");
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to store the uploaded file'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('API Excel upload exception: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }
} 