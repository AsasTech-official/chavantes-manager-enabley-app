<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class SystemUserController extends Controller
{
    /**
     * Lista os usuários do sistema (role=admin).
     */
    public function index()
    {
        $systemUsers = User::query()
            ->where('role', 'admin')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
            ]);

        return inertia('SystemUsers/Index', [
            'systemUsers' => $systemUsers,
            'hasDefaultUserPassword' => \App\Models\IntegrationSetting::current()->hasDefaultUserPassword(),
        ]);
    }

    /**
     * Cria um novo usuário do sistema (admin).
     */
    public function store(Request $request)
    {
        $settings = \App\Models\IntegrationSetting::current();
        if (! $settings->hasDefaultUserPassword()) {
            return redirect()->route('system-users.index')->with(
                'error',
                'Defina a senha padrão no Centro de configuração antes de criar usuários do sistema.',
            );
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $passwordToUse = !empty($validated['password'])
            ? $validated['password']
            : $settings->defaultUserPassword();

        $user = User::create([
            'name' => trim($validated['name']),
            'username' => trim($validated['username']),
            'password' => Hash::make($passwordToUse),
            'role' => 'admin',
            'must_change_password' => true,
        ]);

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'system_user_created',
            'description' => "Criou o usuário do sistema: {$user->username}",
        ]);

        return redirect()->back()->with('success', 'Usuário do sistema criado com sucesso.');
    }

    /**
     * Atualiza dados de um usuário do sistema.
     */
    public function update(Request $request, User $systemUser)
    {
        if ($systemUser->role !== 'admin') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($systemUser->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $systemUser->name = trim($validated['name']);
        $systemUser->username = trim($validated['username']);

        if (!empty($validated['password'])) {
            $systemUser->password = Hash::make($validated['password']);
        }

        $systemUser->save();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'system_user_updated',
            'description' => "Atualizou o usuário do sistema: {$systemUser->username}",
        ]);

        return redirect()->back()->with('success', 'Usuário do sistema atualizado com sucesso.');
    }

    /**
     * Exclui um usuário do sistema.
     */
    public function destroy(User $systemUser): JsonResponse
    {
        if ($systemUser->role !== 'admin') {
            abort(403);
        }

        // Impede que o admin exclua a si mesmo
        if ($systemUser->id === auth()->id()) {
            return response()->json([
                'message' => 'Você não pode excluir seu próprio usuário.',
            ], 422);
        }

        $systemUser->delete();

        Log::create([
            'user_id' => auth()->id(),
            'action' => 'system_user_deleted',
            'description' => "Excluiu o usuário do sistema: {$systemUser->username}",
        ]);

        return response()->json([
            'message' => 'Usuário do sistema excluído com sucesso.',
        ]);
    }
}
