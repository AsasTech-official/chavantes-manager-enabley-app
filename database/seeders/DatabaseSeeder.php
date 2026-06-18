<?php

namespace Database\Seeders;

use App\Models\SubAccount;
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
            ['username' => 'projunto'],
            [
                'name' => 'PROJUNTO',
                'password' => Hash::make('password'),
            ]
        );

        $envSub = (string) config('enabley.sub_account_name', '');
        if ($envSub !== '') {
            SubAccount::query()->firstOrCreate(
                ['name' => $envSub],
                []
            );
        }
    }
}
