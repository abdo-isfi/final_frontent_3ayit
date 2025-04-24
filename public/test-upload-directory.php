<?php
// This is a simple script to test if upload directories can be accessed and written to

// Set error reporting for maximum information
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define directories to test
$directories = [
    __DIR__ . '/../storage/app',
    __DIR__ . '/../storage/app/debug_uploads',
    __DIR__ . '/../storage/app/uploads',
    __DIR__ . '/../storage/app/imports',
];

echo "<h1>Upload Directory Test</h1>";
echo "<p>Testing if PHP can write to the upload directories</p>";

// Test each directory
foreach ($directories as $dir) {
    echo "<h2>Testing: $dir</h2>";
    
    // Check if directory exists
    if (file_exists($dir)) {
        echo "<p>✅ Directory exists</p>";
    } else {
        echo "<p>❌ Directory does not exist. Attempting to create it...</p>";
        if (mkdir($dir, 0777, true)) {
            echo "<p>✅ Directory created successfully</p>";
        } else {
            echo "<p>❌ Failed to create directory: " . error_get_last()['message'] . "</p>";
            continue;
        }
    }
    
    // Check directory permissions
    echo "<p>Permissions: " . substr(sprintf('%o', fileperms($dir)), -4) . "</p>";
    
    // Test write permissions by creating a test file
    $testFile = $dir . '/test_' . time() . '.txt';
    if (file_put_contents($testFile, 'Test content')) {
        echo "<p>✅ Successfully wrote to test file: $testFile</p>";
        
        // Try to read the file back
        if (file_get_contents($testFile)) {
            echo "<p>✅ Successfully read test file</p>";
        } else {
            echo "<p>❌ Failed to read test file: " . error_get_last()['message'] . "</p>";
        }
        
        // Try to delete the file
        if (unlink($testFile)) {
            echo "<p>✅ Successfully deleted test file</p>";
        } else {
            echo "<p>❌ Failed to delete test file: " . error_get_last()['message'] . "</p>";
        }
    } else {
        echo "<p>❌ Failed to write to file: " . error_get_last()['message'] . "</p>";
    }
    
    echo "<hr>";
}

// Add information about server configuration
echo "<h2>Server Configuration</h2>";
echo "<ul>";
echo "<li>PHP Version: " . PHP_VERSION . "</li>";
echo "<li>upload_max_filesize: " . ini_get('upload_max_filesize') . "</li>";
echo "<li>post_max_size: " . ini_get('post_max_size') . "</li>";
echo "<li>max_file_uploads: " . ini_get('max_file_uploads') . "</li>";
echo "<li>memory_limit: " . ini_get('memory_limit') . "</li>";
echo "</ul>"; 