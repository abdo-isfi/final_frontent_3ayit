@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <span>Confirm Import - {{ $trainees->count() }} trainees imported</span>
                        <div>
                            <button id="cancelImportBtn" class="btn btn-danger">Cancel Import</button>
                            <a href="{{ route('trainee.index') }}" class="btn btn-primary ml-2">Confirm Import</a>
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    @if (session('status'))
                        <div class="alert alert-success" role="alert">
                            {{ session('status') }}
                        </div>
                    @endif

                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Absence Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($trainees as $trainee)
                            <tr>
                                <td>{{ $trainee->name }}</td>
                                <td>{{ $trainee->class }}</td>
                                <td>{{ $trainee->absence_count }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    document.getElementById('cancelImportBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel this import? All imported trainees will be removed.')) {
            fetch('{{ route('trainee.cancel-import') }}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Import cancelled successfully');
                    window.location.href = '{{ route('trainee.index') }}';
                } else {
                    alert('Error cancelling import: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while cancelling the import');
            });
        }
    });
</script>
@endsection 