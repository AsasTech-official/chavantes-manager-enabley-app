<?php

namespace App\Http\Controllers;

use App\Models\IntegrationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DefaultUserPasswordController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'default_user_password' => ['required', 'string', 'min:8', 'max:255'],
        ]);

        $settings = IntegrationSetting::current();
        $settings->default_user_password = $data['default_user_password'];
        $settings->save();

        return back()->with('success', 'Senha padrão para novos usuários guardada.');
    }

    public function destroy(): RedirectResponse
    {
        $settings = IntegrationSetting::current();
        $settings->default_user_password = null;
        $settings->save();

        return back()->with('success', 'Senha padrão removida.');
    }
}
