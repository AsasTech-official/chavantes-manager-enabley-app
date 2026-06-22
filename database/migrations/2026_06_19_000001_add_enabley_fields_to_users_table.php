<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('access_mode', 20)->default('admin')->after('name');
            $table->string('enabley_username')->nullable()->after('access_mode');
            $table->string('enabley_identifier')->nullable()->after('enabley_username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['access_mode', 'enabley_username', 'enabley_identifier']);
        });
    }
};
