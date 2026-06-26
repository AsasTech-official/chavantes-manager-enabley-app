<?php

namespace App\Http\Controllers;

use App\Models\EnableyUserManagerGroup;
use App\Models\IntegrationSetting;
use App\Services\EnableyApiService;
use App\Services\EnableyScopeService;
use App\Support\EnableyScope;
use App\Support\EnableyScopeContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class EnableyUserController extends Controller
{
    /** Papéis aceites pela API Enabley v2 (UserData.possibleRoles). */
    public const POSSIBLE_ROLES = [
        'LEARNER',
        'INSTRUCTOR',
        'EDITOR',
        'MANAGER',
        'SITE_ADMIN',
        'PREVIEW',
        'HR_MANAGER',
        'SITE_TRAINING_MANAGER',
        'EVALUATOR',
    ];

    /** Funções para as quais a UI permite escolher grupos (LEARNER = membro; restantes = entitlements por papel). */
    public const ROLE_GROUPS_KEYS = [
        'LEARNER',
        'INSTRUCTOR',
        'EDITOR',
        'MANAGER',
        'SITE_ADMIN',
        'PREVIEW',
        'HR_MANAGER',
        'SITE_TRAINING_MANAGER',
        'EVALUATOR',
    ];

    public function __construct(
        private EnableyApiService $enabley,
        private EnableyScopeService $scopeService,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $scope = EnableyScopeContext::current();
        $settings = IntegrationSetting::current();
        if (! $settings->hasDefaultUserPassword()) {
            return redirect()->route('users.index')->with(
                'error',
                'Defina a senha padrão no Centro de configuração antes de criar usuários na Enabley.',
            );
        }

        $rawEmail = $request->input('email');
        $request->merge([
            'email' => is_string($rawEmail) && trim($rawEmail) !== '' ? trim($rawEmail) : null,
        ]);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'possible_roles' => ['required', 'array', 'size:1'],
            'possible_roles.0' => ['required', 'string', Rule::in(['LEARNER'])],
            'role_groups' => ['nullable', 'array'],
        ]);

        $first = mb_strtoupper(trim($data['first_name']), 'UTF-8');
        $last = mb_strtoupper(trim($data['last_name']), 'UTF-8');
        /** @var string $password */
        $password = $settings->defaultUserPassword();
        $roles = array_values(array_unique($data['possible_roles']));
        $roleGroupsToApply = $this->validatedRoleGroupsMap($request, $roles, $scope);

        try {
            $email = isset($data['email']) && is_string($data['email'])
                ? mb_strtolower(trim($data['email']), 'UTF-8')
                : null;

            $created = $this->enabley->createUser(
                firstName: $first,
                lastName: $last,
                username: trim($data['username']),
                email: $email,
                address: '—',
                possibleRoles: $roles,
                password: $password,
            );
            $userId = $created['identifier'] ?? '';
            if (! is_string($userId) || $userId === '') {
                throw new RuntimeException('A API Enabley não devolveu o identificador do novo usuário.');
            }

            foreach ($roleGroupsToApply['LEARNER'] ?? [] as $groupId) {
                $this->enabley->assignUserToGroup($userId, $groupId, false);
            }

            $learnerGroupsById = array_flip(array_values($roleGroupsToApply['LEARNER'] ?? []));
            foreach (array_diff(self::ROLE_GROUPS_KEYS, ['LEARNER']) as $rk) {
                foreach ($roleGroupsToApply[$rk] ?? [] as $groupId) {
                    // O utilizador deve estar associado ao grupo (membro) antes do entitlement de papel sobre o grupo na v2 — exceto quando já marcámos esse grupo como aluno.
                    if (! isset($learnerGroupsById[$groupId])) {
                        $this->enabley->assignUserToGroup($userId, $groupId, false);
                    }
                    $this->enabley->addUserGroupEntitlement($userId, $groupId, $rk);
                    if ($rk === 'MANAGER') {
                        $this->enabley->persistUserManagerGroups($userId, array_merge(
                            [$groupId],
                            EnableyUserManagerGroup::query()
                                ->where('enabley_user_identifier', $userId)
                                ->pluck('group_identifier')
                                ->all()
                        ));
                    }
                }
            }
        } catch (Throwable $e) {
            return redirect()->route('users.index')->with('error', $e->getMessage());
        }

        return redirect()->route('users.index')->with('success', 'Usuário criado.');
    }

    public function update(Request $request, string $identifier): RedirectResponse
    {
        $identifier = trim($identifier);
        if ($identifier === '') {
            abort(404);
        }

        $scope = EnableyScopeContext::current();

        try {
            $this->scopeService->assertUserInScope($identifier, $scope);
        } catch (RuntimeException $e) {
            return redirect()->route('users.index')->with('error', $e->getMessage());
        }

        $rawEmail = $request->input('email');
        $request->merge([
            'email' => is_string($rawEmail) && trim($rawEmail) !== '' ? trim($rawEmail) : null,
        ]);

        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'possible_roles' => ['required', 'array', 'min:1'],
            'possible_roles.*' => ['required', 'string', 'max:80', 'regex:/^[A-Z][A-Z0-9_]*$/'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['required', 'boolean'],
            'status_only' => ['sometimes', 'boolean'],
            'role_groups' => ['nullable', 'array'],
        ]);

        $first = mb_strtoupper(trim($data['first_name']), 'UTF-8');
        $last = mb_strtoupper(trim($data['last_name']), 'UTF-8');
        $roles = array_values(array_unique($data['possible_roles']));
        $address = isset($data['address']) && is_string($data['address']) && trim($data['address']) !== ''
            ? trim($data['address'])
            : '—';

        $statusOnly = $request->boolean('status_only');
        $learnerGroupsToApply = [];
        if (! $statusOnly) {
            $learnerGroupsToApply = $this->validatedLearnerRoleGroupsOnly($request, $roles, $scope);
        }

        try {
            $email = isset($data['email']) && is_string($data['email'])
                ? mb_strtolower(trim($data['email']), 'UTF-8')
                : null;

            $this->enabley->putUser(
                identifier: $identifier,
                firstName: $first,
                lastName: $last,
                username: trim($data['username']),
                email: $email,
                address: $address,
                possibleRoles: $roles,
                isActive: $data['is_active'],
                password: null,
            );

            if (! $statusOnly) {
                $this->syncUserLearnerGroupsOnly($identifier, $roles, $learnerGroupsToApply);
            }
        } catch (Throwable $e) {
            return redirect()->route('users.index')->with('error', $e->getMessage());
        }

        $message = match (true) {
            ! $data['is_active'] => 'Usuário inativado.',
            $data['is_active'] && $statusOnly => 'Usuário ativado.',
            default => 'Usuário atualizado.',
        };

        return redirect()->route('users.index')->with('success', $message);
    }

    /**
     * @param  list<string>  $roles  Papéis do utilizador (possible_roles).
     * @return array<string, list<string>>
     */
    private function validatedRoleGroupsMap(Request $request, array $roles, EnableyScope $scope): array
    {
        $validGroupIds = array_column($this->scopeService->filterFlatGroups($this->enabley->listFlatGroups(), $scope), 'identifier');
        $inputRg = $request->input('role_groups', []);
        if (! is_array($inputRg)) {
            throw ValidationException::withMessages([
                'role_groups' => 'Formato inválido.',
            ]);
        }
        $roleGroupsToApply = [];
        foreach (self::ROLE_GROUPS_KEYS as $rk) {
            if (! in_array($rk, $roles, true)) {
                continue;
            }
            $ids = $inputRg[$rk] ?? [];
            if (! is_array($ids)) {
                throw ValidationException::withMessages([
                    'role_groups.'.$rk => 'Formato inválido.',
                ]);
            }
            $clean = [];
            foreach ($ids as $id) {
                if (! is_string($id) || $id === '') {
                    throw ValidationException::withMessages([
                        'role_groups.'.$rk => 'Identificador de grupo inválido.',
                    ]);
                }
                if ($validGroupIds !== [] && ! in_array($id, $validGroupIds, true)) {
                    throw ValidationException::withMessages([
                        'role_groups.'.$rk => 'Grupo inválido ou não pertence à subconta.',
                    ]);
                }
                $clean[$id] = true;
            }
            $roleGroupsToApply[$rk] = array_keys($clean);
        }

        return $roleGroupsToApply;
    }

    /**
     * @param  array<string, list<array{identifier: string, name: string}>>  $map
     * @return list<string>
     */
    private function roleGroupIdsFromMap(array $map, string $role): array
    {
        $ids = [];
        foreach ($map[$role] ?? [] as $entry) {
            if (is_array($entry) && isset($entry['identifier']) && is_string($entry['identifier']) && $entry['identifier'] !== '') {
                $ids[] = $entry['identifier'];
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * Valida só `role_groups.LEARNER` (edição de utilizador: apenas grupos de aluno).
     *
     * @param  list<string>  $roles
     * @return list<string>
     */
    private function validatedLearnerRoleGroupsOnly(Request $request, array $roles, EnableyScope $scope): array
    {
        if (! in_array('LEARNER', $roles, true)) {
            return [];
        }

        $validGroupIds = array_column($this->scopeService->filterFlatGroups($this->enabley->listFlatGroups(), $scope), 'identifier');
        $inputRg = $request->input('role_groups', []);
        if (! is_array($inputRg)) {
            throw ValidationException::withMessages([
                'role_groups' => 'Formato inválido.',
            ]);
        }

        $ids = $inputRg['LEARNER'] ?? [];
        if (! is_array($ids)) {
            throw ValidationException::withMessages([
                'role_groups.LEARNER' => 'Formato inválido.',
            ]);
        }

        $clean = [];
        foreach ($ids as $id) {
            if (! is_string($id) || $id === '') {
                throw ValidationException::withMessages([
                    'role_groups.LEARNER' => 'Identificador de grupo inválido.',
                ]);
            }
            if ($validGroupIds !== [] && ! in_array($id, $validGroupIds, true)) {
                throw ValidationException::withMessages([
                    'role_groups.LEARNER' => 'Grupo inválido ou não pertence à subconta.',
                ]);
            }
            $clean[$id] = true;
        }

        return array_keys($clean);
    }

    /**
     * Identificadores de grupo em que o utilizador tem algum papel que não é aluno (estado atual na API).
     *
     * @param  array<string, list<array{identifier: string, name: string}>>  $currentMap
     * @param  list<string>  $roles
     * @return list<string>
     */
    private function groupIdsWhereUserHasNonLearnerRole(array $currentMap, array $roles): array
    {
        $u = [];
        foreach (array_diff(self::ROLE_GROUPS_KEYS, ['LEARNER']) as $rk) {
            if (! in_array($rk, $roles, true)) {
                continue;
            }
            foreach ($this->roleGroupIdsFromMap($currentMap, $rk) as $gid) {
                $u[$gid] = true;
            }
        }

        return array_keys($u);
    }

    /**
     * Sincroniza apenas associação como aluno a grupos; não altera entitlements (instrutor, etc.).
     *
     * @param  list<string>  $roles
     * @param  list<string>  $desiredLearnerGroupIds
     */
    private function syncUserLearnerGroupsOnly(string $userId, array $roles, array $desiredLearnerGroupIds): void
    {
        if (! in_array('LEARNER', $roles, true)) {
            return;
        }

        $currentMap = $this->enabley->listUserRoleGroupsMap($userId);
        $curLearner = $this->roleGroupIdsFromMap($currentMap, 'LEARNER');
        $des = array_values(array_unique($desiredLearnerGroupIds));

        $nonLearnerGroupIds = $this->groupIdsWhereUserHasNonLearnerRole($currentMap, $roles);

        $toRemove = array_values(array_diff($curLearner, $des));
        foreach ($toRemove as $gid) {
            if (in_array($gid, $nonLearnerGroupIds, true)) {
                continue;
            }
            $this->enabley->removeUserFromGroup($userId, $gid);
        }

        $toAdd = array_values(array_diff($des, $curLearner));
        foreach ($toAdd as $gid) {
            $this->enabley->assignUserToGroup($userId, $gid, false);
        }
    }
}
