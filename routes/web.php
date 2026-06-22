<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DefaultUserPasswordController;
use App\Http\Controllers\EnableyImportController;
use App\Http\Controllers\EnableyUserController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\UsersController;
use App\Http\Middleware\EnsureFullAccessAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('home')
        : redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::post('logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/home', HomeController::class)->name('home');
    Route::get('/usuarios', UsersController::class)->name('usuarios');
    Route::post('/usuarios', [EnableyUserController::class, 'store'])->name('usuarios.store');
    Route::patch('/usuarios/{identifier}', [EnableyUserController::class, 'update'])->name('usuarios.update');

    Route::middleware(EnsureFullAccessAdmin::class)->group(function () {
        Route::get('/importacao', [EnableyImportController::class, 'index'])->name('importacao');
        Route::get('/importacao/modelo/{kind}', [EnableyImportController::class, 'downloadTemplate'])
            ->whereIn('kind', ['usuarios'])
            ->name('importacao.modelo');
        Route::post('/importacao/usuarios', [EnableyImportController::class, 'importUsers'])->name('importacao.usuarios');
        Route::put('/configuracoes/senha-padrao-usuarios', [DefaultUserPasswordController::class, 'update'])->name('configuracoes.default_user_password.update');
        Route::delete('/configuracoes/senha-padrao-usuarios', [DefaultUserPasswordController::class, 'destroy'])->name('configuracoes.default_user_password.destroy');
    });
});
