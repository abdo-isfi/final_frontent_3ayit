<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Trainee;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Xls;

class ExcelImportService
{
    protected $lastImportBatch;
    
    /**
     * Import trainee data from an Excel file.
     *
     * @param string $filePath
     * @return array|bool Returns array of imported data on success, false on failure
     */
    public function importTraineesFromExcel(string $filePath)
    {
        try {
            // Normalize file path to ensure consistent directory separators
            $filePath = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $filePath);
            
            Log::info("Starting file import process with file: " . $filePath);
            
            // Debug: Get file details
            if (file_exists($filePath)) {
                $fileSize = filesize($filePath);
                $filePermissions = substr(sprintf('%o', fileperms($filePath)), -4);
                Log::info("File exists! Size: {$fileSize} bytes, Permissions: {$filePermissions}");
                
                // Try to read the first few bytes to check if file is readable
                $fileHandle = fopen($filePath, 'r');
                if ($fileHandle) {
                    $bytes = fread($fileHandle, 8);
                    $hexBytes = bin2hex($bytes);
                    fclose($fileHandle);
                    Log::info("File is readable. First 8 bytes: 0x{$hexBytes}");
                } else {
                    Log::error("File exists but cannot be opened for reading");
                    return false;
                }
            } else {
                Log::error("File not found: " . $filePath);
                return false;
            }

            // Determine file type and use appropriate reader
            $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            Log::info("File extension: {$fileExtension}");
            
            // Create reader based on file extension
            try {
                if ($fileExtension == 'xlsx') {
                    $reader = new Xlsx();
                } elseif ($fileExtension == 'xls') {
                    $reader = new Xls();
                } else {
                    // Try to auto-detect format
                    $reader = IOFactory::createReaderForFile($filePath);
                }
                
                // Load the spreadsheet
                $spreadsheet = $reader->load($filePath);
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();
                
                Log::info("Successfully loaded spreadsheet with " . count($rows) . " rows");
            } catch (Exception $e) {
                Log::error("Failed to load spreadsheet: " . $e->getMessage());
                return false;
            }
            
            // Generate a batch ID for this import
            $this->lastImportBatch = 'import_' . time();
            Log::info("Created import batch: " . $this->lastImportBatch);

            // Define invalid or placeholder values to be excluded
            $invalidNamesClasses = [
                'PERMIS CONDUIRE COVID19',
                'NOM PRENOM',
                'VACANCE', // Add other irrelevant values you want to exclude here
                'GROUPE', // Example
            ];

            $importedCount = 0;
            $skippedCount = 0;
            $importedData = [];

            // Iterate through rows and import them into the database
            foreach ($rows as $rowIndex => $row) {
                try {
                    // Make sure row has enough columns
                    if (count($row) < 15) { // We need at least 15 columns to access index 14
                        Log::warning("Row {$rowIndex} doesn't have enough columns, skipping.");
                        $skippedCount++;
                        continue;
                    }

                    // Handle potential null values
                    $lastName = isset($row[2]) ? trim((string)$row[2]) : '';
                    $firstName = isset($row[3]) ? trim((string)$row[3]) : '';
                    $class = isset($row[4]) ? trim((string)$row[4]) : '';
                    // Always set absence count to 0 regardless of what's in the Excel file
                    $absenceCount = 0;

                    $name = $lastName . ' ' . $firstName;

                    if (in_array($name, $invalidNamesClasses) || in_array($class, $invalidNamesClasses)) {
                        Log::info("Skipping row {$rowIndex} with invalid name or class: {$name}, {$class}");
                        $skippedCount++;
                        continue;
                    }

                    if (!empty($lastName) && !empty($firstName) && !empty($class)) {
                        Log::info("Processing row {$rowIndex}: {$lastName} {$firstName}, Class: {$class}");

                        $trainee = new Trainee();
                        $trainee->name = $name;
                        $trainee->class = $class;
                        $trainee->absence_count = 0; // Always set to 0
                        $trainee->import_batch = $this->lastImportBatch;
                        $trainee->save();
                        
                        // Store imported data
                        $importedData[] = [
                            'id' => $trainee->id,
                            'name' => $name,
                            'class' => $class,
                            'absence_count' => 0 // Always set to 0 in the response
                        ];
                        
                        $importedCount++;
                    } else {
                        Log::warning("Row {$rowIndex} has empty required fields, skipping.");
                        $skippedCount++;
                    }
                } catch (Exception $e) {
                    Log::error("Error processing row {$rowIndex}: " . $e->getMessage());
                    $skippedCount++;
                }
            }

            Log::info("Import completed: {$importedCount} records imported, {$skippedCount} records skipped.");
            return $importedData;
        } catch (Exception $e) {
            Log::error('Error importing trainees: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Get the ID of the last import batch
     *
     * @return string|null
     */
    public function getLastImportBatch()
    {
        return $this->lastImportBatch;
    }
    
    /**
     * Import file wrapper for controller compatibility
     * 
     * @param string $filePath
     * @return array
     */
    public function import($filePath)
    {
        return $this->importTraineesFromExcel($filePath);
    }
}

