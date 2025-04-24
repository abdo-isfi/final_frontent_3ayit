<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excel File Upload Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 30px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Excel File Upload Test</h1>
            <div>
                <a href="{{ url('/upload') }}" class="btn btn-outline-primary me-2">Trainee Upload Page</a>
                <a href="{{ url('/trainees') }}" class="btn btn-outline-success">View Trainees</a>
            </div>
        </div>
        
        <div class="alert alert-info">
            <p>This is a test page for uploading Excel files. If the standard upload page doesn't work, use this one instead.</p>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h2>Test File Upload</h2>
            </div>
            <div class="card-body">
                <form action="{{ url('/test-upload') }}" method="POST" enctype="multipart/form-data">
                    @csrf
                    <div class="mb-3">
                        <label for="file" class="form-label">Choose Excel File (.xlsx or .xls):</label>
                        <input type="file" class="form-control" name="file" id="file" accept=".xlsx,.xls" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Upload Test File</button>
                </form>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html> 