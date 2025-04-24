<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Redirect;
use App\Services\ExcelImportService;

class TestController extends Controller
{
    protected $excelImportService;

    public function __construct(ExcelImportService $excelImportService)
    {
        $this->excelImportService = $excelImportService;
    }

    /**
     * Simple test endpoint
     */
    public function test()
    {
        return view('test');
    }
    
    /**
     * Test file upload endpoint
     */
    public function fileUploadTest(Request $request)
    {
        // Add all possible CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, X-XSRF-TOKEN');
        header('Access-Control-Allow-Credentials: true');
        
        // Log the request for debugging
        Log::info('Test upload request received', [
            'method' => $request->method(),
            'has_file' => $request->hasFile('file'),
            'headers' => $request->header()
        ]);
        
        // Handle OPTIONS preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        // Process file upload
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Get file info
            $name = $file->getClientOriginalName();
            $size = $file->getSize();
            $type = $file->getMimeType();
            
            // Simple validation
            if (!$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload failed: ' . $file->getErrorMessage()
                ], 400);
            }
            
            try {
                // Store the file
                $path = $file->store('test_uploads', 'local');
                
                Log::info("Test file uploaded successfully", [
                    'name' => $name,
                    'size' => $size,
                    'type' => $type,
                    'path' => $path
                ]);
                
                // Return success response
                return response()->json([
                    'success' => true,
                    'message' => 'File uploaded successfully',
                    'file_info' => [
                        'name' => $name,
                        'size' => $size,
                        'type' => $type,
                        'stored_path' => $path
                    ]
                ]);
            } catch (\Exception $e) {
                Log::error("Test file upload error: " . $e->getMessage());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Error storing file: ' . $e->getMessage()
                ], 500);
            }
        }
        
        return response()->json([
            'success' => false,
            'message' => 'No file uploaded'
        ], 400);
    }
    
    /**
     * Special fallback method that accepts any POST request
     * and handles it with minimal dependencies
     */
    public function fallbackUpload(Request $request)
    {
        // Disable CSRF for this request
        $request->session()->forget('_token');
        
        // Add all possible CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization, X-XSRF-TOKEN');
        header('Access-Control-Allow-Credentials: true');
        
        // Log all request details
        Log::info('FALLBACK UPLOAD', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'has_file' => $request->hasFile('file'),
            'all_files' => $_FILES,
            'all_inputs' => $request->all(),
            'headers' => $request->header()
        ]);
        
        // Handle OPTIONS preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
        
        $response = [
            'success' => false,
            'fallback' => true,
            'message' => 'No file detected',
            'request_data' => [
                'method' => $request->method(),
                'inputs' => $request->all(),
                'files' => count($_FILES) > 0,
                'files_data' => $_FILES,
            ]
        ];
        
        // Process file upload if exists
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Get file info
            $response['file_detected'] = true;
            $response['file_info'] = [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
                'valid' => $file->isValid(),
                'error' => $file->getError()
            ];
            
            try {
                // Try to store the file with minimal dependencies
                $uploadDir = storage_path('app/fallback_uploads');
                
                // Create directory if it doesn't exist
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Generate a unique filename
                $filename = uniqid() . '_' . $file->getClientOriginalName();
                $path = $uploadDir . '/' . $filename;
                
                // Move the file
                if (copy($file->getRealPath(), $path)) {
                    $response['success'] = true;
                    $response['message'] = 'File uploaded successfully';
                    $response['stored_path'] = $path;
                } else {
                    $response['message'] = 'Failed to copy file';
                }
            } catch (\Exception $e) {
                Log::error("Fallback upload error: " . $e->getMessage());
                $response['message'] = 'Error: ' . $e->getMessage();
                $response['trace'] = $e->getTraceAsString();
            }
        }
        
        return response()->json($response);
    }
} 