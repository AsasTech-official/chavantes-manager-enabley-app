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

        $localUser = User::query()->where('username', $username)->first();

        if ($localUser !== null && ($localUser->access_mode ?? 'admin') === 'admin') {
            if (! Auth::attempt(['username' => $username, 'password' => $password], $remember)) {
                throw new RuntimeException('Senha incorreta.');
            }

            $scope = $this->scopeService->adminScope();
            EnableyScopeContext::set($scope);

            return ['user' => Auth::user(), 'scope' => $scope];
        }

        $enableyUser = $this->enabley->findUserByUsername($username);
        if ($enableyUser === null) {
            throw new RuntimeException('Usuário não encontrado na subconta Enabley.');
        }

        $identifier = $enableyUser['identifier'] ?? null;
        if (! is_string($identifier) || $identifier === '') {
            throw new RuntimeException(__('auth.failed'));
        }

        $isActive = $enableyUser['isActive'] ?? true;
        if ($isActive === false || $isActive === 'false') {
            throw new RuntimeException('Usuário inativo na Enabley.');
        }

        try {
            $scope = $this->scopeService->resolveForEnableyUser($enableyUser);
        } catch (RuntimeException $e) {
            throw $e;
        }

        if (! $this->verifyPassword($username, $password, $localUser)) {
            throw new RuntimeException(
                'Senha incorreta. Use a mesma senha padrão configurada em Configurações (senha de novos usuários Enabley).'
            );
        }

        $firstName = is_string($enableyUser['firstName'] ?? null) ? trim($enableyUser['firstName']) : '';
        $lastName = is_string($enableyUser['lastName'] ?? null) ? trim($enableyUser['lastName']) : '';
        $displayName = trim($firstName.' '.$lastName) ?: $username;

        $accessMode = $scope->isAdmin() ? 'admin' : 'manager';

        $attributes = [
            'name' => $displayName,
            'access_mode' => $accessMode,
            'enabley_username' => $username,
            'enabley_identifier' => $identifier,
        ];

        if ($localUser === null || ! Hash::check($password, $localUser->password)) {
            $attributes['password'] = Hash::make($password);
        }

        $appUser = User::query()->updateOrCreate(
            ['username' => $username],
            $attributes,
        );

        Auth::login($appUser, $remember);
        EnableyScopeContext::set($scope);

        return ['user' => $appUser, 'scope' => $scope];
    }

    public function logout(): void
    {
        EnableyScopeContext::clear();
        Auth::guard('web')->logout();
    }

    private function verifyPassword(string $username, string $password, ?User $localUser): bool
    {
        if ($localUser !== null && Hash::check($password, $localUser->password)) {
            return true;
        }

        try {
            $settings = IntegrationSetting::current();
            if ($settings->hasDefaultUserPassword() && hash_equals($settings->defaultUserPassword(), $password)) {
                return true;
            }
        } catch (Throwable) {
            // ignore
        }

        return false;
    }
}
