<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create('pt_BR');

        User::updateOrCreate(
            ['username' => $faker->cpf(false)],
            [
                'name' => strtoupper($faker->name),
                'password' => Hash::make('Chavantes@2026'),
                'role' => 'admin',
            ]
        );
    }
}
