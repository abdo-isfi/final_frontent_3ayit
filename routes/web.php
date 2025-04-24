<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TraineeController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\ApiController;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

// Define CORS headers function for consistent headers
function addCorsHeaders($response) {
    return $response->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN');
}

// Handle CORS preflight requests
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN')
        ->header('Access-Control-Max-Age', '1728000');
})->where('any', '.*');

Route::get('/', function () {
    return redirect('/test');
});

// Test routes
Route::get('/test', [TestController::class, 'test']);
Route::post('/test-upload', [TestController::class, 'fileUploadTest'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// API routes - no CSRF needed
Route::group([
    'prefix' => 'api',
    'middleware' => ['api'] // Use 'api' middleware instead of 'web' to avoid CSRF checks
], function () {
    Route::post('/upload-excel', [ApiController::class, 'uploadExcel'])
        ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);
    
    // Simple test route
    Route::get('/', function() {
        return addCorsHeaders(response()->json([
            'status' => 'success',
            'message' => 'API is working!'
        ]));
    });
    
    // Add more API routes here as needed
    
    // Route to get the latest imported trainees
    Route::get('/trainees/latest-import', function() {
        // Assuming we have an import_batch field or tracking the most recent imports
        // For a simple implementation, we'll just get the most recently added trainees
        $latestTrainees = DB::table('trainees')
                            ->orderBy('id', 'desc')
                            ->limit(100)  // Limit to the last 100 entries
                            ->get();
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'data' => $latestTrainees
        ]));
    });
    
    // Route to cancel/revert the latest import
    Route::post('/trainees/cancel-import', function() {
        try {
            // For demonstration purposes, we'll delete the most recent records
            // In a production environment, you would use a transaction ID or batch ID
            
            // Get the latest 100 IDs (or use a better identifier in production)
            $latestIds = DB::table('trainees')
                            ->orderBy('id', 'desc')
                            ->limit(100)
                            ->pluck('id');
            
            // Delete the records
            $deleted = DB::table('trainees')
                        ->whereIn('id', $latestIds)
                        ->delete();
            
            return addCorsHeaders(response()->json([
                'success' => true,
                'message' => "Importation annulée avec succès. $deleted enregistrements supprimés."
            ]));
        } catch (\Exception $e) {
            return addCorsHeaders(response()->json([
                'success' => false,
                'message' => "Erreur lors de l'annulation: " . $e->getMessage()
            ], 500));
        }
    });
});

// Special route for direct Excel upload without middleware
Route::post('/upload-excel-direct', [ApiController::class, 'uploadExcel'])
    ->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Add a simple test route that returns upload status with CORS headers
Route::get('/test-api-status', function() {
    return addCorsHeaders(response()->json([
        'status' => 'ok',
        'upload_dir_exists' => file_exists(storage_path('app/uploads')),
        'upload_dir_writable' => is_writable(storage_path('app/uploads')),
        'php_version' => PHP_VERSION,
        'max_upload_size' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size')
    ]));
});

// Route for testing uploads - this is the working route
Route::get('/test', function() {
    // Return a simple HTML page with upload form that works
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Upload</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                line-height: 1.6;
            }
            h1 { 
                color: #333;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            .upload-form { 
                border: 1px solid #ddd; 
                padding: 20px; 
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                background-color: #fff;
            }
            .info { 
                background: #f0f8ff; 
                padding: 15px; 
                border-radius: 5px; 
                margin-bottom: 20px;
                border-left: 4px solid #007bff;
            }
            .success {
                background: #d4edda;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                border-left: 4px solid #28a745;
                color: #155724;
            }
            .error {
                background: #f8d7da;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
                border-left: 4px solid #dc3545;
                color: #721c24;
            }
            button {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 10px;
            }
            button:hover {
                background-color: #0069d9;
            }
            .file-input {
                margin: 15px 0;
            }
            .file-input input {
                padding: 10px;
                width: 100%;
                max-width: 300px;
            }
            .instructions {
                background: #fff8e1;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #ffc107;
            }
        </style>
    </head>
    <body>
        <h1>Test d\'Importation de Fichier</h1>
        
        <div class="info">
            <h3>Pourquoi cette page fonctionne:</h3>
            <p>Cette page est servie directement depuis le backend Laravel et utilise le point d\'accès <code>/fallback-upload</code> qui est spécialement configuré pour ignorer la vérification CSRF et gérer les problèmes CORS.</p>
        </div>
        
        <div class="instructions">
            <h3>Instructions:</h3>
            <ol>
                <li>Sélectionnez un fichier Excel (.xlsx ou .xls) contenant les données des stagiaires</li>
                <li>Cliquez sur le bouton "Envoyer le fichier"</li>
                <li>Après un téléchargement réussi, vous serez redirigé vers la page de gestion des stagiaires</li>
            </ol>
        </div>
        
        <div class="upload-form">
            <h2>Importer la Liste des Stagiaires</h2>
            
            <form action="/fallback-upload" method="post" enctype="multipart/form-data">
                <div class="file-input">
                    <label for="file-upload">Sélectionnez votre fichier Excel:</label><br>
                    <input id="file-upload" type="file" name="file" accept=".xlsx,.xls" required>
                </div>
                
                <button type="submit">Envoyer le fichier</button>
            </form>
        </div>
        
        <div style="margin-top: 30px;">
            <a href="http://localhost:3001/admin" style="color: #007bff; text-decoration: none;">
                &larr; Retour à l\'interface d\'administration
            </a>
        </div>
        
        <script>
            // Simple validation
            document.querySelector("form").addEventListener("submit", function(e) {
                const fileInput = document.getElementById("file-upload");
                if (!fileInput.files.length) {
                    e.preventDefault();
                    alert("Veuillez sélectionner un fichier");
                    return false;
                }
                
                const fileName = fileInput.files[0].name.toLowerCase();
                if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
                    e.preventDefault();
                    alert("Veuillez sélectionner un fichier Excel (.xlsx ou .xls)");
                    return false;
                }
                
                return true;
            });
        </script>
    </body>
    </html>
    ';
});

// Debug route for testing file upload with detailed error reporting
Route::post('/debug-upload', function(\Illuminate\Http\Request $request) {
    // Add CORS headers manually for this route
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    
    // Output detailed information for debugging
    $debug = [
        'request_method' => $request->method(),
        'has_file' => $request->hasFile('file'),
        'all_input' => $request->all(),
        'file_keys' => array_keys($_FILES),
        'headers' => $request->header(),
        'error' => null
    ];
    
    try {
        if (!$request->hasFile('file')) {
            $debug['error'] = 'No file in request';
            return addCorsHeaders(response()->json($debug, 400));
        }
        
        $file = $request->file('file');
        $debug['file_info'] = [
            'name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'extension' => $file->getClientOriginalExtension(),
            'valid' => $file->isValid(),
            'error' => $file->getError()
        ];
        
        // Create fallback directory if it doesn't exist
        $uploadDir = storage_path('app/debug_uploads');
        if (!file_exists($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                $debug['error'] = 'Failed to create upload directory';
                return addCorsHeaders(response()->json($debug, 500));
            }
        }
        
        // Try direct PHP file storage as fallback
        $filename = uniqid() . '_' . $file->getClientOriginalName();
        $path = $uploadDir . '/' . $filename;
        
        if (copy($file->getRealPath(), $path)) {
            $debug['stored_path'] = $path;
            $debug['full_path'] = $path;
            $debug['success'] = true;
            $debug['storage_method'] = 'direct_copy';
            
            // Redirect back with success message
            if ($request->wantsJson()) {
                return addCorsHeaders(response()->json($debug, 200));
            } else {
                return redirect('http://localhost:3001/admin/gerer-stagiaires')
                    ->with('message', 'File uploaded successfully');
            }
        } else {
            // If direct copy fails, try Laravel's store method
            try {
                $path = $file->store('debug_uploads', 'local');
                $debug['stored_path'] = $path;
                $debug['full_path'] = storage_path('app/' . $path);
                $debug['success'] = true;
                $debug['storage_method'] = 'laravel_store';
                
                // Redirect back with success message
                if ($request->wantsJson()) {
                    return addCorsHeaders(response()->json($debug, 200));
                } else {
                    return redirect('http://localhost:3001/admin/gerer-stagiaires')
                        ->with('message', 'File uploaded successfully');
                }
            } catch (\Exception $e) {
                $debug['error'] = 'Both storage methods failed: ' . $e->getMessage();
                return addCorsHeaders(response()->json($debug, 500));
            }
        }
    } catch (\Exception $e) {
        $debug['error'] = $e->getMessage();
        $debug['trace'] = $e->getTraceAsString();
        return addCorsHeaders(response()->json($debug, 500));
    }
})->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// Special fallback route that should work in all cases
Route::post('/fallback-upload', function(Request $request) {
    // Add CORS headers manually for this route
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    
    // Handle OPTIONS preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
    
    // Log all request details
    Log::info('FALLBACK UPLOAD', [
        'method' => $request->method(),
        'url' => $request->fullUrl(),
        'has_file' => $request->hasFile('file'),
        'all_files' => $_FILES,
        'all_inputs' => $request->all(),
        'headers' => $request->header()
    ]);
    
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
                
                // Redirect back with success message
                if ($request->wantsJson()) {
                    return response()->json($response);
                } else {
                    return redirect('http://localhost:3001/admin/gerer-stagiaires')
                        ->with('message', 'File uploaded successfully');
                }
            } else {
                $response['message'] = 'Failed to copy file';
                
                if ($request->wantsJson()) {
                    return response()->json($response, 500);
                } else {
                    return redirect()->back()->with('error', 'Failed to copy file');
                }
            }
        } catch (\Exception $e) {
            Log::error("Fallback upload error: " . $e->getMessage());
            $response['message'] = 'Error: ' . $e->getMessage();
            $response['trace'] = $e->getTraceAsString();
            
            if ($request->wantsJson()) {
                return response()->json($response, 500);
            } else {
                return redirect()->back()->with('error', 'Upload error: ' . $e->getMessage());
            }
        }
    }
    
    // If we reach here, it's an error (no file)
    if ($request->wantsJson()) {
        return response()->json($response, 400);
    } else {
        return redirect()->back()->with('error', 'No file uploaded');
    }
})->withoutMiddleware([\App\Http\Middleware\VerifyCsrfToken::class]);

// API endpoint to get all trainees
Route::get('/api/trainees', function() {
    try {
        $trainees = DB::table('trainees')->get();
        
        // If no trainees in database, return sample data
        if ($trainees->count() === 0) {
            $sampleTrainees = [
                [
                    'id' => 1,
                    'cef' => 'CEF1001',
                    'name' => 'Exemple',
                    'first_name' => 'Stagiaire',
                    'class' => 'DEVOWFS201',
                    'absence_count' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'id' => 2,
                    'cef' => 'CEF1002',
                    'name' => 'Test',
                    'first_name' => 'Utilisateur',
                    'class' => 'DEVOWFS202',
                    'absence_count' => 2,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'id' => 3,
                    'cef' => 'CEF1003',
                    'name' => 'Demo',
                    'first_name' => 'Stagiaire',
                    'class' => 'IDOSR201',
                    'absence_count' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            ];
            
            return addCorsHeaders(response()->json([
                'success' => true,
                'data' => $sampleTrainees,
                'message' => 'Sample data returned - no trainees in database'
            ]));
        }
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'data' => $trainees
        ]));
    } catch (\Exception $e) {
        // Log the error
        \Log::error('Error fetching trainees: ' . $e->getMessage());
        
        // Return sample data as fallback
        $sampleTrainees = [
            [
                'id' => 1,
                'cef' => 'CEF1001',
                'name' => 'Exemple',
                'first_name' => 'Stagiaire',
                'class' => 'DEVOWFS201',
                'absence_count' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'cef' => 'CEF1002',
                'name' => 'Test',
                'first_name' => 'Utilisateur',
                'class' => 'DEVOWFS202',
                'absence_count' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'cef' => 'CEF1003',
                'name' => 'Demo',
                'first_name' => 'Stagiaire',
                'class' => 'IDOSR201',
                'absence_count' => 1,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'data' => $sampleTrainees,
            'error' => $e->getMessage(),
            'message' => 'Error fetching trainees, sample data returned'
        ]));
    }
});

// API endpoint to get trainees filtered by class/group
Route::get('/api/trainees/by-group/{group}', function($group) {
    try {
        $trainees = DB::table('trainees')
                    ->where('class', $group)
                    ->get();
                    
        // If no trainees found for this group, return empty list with success
        if ($trainees->count() === 0) {
            return addCorsHeaders(response()->json([
                'success' => true,
                'data' => [],
                'message' => 'No trainees found for this group'
            ]));
        }
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'data' => $trainees
        ]));
    } catch (\Exception $e) {
        // Log the error
        \Log::error('Error fetching trainees by group: ' . $e->getMessage());
        
        return addCorsHeaders(response()->json([
            'success' => false,
            'data' => [],
            'error' => $e->getMessage(),
            'message' => 'Error fetching trainees by group'
        ], 500));
    }
});

// API endpoint to get all teachers
Route::get('/api/teachers', function() {
    $teachers = DB::table('users')
                ->where('role', 'teacher')
                ->get();
    return addCorsHeaders(response()->json([
        'success' => true,
        'data' => $teachers
    ]));
});

// API endpoint to check connection and database status
Route::get('/api/check', function() {
    try {
        // Check database connection by counting users and trainees
        $userCount = DB::table('users')->count();
        $traineeCount = DB::table('trainees')->count();
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'message' => 'API connection successful',
            'database_connection' => true,
            'counts' => [
                'users' => $userCount,
                'trainees' => $traineeCount
            ],
            'timestamp' => now()->toDateTimeString()
        ]));
    } catch (\Exception $e) {
        return addCorsHeaders(response()->json([
            'success' => false,
            'message' => 'API connection successful but database error: ' . $e->getMessage(),
            'database_connection' => false,
            'timestamp' => now()->toDateTimeString()
        ]));
    }
});

// Simple API test endpoint to diagnose connection issues
Route::get('/api/test', function() {
    try {
        // Check database connectivity
        $connected = DB::connection()->getPdo() ? true : false;
        
        // Check if tables exist
        $tables = [];
        $tablesResult = DB::select("SHOW TABLES");
        foreach ($tablesResult as $table) {
            $tableName = reset($table);
            $tables[] = $tableName;
            
            // Check columns for trainees table
            if ($tableName == 'trainees') {
                $columns = [];
                $columnsResult = DB::select("SHOW COLUMNS FROM trainees");
                foreach ($columnsResult as $column) {
                    $columns[] = $column->Field;
                }
            }
        }
        
        return addCorsHeaders(response()->json([
            'success' => true,
            'database_connected' => $connected,
            'tables' => $tables,
            'trainee_columns' => $columns ?? [],
            'environment' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            ]
        ]));
    } catch (\Exception $e) {
        return addCorsHeaders(response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500));
    }
});

Route::get('/upload', [TraineeController::class, 'showUploadForm'])->name('trainees.upload');
Route::post('/import', [TraineeController::class, 'import'])->name('trainees.import');
Route::get('/trainees', [TraineeController::class, 'index'])->name('trainees.index');
Route::post('/trainees/cancel-import', [TraineeController::class, 'cancelImport'])->name('trainees.cancel-import');

// Add a special reset route to reset all absence data
Route::get('/api/reset-all-absences', function() {
    try {
        // Reset all absences to zero in the database
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Update all trainees to have absence_count = 0
        DB::table('trainees')->update(['absence_count' => 0]);
        
        // Truncate the absences table if it exists
        if (Schema::hasTable('absences')) {
            DB::table('absences')->truncate();
        }
        
        // Truncate any other absence-related tables
        if (Schema::hasTable('students')) {
            DB::table('students')->whereNotNull('id')->update(['absence_count' => 0]);
        }
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        return response()->json([
            'success' => true,
            'message' => 'All absence data has been reset to zero'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error resetting absence data: ' . $e->getMessage()
        ], 500);
    }
});
