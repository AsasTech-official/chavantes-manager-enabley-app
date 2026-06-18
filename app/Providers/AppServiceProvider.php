<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            return;
        }

        if (config('database.default') !== 'sqlite') {
            return;
        }

        if (extension_loaded('pdo_sqlite')) {
            return;
        }

        throw new \RuntimeException(
            'O PHP que trata os pedidos HTTP não tem a extensão pdo_sqlite. '
            .'Em Ubuntu/Debian: `sudo apt install php'.PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION.'-sqlite3` e, se usas FPM, '
            .'`sudo phpenmod pdo_sqlite sqlite3` e reinicia o `php-fpm` / `apache2`. '
            .'Binary em uso: '.PHP_BINARY
        );
    }
}
