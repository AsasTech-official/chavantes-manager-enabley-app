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
            $table->string('enabley_user_identifier');
            $table->string('group_identifier');
            $table->timestamps();

            $table->unique(['enabley_user_identifier', 'group_identifier']);
            $table->index('enabley_user_identifier');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enabley_user_manager_groups');
    }
};
