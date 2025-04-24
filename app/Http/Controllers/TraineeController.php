<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ExcelImportService;
use Illuminate\Support\Facades\Redirect;
use App\Models\Trainee;
use Illuminate\Support\Facades\Log;

class TraineeController extends Controller
{
    protected $excelImportService;

    public function __construct(ExcelImportService $excelImportService)
    {
        $this->excelImportService = $excelImportService;
    }

    /**
     * Show the form to upload the Excel file.
     *
     * @return \Illuminate\View\View
     */
    public function showUploadForm()
    {
        return view('trainees.upload');
    }

    /**
     * Handle the uploaded Excel file and import data.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        Log::info('File upload attempt by ' . auth()->user()->name);

        // Store the file
        $fileName = 'trainees_' . time() . '.' . $request->file->extension();
        $filePath = $request->file('file')->storeAs('imports', $fileName);
        
        // Build correct full path with normalized directory separators
        $fullPath = storage_path('app/' . $filePath);
        $fullPath = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $fullPath);

        try {
            // Import the data using our service
            $importedTrainees = $this->excelImportService->importTraineesFromExcel($fullPath);
            
            if ($importedTrainees === false) {
                return back()->withErrors('Error importing file: No data was imported.');
            }
            
            // Store import batch ID in session
            session(['last_import_batch' => $this->excelImportService->getLastImportBatch()]);
            
            // Pass imported trainees to the confirm view
            return view('trainees.confirm-import', ['trainees' => $importedTrainees]);
        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            return back()->withErrors('Error importing file: ' . $e->getMessage());
        }
    }

    /**
     * Cancel the last import batch
     */
    public function cancelImport()
    {
        try {
            $batchId = session('last_import_batch');
            
            if (!$batchId) {
                return response()->json(['message' => 'No import batch found to cancel'], 400);
            }
            
            // Delete trainees with the batch ID
            $count = Trainee::where('import_batch', $batchId)->delete();
            
            // Clear the batch ID from session
            session()->forget('last_import_batch');
            
            return response()->json([
                'success' => true,
                'message' => $count . ' trainees have been removed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Cancel import error: ' . $e->getMessage());
            return response()->json(['message' => 'Error cancelling import: ' . $e->getMessage()], 500);
        }
    }
    
    public function index(Request $request)
    {
        // Get all unique class values for filter dropdown
        $classes = Trainee::select('class')->distinct()->pluck('class')->toArray();
        
        // Apply filter if provided
        $query = Trainee::query();
        
        if ($request->has('class') && $request->class != 'all') {
            $query->where('class', $request->class);
        }
        
        $trainees = $query->get();
        
        return view('trainees.index', compact('trainees', 'classes'));
    }

}
