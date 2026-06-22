<?php

namespace App\Support;

use Illuminate\Support\Facades\Session;

final class EnableyScopeContext
{
    private const SESSION_KEY = 'enabley_scope';

    public static function set(EnableyScope $scope): void
    {
        Session::put(self::SESSION_KEY, $scope->toSessionArray());
    }

    public static function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    public static function current(): EnableyScope
    {
        $data = Session::get(self::SESSION_KEY);

        if (! is_array($data)) {
            return new EnableyScope(accessMode: 'admin', enableyUsername: null, enableyIdentifier: null);
        }

        return EnableyScope::fromSessionArray($data);
    }
}
