<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // Exclude all API routes from CSRF protection
        'test-upload', // Exclude test upload route
        'api/upload-excel', // Explicitly exclude upload endpoint
        'debug-upload',     // Debug upload endpoint
        'fallback-upload',  // Fallback upload endpoint
        'debug-upload/*',   // Any sub-routes of debug-upload
        'fallback-upload/*', // Any sub-routes of fallback-upload
    ];
} 