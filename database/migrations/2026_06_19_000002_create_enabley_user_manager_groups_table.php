<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enabley_user_manager_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('group_identifier');
            $table->string('group_name', 500)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'group_identifier']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enabley_user_manager_groups');
    }
};
