<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EnableyUserManagerGroup;
use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScopeContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Throwable;

class ManagerController extends Controller
{
    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    /**
     * Retorna a lista de gerentes (users com role=manager), seus grupos, e todos os grupos possíveis.
     */
    public function index()
    {
        $managers = User::query()
            ->where('role', 'manager')
            ->with('groups')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'groups' => $user->groups->map(fn ($g) => [
                    'id' => $g->id,
                    'group_identifier' => $g->group_identifier,
                    'group_name' => $g->group_name,
                ]),
            ]);

        $groups = [];
        try {
            $scope = EnableyScopeContext::current();
            $flat = $this->scopeService->filterFlatGroups(
                $this->enabley->listFlatGroupsWithParents(),
                $scope
            );
            $validTypes = config('enabley.manager_root_group_types', ['UNIDADE', 'EIXO']);
            $groups = array_values(array_filter($flat, fn ($g) => in_array($g['type'] ?? '', $validTypes, true)));
            
            // Sort groups alphabetically
            usort($groups, fn ($a, $b) => strcasecmp($a['name'] ?? '', $b['name'] ?? ''));
        } catch (Throwable) {
            // ignore
        }

        return inertia('Managers/Index', [
            'managers' => $managers,
            'groups' => $groups,
        ]);
    }

    /**
     * Cria um novo gerente localmente.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'username' => trim($validated['username']),
            'password' => Hash::make($validated['password']),
            'role' => 'manager',
        ]);

        return response()->json([
            'message' => 'Gerente criado com sucesso.',
            'manager' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'groups' => [],
            ],
        ], 201);
    }

    /**
     * Atualiza dados de um gerente.
     */
    public function update(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== 'manager') {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required', 'string', 'max:255',
                Rule::unique('users', 'username')->ignore($manager->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $manager->name = trim($validated['name']);
        $manager->username = trim($validated['username']);
        
        if (!empty($validated['password'])) {
            $manager->password = Hash::make($validated['password']);
        }

        $manager->save();

        return response()->json([
            'message' => 'Gerente atualizado com sucesso.',
        ]);
    }

    /**
     * Exclui um gerente localmente.
     */
    public function destroy(User $manager): JsonResponse
    {
        if ($manager->role !== 'manager') {
            abort(403);
        }

        $manager->delete();

        return response()->json([
            'message' => 'Gerente excluído com sucesso.',
        ]);
    }

    /**
     * Atualiza os grupos aos quais um gerente tem acesso.
     */
    public function updateGroups(Request $request, User $manager): JsonResponse
    {
        if ($manager->role !== 'manager') {
            abort(403);
        }

        $validated = $request->validate([
            'groups' => ['array'],
            'groups.*.group_identifier' => ['required', 'string'],
            'groups.*.group_name' => ['nullable', 'string'],
        ]);

        $manager->groups()->delete();

        $newAssignments = [];
        foreach ($validated['groups'] ?? [] as $group) {
            $newAssignments[] = [
                'group_identifier' => $group['group_identifier'],
                'group_name' => $group['group_name'] ?? '',
            ];
        }

        if (!empty($newAssignments)) {
            $manager->groups()->createMany($newAssignments);
        }

        return response()->json([
            'message' => 'Grupos atualizados com sucesso.',
            'groups' => $manager->groups,
        ]);
    }
}
