<?php

namespace App\Support;

class EnableyContext
{
    public static function activeSubAccountName(): string
    {
        return (string) config('enabley.sub_account_name', '');
    }
}
