<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EnableyAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class LoginController extends Controller
{
    public function __construct(
        private EnableyAuthService $enableyAuth,
    ) {}

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        try {
            $result = $this->enableyAuth->attempt(
                $credentials['username'],
                $credentials['password'],
                $request->boolean('remember'),
            );
        } catch (RuntimeException $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => [
                        'username' => [$e->getMessage()],
                    ],
                ], 422);
            }

            return back()->withErrors([
                'username' => $e->getMessage(),
            ])->onlyInput('username');
        } catch (Throwable $e) {
            $message = $e->getMessage() ?: __('auth.failed');

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $message,
                    'errors' => [
                        'username' => [$message],
                    ],
                ], 422);
            }

            return back()->withErrors([
                'username' => $message,
            ])->onlyInput('username');
        }

        $request->session()->regenerate();

        if ($request->expectsJson()) {
            $user = $result['user'];
            $defaultRoute = $user->role === 'admin' ? route('managers.index') : route('home');
            $redirect = $request->session()->pull('url.intended', $defaultRoute);

            return response()->json([
                'user' => $user->only('id', 'username', 'name', 'role', 'enabley_username', 'enabley_identifier'),
                'redirect' => $redirect,
            ]);
        }

        $user = $result['user'] ?? Auth::user();
        $defaultRoute = $user && $user->role === 'admin' ? route('managers.index') : route('home');
        return redirect()->intended($defaultRoute);
    }

    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        $this->enableyAuth->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'redirect' => route('login'),
            ]);
        }

        return redirect()->route('login');
    }
}
