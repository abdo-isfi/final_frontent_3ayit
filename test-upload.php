<?php

// Set error reporting for maximum information
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Only proceed if this is accessed directly via PHP CLI
if (php_sapi_name() == 'cli') {
    echo "Testing upload directory permissions...\n";
    
    // Test directory creation
    $uploadDir = __DIR__ . '/storage/app/uploads';
    
    if (!file_exists($uploadDir)) {
        if (mkdir($uploadDir, 0777, true)) {
            echo "✅ Created upload directory: $uploadDir\n";
        } else {
            echo "❌ Failed to create directory: $uploadDir\n";
            echo "Error: " . error_get_last()['message'] . "\n";
        }
    } else {
        echo "✅ Upload directory already exists: $uploadDir\n";
    }
    
    // Test write permissions
    $testFile = $uploadDir . '/test_' . date('Y-m-d_H-i-s') . '.txt';
    if (file_put_contents($testFile, 'Test content')) {
        echo "✅ Successfully created test file: $testFile\n";
        
        // Try to read the file
        if (file_get_contents($testFile)) {
            echo "✅ Successfully read test file\n";
        } else {
            echo "❌ Failed to read test file\n";
            echo "Error: " . error_get_last()['message'] . "\n";
        }
        
        // Try to delete the file
        if (unlink($testFile)) {
            echo "✅ Successfully deleted test file\n";
        } else {
            echo "❌ Failed to delete test file\n";
            echo "Error: " . error_get_last()['message'] . "\n";
        }
    } else {
        echo "❌ Failed to create test file\n";
        echo "Error: " . error_get_last()['message'] . "\n";
    }
    
    // Report directory permissions
    echo "\nDirectory permissions:\n";
    echo "Permissions on upload dir: " . substr(sprintf('%o', fileperms($uploadDir)), -4) . "\n";
    echo "Owner: " . fileowner($uploadDir) . "\n";
    echo "Group: " . filegroup($uploadDir) . "\n";
    
    // Test Laravel storage path
    echo "\nTesting Laravel storage paths:\n";
    require_once __DIR__ . '/vendor/autoload.php';
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    echo "Laravel storage_path(): " . storage_path('app/uploads') . "\n";
    echo "Storage directory exists: " . (file_exists(storage_path('app/uploads')) ? 'Yes' : 'No') . "\n";
    
    echo "\nTest completed.\n";
}
else {
    echo "This script should be run from the command line.";
} 