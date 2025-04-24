<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Import</title>
    <!-- Add Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Add DataTables CSS -->
    <link href="https://cdn.datatables.net/1.13.7/css/dataTables.bootstrap5.min.css" rel="stylesheet">
    <style>
        body {
            padding: 20px;
            background-color: #f8f9fa;
        }
        .table-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 20px;
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
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>Import Confirmation</h2>
            <div>
                <a href="{{ url('/trainees') }}" class="btn btn-outline-secondary">Back to Trainees</a>
            </div>
        </div>

        <div class="alert alert-info">
            <h5>Import Completed Successfully</h5>
            <p>{{ count($trainees) }} trainees were imported. Please review the data below and either confirm or cancel the import.</p>
        </div>

        <div class="table-container">
            @if(count($trainees) > 0)
                <table id="traineesTable" class="table table-striped table-hover">
                    <thead class="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Absence Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($trainees as $trainee)
                        <tr>
                            <td>{{ $trainee['id'] }}</td>
                            <td>{{ $trainee['name'] }}</td>
                            <td>{{ $trainee['class'] }}</td>
                            <td>{{ $trainee['absence_count'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>

                <div class="actions">
                    <button id="cancelImportBtn" class="btn btn-danger">Cancel Import</button>
                    <a href="{{ url('/trainees') }}" class="btn btn-success">Confirm Import</a>
                </div>
            @else
                <div class="text-center py-5">
                    <h4>No trainees were imported</h4>
                    <p>There was an issue with the import process.</p>
                    <a href="{{ url('/upload') }}" class="btn btn-primary mt-3">Try Again</a>
                </div>
            @endif
        </div>
    </div>

    <!-- Add Bootstrap JS and jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Add DataTables JS -->
    <script src="https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.7/js/dataTables.bootstrap5.min.js"></script>
    <script>
        $(document).ready(function() {
            // Initialize DataTable
            $('#traineesTable').DataTable({
                "pageLength": 25,
                "language": {
                    "search": "Search:",
                    "lengthMenu": "Show _MENU_ entries",
                    "info": "Showing _START_ to _END_ of _TOTAL_ trainees",
                    "infoEmpty": "Showing 0 to 0 of 0 trainees",
                    "infoFiltered": "(filtered from _MAX_ total trainees)"
                }
            });

            // Handle cancel import button
            $('#cancelImportBtn').on('click', function() {
                if (confirm('Are you sure you want to cancel this import? This will remove all imported trainees.')) {
                    $.ajax({
                        url: '/trainees/cancel-import',
                        type: 'POST',
                        data: {
                            '_token': '{{ csrf_token() }}'
                        },
                        success: function(response) {
                            alert('Import cancelled successfully');
                            window.location.href = '/upload';
                        },
                        error: function(xhr) {
                            alert('Error cancelling import: ' + xhr.responseJSON.message);
                        }
                    });
                }
            });
        });
    </script>
</body>

</html> 