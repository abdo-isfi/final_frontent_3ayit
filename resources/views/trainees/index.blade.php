<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trainees List</title>
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
        .empty-message {
            text-align: center;
            padding: 50px;
            color: #6c757d;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h2>Trainees List</h2>
            <div>
                <a href="{{ url('/upload') }}" class="btn btn-primary">Upload Trainees</a>
            </div>
        </div>

        <!-- Add Class Filter -->
        <div class="mb-4">
            <form method="GET" action="{{ url('/trainees') }}" class="row g-3">
                <div class="col-md-4">
                    <label for="classFilter" class="form-label">Filter by Class:</label>
                    <select name="class" id="classFilter" class="form-select" onchange="this.form.submit()">
                        <option value="all">All Classes</option>
                        @foreach($classes as $class)
                            <option value="{{ $class }}" {{ request('class') == $class ? 'selected' : '' }}>{{ $class }}</option>
                        @endforeach
                    </select>
                </div>
            </form>
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
                            <td>{{ $trainee->id }}</td>
                            <td>{{ $trainee->name }}</td>
                            <td>{{ $trainee->class }}</td>
                            <td>{{ $trainee->absence_count }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                    <tfoot class="table-secondary">
                        <tr>
                            <td colspan="3" class="text-end"><strong>Total Absences:</strong></td>
                            <td><strong>{{ $trainees->sum('absence_count') }}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            @else
                <div class="empty-message">
                    <h4>No trainees found</h4>
                    <p>Upload trainees data to see them listed here.</p>
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
        });
    </script>
</body>

</html>