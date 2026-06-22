<?php

namespace App\Http\Middleware;

use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScopeContext;
use Closure;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class RestoreEnableyScope
{
    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    /**
     * @param  \Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && ! $request->session()->has('enabley_scope')) {
            if (
                is_string($user->enabley_username) && $user->enabley_username !== ''
                && is_string($user->enabley_identifier) && $user->enabley_identifier !== ''
            ) {
                try {
                    $enableyUser = $this->enabley->findUserByUsername($user->enabley_username);
                    if ($enableyUser === null) {
                        throw new RuntimeException('Usuário Enabley não encontrado.');
                    }
                    EnableyScopeContext::set($this->scopeService->resolveForEnableyUser($enableyUser));
                } catch (Throwable) {
                    EnableyScopeContext::clear();
                    auth()->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()->route('login')->with('error', 'Sessão expirada ou sem permissão de gerente.');
                }
            } else {
                EnableyScopeContext::set($this->scopeService->adminScope());
            }
        }

        $scope = EnableyScopeContext::current();
        if ($scope->isManager()) {
            try {
                $refreshed = $this->scopeService->refreshScopeGroupIds($scope);
                if (
                    $refreshed->scopeGroupIds !== $scope->scopeGroupIds
                    || $refreshed->managedRootGroupIds !== $scope->managedRootGroupIds
                ) {
                    EnableyScopeContext::set($refreshed);
                }
            } catch (Throwable) {
                // Mantém escopo em sessão; falha de rede na listagem de grupos não deve derrubar a sessão.
            }
        }

        return $next($request);
    }
}
