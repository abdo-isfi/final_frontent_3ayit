<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create teachers table
        Schema::create('teachers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });

        // Create groups (classes) table
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('filiere')->nullable(); // For example: "développement digitale"
            $table->string('annee')->nullable(); // "1ere annee", "2eme annee"
            $table->timestamps();
        });

        // Create trainees table
        Schema::create('trainees', function (Blueprint $table) {
            $table->id();
            $table->string('cef')->unique();
            $table->string('name');
            $table->string('first_name');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->timestamps();
        });

        // Create absence records table
        Schema::create('absence_records', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->onDelete('set null');
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        // Create individual trainee absences table
        Schema::create('trainee_absences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trainee_id')->constrained('trainees')->onDelete('cascade');
            $table->foreignId('absence_record_id')->constrained('absence_records')->onDelete('cascade');
            $table->string('status'); // 'absent', 'late', 'present'
            $table->boolean('is_validated')->default(false);
            $table->boolean('is_justified')->default(false);
            $table->boolean('has_billet_entree')->default(false);
            $table->string('validated_by')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->text('justification_comment')->nullable();
            $table->decimal('absence_hours', 3, 1)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trainee_absences');
        Schema::dropIfExists('absence_records');
        Schema::dropIfExists('trainees');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('teachers');
    }
}; 