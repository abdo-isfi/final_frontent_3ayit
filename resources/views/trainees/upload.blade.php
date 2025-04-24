<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Upload Excel</title>
    <!-- Add Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            padding: 20px;
            background-color: #f8f9fa;
        }
        .upload-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 30px;
            margin-top: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .alert {
            margin-bottom: 20px;
        }
        .drag-area {
            border: 2px dashed #0d6efd;
            height: 200px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            margin-bottom: 20px;
        }
        .drag-area.active {
            border-color: #198754;
        }
        .file-info {
            display: none;
            padding: 15px;
            margin-top: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Upload Excel File</h1>
            <div>
                <a href="{{ url('/trainees') }}" class="btn btn-outline-primary">Back to Trainees List</a>
            </div>
        </div>

        @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        @elseif(session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        @endif

        <div class="upload-container">
            <div class="row">
                <div class="col-md-6">
                    <h4>Instructions:</h4>
                    <ol>
                        <li>Prepare your Excel file (.xlsx or .xls) with trainee data.</li>
                        <li>Make sure the columns are in the proper format:
                            <ul>
                                <li>Column C (index 2): Last Name</li>
                                <li>Column D (index 3): First Name</li>
                                <li>Column E (index 4): Class</li>
                                <li>Column O (index 14): Absence Hours</li>
                            </ul>
                        </li>
                        <li>Upload the file using the form.</li>
                        <li>Review the imported data in the trainees list.</li>
                    </ol>
                </div>
                <div class="col-md-6">
                    <form action="{{ route('trainees.import') }}" method="POST" enctype="multipart/form-data" id="upload-form">
                        @csrf
                        <div class="drag-area" id="drag-area">
                            <div class="icon"><i class="fas fa-cloud-upload-alt fa-3x mb-3"></i></div>
                            <h5>Drag & Drop Excel File Here</h5>
                            <span>OR</span>
                            <button type="button" class="btn btn-primary mt-3" onclick="document.getElementById('file').click()">Browse File</button>
                            <input type="file" name="file" id="file" accept=".xlsx,.xls" class="d-none" required>
                        </div>
                        
                        <div class="file-info" id="file-info">
                            <h5>Selected File:</h5>
                            <p id="filename" class="mb-1">No file selected</p>
                            <p id="filesize" class="mb-1">--</p>
                            <div class="mt-2">
                                <button type="submit" class="btn btn-success">Upload & Import</button>
                                <button type="button" class="btn btn-danger" onclick="resetForm()">Remove</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Bootstrap JS and Font Awesome -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
    <script>
        const dragArea = document.getElementById('drag-area');
        const fileInput = document.getElementById('file');
        const fileInfo = document.getElementById('file-info');
        const filename = document.getElementById('filename');
        const filesize = document.getElementById('filesize');

        // When file is selected using the browse button
        fileInput.addEventListener('change', function() {
            if (this.files[0]) {
                showFileDetails(this.files[0]);
            }
        });

        // Drag and drop functionality
        ['dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        dragArea.addEventListener('dragover', function() {
            this.classList.add('active');
        });

        dragArea.addEventListener('dragleave', function() {
            this.classList.remove('active');
        });

        dragArea.addEventListener('drop', function(e) {
            this.classList.remove('active');
            fileInput.files = e.dataTransfer.files;
            showFileDetails(e.dataTransfer.files[0]);
        });

        function showFileDetails(file) {
            dragArea.style.display = 'none';
            fileInfo.style.display = 'block';
            
            filename.textContent = file.name;
            
            // Format file size
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = parseInt(Math.floor(Math.log(file.size) / Math.log(1024)));
            const formattedSize = Math.round(file.size / Math.pow(1024, i), 2) + ' ' + sizes[i];
            
            filesize.textContent = 'Size: ' + formattedSize;
        }

        function resetForm() {
            document.getElementById('upload-form').reset();
            dragArea.style.display = 'flex';
            fileInfo.style.display = 'none';
        }
    </script>
</body>

</html>