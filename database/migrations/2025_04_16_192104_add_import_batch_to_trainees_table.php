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
        Schema::table('trainees', function (Blueprint $table) {
            if (!Schema::hasColumn('trainees', 'import_batch')) {
                $table->string('import_batch')->nullable()->after('absence_count');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trainees', function (Blueprint $table) {
            if (Schema::hasColumn('trainees', 'import_batch')) {
                $table->dropColumn('import_batch');
            }
        });
    }
};
