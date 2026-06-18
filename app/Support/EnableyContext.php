<?php

namespace App\Support;

use App\Models\SubAccount;
use Illuminate\Support\Str;

class EnableyContext
{
    public const SESSION_ACTIVE_SUB_ACCOUNT = 'enabley_active_sub_account';

    /**
     * Resolve o nome exacto na BD / .env para subcontas permitidas (comparação sem distinguir maiúsculas/minúsculas).
     */
    public static function resolveAllowedSubAccountName(string $input): ?string
    {
        $trimmed = trim($input);
        if ($trimmed === '') {
            return null;
        }

        $env = (string) config('enabley.sub_account_name', '');
        if ($env !== '' && Str::lower($trimmed) === Str::lower($env)) {
            return $env;
        }

        $row = SubAccount::query()
            ->whereRaw('LOWER(name) = ?', [Str::lower($trimmed)])
            ->first();

        if ($row !== null) {
            return (string) $row->name;
        }

        return null;
    }

    public static function activeSubAccountName(): string
    {
        $fromSession = session()->get(self::SESSION_ACTIVE_SUB_ACCOUNT);
        if (is_string($fromSession) && $fromSession !== '') {
            $canonical = self::resolveAllowedSubAccountName($fromSession);
            if ($canonical !== null) {
                if ($canonical !== $fromSession) {
                    session()->put(self::SESSION_ACTIVE_SUB_ACCOUNT, $canonical);
                }

                return $canonical;
            }
            session()->forget(self::SESSION_ACTIVE_SUB_ACCOUNT);
        }

        return (string) config('enabley.sub_account_name', '');
    }

    public static function isAllowedSubAccountName(string $name): bool
    {
        return self::resolveAllowedSubAccountName($name) !== null;
    }
}
