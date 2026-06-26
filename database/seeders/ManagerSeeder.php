<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class ManagerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create('pt_BR');
        
        $managers = [];
        for ($i = 0; $i < 50; $i++) {
            $managers[] = [
                'name' => strtoupper($faker->name),
                'username' => $faker->unique()->cpf(false),
                'password' => Hash::make('Chavantes@2026'),
                'role' => 'manager',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        User::insert($managers);
    }
}
