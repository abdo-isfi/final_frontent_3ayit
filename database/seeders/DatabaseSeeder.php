<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Always ensure all trainees have an absence_count of 0
        if (Schema::hasTable('trainees') && DB::table('trainees')->exists()) {
            DB::table('trainees')->update(['absence_count' => 0]);
        }
    }
}
