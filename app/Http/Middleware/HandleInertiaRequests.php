<?php

namespace App\Http\Middleware;

use App\Models\IntegrationSetting;
use App\Support\EnableyContext;
use App\Support\EnableyScopeContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'import_users' => $request->session()->get('import_users'),
            ],
            'auth' => [
                'user' => $request->user()
                    ? $request->user()->only('id', 'username', 'name', 'role', 'enabley_username', 'enabley_identifier', 'must_change_password')
                    : null,
                'accessMode' => $request->user()
                    ? EnableyScopeContext::current()->accessMode
                    : null,
                'enableyUsername' => $request->user()
                    ? EnableyScopeContext::current()->enableyUsername
                    : null,
            ],
            'enabley' => $request->user()
                ? $this->shareEnabley()
                : [
                    'activeSubAccount' => '',
                ],
            'subContasSettings' => $request->user()
                ? $this->shareIntegrationSettings($request)
                : [
                    'hasDefaultUserPassword' => false,
                    'defaultUserPassword' => null,
                ],
        ];
    }

    /**
     * @return array{activeSubAccount: string}
     */
    private function shareEnabley(): array
    {
        return [
            'activeSubAccount' => EnableyContext::activeSubAccountName(),
        ];
    }

    /**
     * @return array{hasDefaultUserPassword: bool, defaultUserPassword: string|null}
     */
    private function shareIntegrationSettings(Request $request): array
    {
        $integration = IntegrationSetting::current();
        $isAdmin = EnableyScopeContext::current()->isAdmin();

        return [
            'hasDefaultUserPassword' => $integration->hasDefaultUserPassword(),
            'defaultUserPassword' => $isAdmin ? $integration->defaultUserPassword() : null,
        ];
    }
}
