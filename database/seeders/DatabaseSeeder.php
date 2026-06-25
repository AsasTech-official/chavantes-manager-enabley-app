<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['username' => '22806251800'],
            [
                'name' => 'Pedro Clisesque',
                'password' => Hash::make('22066346@Jesus'),
                'role' => 'admin',
            ]
        );

    }
}
