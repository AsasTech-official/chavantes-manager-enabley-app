<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DefaultUserPasswordController;
use App\Http\Controllers\EnableyImportController;
use App\Http\Controllers\EnableyUserController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ManagerController;
use App\Http\Controllers\SystemUserController;
use App\Http\Controllers\PasswordChangeController;
use App\Http\Controllers\UsersController;
use App\Http\Middleware\EnsureFullAccessAdmin;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user && $user->role === 'admin') {
            return redirect()->route('managers.index');
        }

        return redirect()->route('home');
    }

    return redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
});

Route::post('logout', [LoginController::class, 'destroy'])->middleware('auth')->name('logout');

Route::middleware('auth')->group(function () {
    Route::put('/password/change', [PasswordChangeController::class, 'update'])->name('password.change');

    Route::get('/home', HomeController::class)->name('home');
    Route::get('/usuarios', UsersController::class)->name('users.index');
    Route::post('/usuarios', [EnableyUserController::class, 'store'])->name('users.store');
    Route::patch('/usuarios/{identifier}', [EnableyUserController::class, 'update'])->name('users.update');
    Route::get('/importacao', [EnableyImportController::class, 'index'])->name('import.index');
    Route::get('/importacao/modelo/{kind}', [EnableyImportController::class, 'downloadTemplate'])
        ->whereIn('kind', ['usuarios'])
        ->name('import.template');
    Route::post('/importacao/usuarios', [EnableyImportController::class, 'importUsers'])->name('import.users');

    Route::middleware(EnsureFullAccessAdmin::class)->group(function () {
        Route::put('/configuracoes/senha-padrao-usuarios', [DefaultUserPasswordController::class, 'update'])->name('settings.default_user_password.update');
        Route::delete('/configuracoes/senha-padrao-usuarios', [DefaultUserPasswordController::class, 'destroy'])->name('settings.default_user_password.destroy');

        Route::get('/gerentes', [ManagerController::class, 'index'])->name('managers.index');
        Route::post('/gerentes', [ManagerController::class, 'store'])->name('managers.store');
        Route::put('/gerentes/{manager}', [ManagerController::class, 'update'])->name('managers.update');
        Route::delete('/gerentes/{manager}', [ManagerController::class, 'destroy'])->name('managers.destroy');
        Route::post('/gerentes/{manager}/groups', [ManagerController::class, 'updateGroups'])->name('managers.groups.update');

        Route::get('/usuarios-sistema', [SystemUserController::class, 'index'])->name('system-users.index');
        Route::post('/usuarios-sistema', [SystemUserController::class, 'store'])->name('system-users.store');
        Route::put('/usuarios-sistema/{systemUser}', [SystemUserController::class, 'update'])->name('system-users.update');
        Route::delete('/usuarios-sistema/{systemUser}', [SystemUserController::class, 'destroy'])->name('system-users.destroy');
    });
});
