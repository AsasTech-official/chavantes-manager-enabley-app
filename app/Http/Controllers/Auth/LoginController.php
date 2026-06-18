<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    /**
     * Display the login view.
     * @return Response
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

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => __('auth.failed'),
                    'errors' => [
                        'username' => [__('auth.failed')],
                    ],
                ], 422);
            }

            return back()->withErrors([
                'username' => __('auth.failed'),
            ])->onlyInput('username');
        }

        $request->session()->regenerate();

        if ($request->expectsJson()) {
            $redirect = $request->session()->pull('url.intended', route('home'));

            return response()->json([
                'user' => $request->user()->only('id', 'username', 'name'),
                'redirect' => $redirect,
            ]);
        }

        return redirect()->intended(route('home'));
    }

    public function destroy(Request $request): JsonResponse|RedirectResponse
    {
        Auth::guard('web')->logout();

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
