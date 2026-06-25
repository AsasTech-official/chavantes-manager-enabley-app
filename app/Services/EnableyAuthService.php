<?php

namespace App\Services;

use App\Models\IntegrationSetting;
use App\Models\User;
use App\Support\EnableyScope;
use App\Support\EnableyScopeContext;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Throwable;

class EnableyAuthService
{
    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    /**
     * @return array{user: User, scope: EnableyScope}
     */
    public function attempt(string $username, string $password, bool $remember = false): array
    {
        $username = trim($username);
        if ($username === '') {
            throw new RuntimeException(__('auth.failed'));
        }

        if (! Auth::attempt(['username' => $username, 'password' => $password], $remember)) {
            throw new RuntimeException('Credenciais incorretas.');
        }

        /** @var User $appUser */
        $appUser = Auth::user();

        if (($appUser->role ?? 'manager') === 'admin') {
            $scope = $this->scopeService->adminScope();
            EnableyScopeContext::set($scope);

            return ['user' => $appUser, 'scope' => $scope];
        }

        // It is a manager
        try {
            $scope = $this->scopeService->resolveForLocalManager($appUser);
        } catch (RuntimeException $e) {
            Auth::logout();
            throw $e;
        }

        EnableyScopeContext::set($scope);

        return ['user' => $appUser, 'scope' => $scope];
    }

    public function logout(): void
    {
        EnableyScopeContext::clear();
        Auth::guard('web')->logout();
    }


}
