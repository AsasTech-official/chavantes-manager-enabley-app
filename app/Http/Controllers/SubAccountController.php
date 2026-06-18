<?php

namespace App\Http\Controllers;

use App\Models\SubAccount;
use App\Support\EnableyContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubAccountController extends Controller
{
    public function index(): RedirectResponse
    {
        return redirect()->route('home');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:sub_accounts,name'],
        ]);

        SubAccount::query()->create(['name' => $data['name']]);

        return back();
    }

    public function update(Request $request, SubAccount $subAccount): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:sub_accounts,name,'.$subAccount->id],
        ]);

        $previousName = $subAccount->name;
        $subAccount->update(['name' => $data['name']]);

        $sessionName = session()->get(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT);
        if (is_string($sessionName) && Str::lower($sessionName) === Str::lower($previousName)) {
            session()->put(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT, $data['name']);
        }

        return back();
    }

    public function destroy(SubAccount $subAccount): RedirectResponse
    {
        $sessionName = session()->get(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT);
        if (is_string($sessionName) && Str::lower(trim($sessionName)) === Str::lower(trim($subAccount->name))) {
            session()->forget(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT);
        }

        $subAccount->delete();

        return back();
    }

    /** Define a subconta Enabley ativa para o utilizador (sessão). */
    public function setActive(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);
        $name = EnableyContext::resolveAllowedSubAccountName($data['name']);
        if ($name === null) {
            return back()->with(
                'error',
                'Subconta não reconhecida. Registe o nome em «Nova subconta» (nome igual ao da Enabley) ou use o valor de ENABLEY_SUB_ACCOUNT_NAME no .env.',
            );
        }
        session()->put(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT, $name);

        return back()->with('success', 'Subconta ativa atualizada.');
    }

    /** Volta a usar apenas ENABLEY_SUB_ACCOUNT_NAME do .env (remove escolha da sessão). */
    public function clearActive(Request $request): RedirectResponse
    {
        session()->forget(EnableyContext::SESSION_ACTIVE_SUB_ACCOUNT);

        $usingEnv = (string) config('enabley.sub_account_name', '') !== '';
        $message = $usingEnv
            ? 'Subconta ativa reposta para o valor do .env.'
            : 'Seleção de subconta na sessão foi removida.';

        return back()->with('success', $message);
    }
}
