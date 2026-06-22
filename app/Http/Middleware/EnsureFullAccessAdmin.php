<?php

namespace App\Http\Middleware;

use App\Support\EnableyScopeContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFullAccessAdmin
{
    /**
     * @param  \Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (EnableyScopeContext::current()->isAdmin()) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Acesso restrito a administradores.'], 403);
        }

        return redirect()->route('home')->with('error', 'Acesso restrito a administradores.');
    }
}
