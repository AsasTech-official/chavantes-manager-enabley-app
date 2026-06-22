<?php

namespace App\Services;

use App\Models\EnableyUserManagerGroup;
use App\Support\EnableyContext;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class EnableyApiService
{
    public function requestToken(): string
    {
        $key = config('enabley.client_key');
        $secret = config('enabley.secret');
        if (! $key || ! $secret) {
            throw new RuntimeException('ENABLEY_CLIENT_KEY e ENABLEY_SECRET têm de estar definidos no .env.');
        }

        $url = config('enabley.base_url').'/api/v1/token?'.http_build_query([
            'clientKey' => $key,
            'secret' => $secret,
        ]);

        $response = $this->enableyPending()->post($url);

        if (! $response->successful()) {
            $this->throwForResponse('Token Enabley', $response);
        }

        $token = $response->json('access_token');
        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Resposta de token inválida da API Enabley.');
        }

        return $token;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAllUsers(?string $token = null): array
    {
        $token ??= $this->requestToken();

        $v3 = $this->listUsersV3($token);
        if ($v3 !== null) {
            return $v3;
        }

        return $this->listUsersV2($token);
    }

    /**
     * Usuários da subconta ativa para a UI (preserva todos os campos devolvidos pela API Enabley).
     *
     * @return list<array<string, mixed>>
     */
    public function listUsersSimplified(?string $token = null): array
    {
        $this->ensureScriptBudgetForEnableyHeavyWork();
        $token ??= $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $raw = $this->listAllUsers($token);
        [, $groupsForRolesByUserId] = $this->fetchUserIdentifiersPerGroup($token, $raw, $sub, $base);
        foreach ($raw as &$u) {
            if (! is_array($u)) {
                continue;
            }
            $id = $u['identifier'] ?? '';
            $u['groupsForRoles'] = is_string($id) && $id !== ''
                ? ($groupsForRolesByUserId[$id] ?? [])
                : [];
        }
        unset($u);

        $out = [];
        foreach ($raw as $u) {
            if (is_array($u)) {
                $out[] = $this->simplifyUser($u);
            }
        }
        usort($out, function (array $a, array $b): int {
            $da = trim(($a['lastName'] ?? '').' '.($a['firstName'] ?? '').' '.($a['username'] ?? '').' '.($a['email'] ?? ''));
            $db = trim(($b['lastName'] ?? '').' '.($b['firstName'] ?? '').' '.($b['username'] ?? '').' '.($b['email'] ?? ''));
            $cmp = strcasecmp($da, $db);
            if ($cmp !== 0) {
                return $cmp;
            }

            return strcasecmp($a['identifier'] ?? '', $b['identifier'] ?? '');
        });

        return $out;
    }

    /**
     * @return null|list<array<string, mixed>> null se a rota v3 não estiver disponível
     */
    private function listUsersV3(string $token): ?array
    {
        $base = config('enabley.base_url');
        $sub = EnableyContext::activeSubAccountName();
        if ($sub === '') {
            throw new RuntimeException('Defina a subconta (ENABLEY_SUB_ACCOUNT_NAME no .env) para listar usuários.');
        }

        $all = [];
        $paginationKey = null;
        for ($i = 0; $i < 500; $i++) {
            $query = array_filter(
                [
                    'subAccountName' => $sub,
                    'paginationKey' => $paginationKey,
                ],
                static fn (mixed $v) => $v !== null && $v !== ''
            );

            $response = $this->enableyPending($token)
                ->get($base.'/api/v3/users', $query);

            if ($response->status() === 404) {
                if ($i === 0) {
                    return null;
                }
                $this->throwForResponse('Listagem v3 /api/v3/users (paginação)', $response);
            }
            if (! $response->successful()) {
                $this->throwForResponse('Listagem v3 /api/v3/users', $response);
            }

            $data = $response->json();
            $items = $data['items'] ?? [];
            if (is_array($items)) {
                foreach ($items as $row) {
                    if (is_array($row)) {
                        $all[] = $row;
                    }
                }
            }

            $next = $data['paginationKey'] ?? null;
            if (! is_string($next) || $next === '') {
                return $all;
            }
            $paginationKey = $next;
        }

        return $all;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listUsersV2(string $token): array
    {
        $base = config('enabley.base_url');
        $sub = EnableyContext::activeSubAccountName();
        if ($sub === '') {
            throw new RuntimeException('Defina a subconta (ENABLEY_SUB_ACCOUNT_NAME no .env) para listar usuários.');
        }

        $all = [];
        $start = 0;
        $limit = 200;
        for ($page = 0; $page < 500; $page++) {
            $response = $this->enableyPending($token)
                ->get($base.'/api/v2/users', [
                    'subAccountName' => $sub,
                    'limit' => $limit,
                    'start' => $start,
                ]);

            if (! $response->successful()) {
                $this->throwForResponse('Listagem v2 /api/v2/users', $response);
            }

            $chunk = $response->json();
            if (! is_array($chunk)) {
                break;
            }

            if (isset($chunk['items']) && is_array($chunk['items'])) {
                $chunk = $chunk['items'];
            }

            if ($chunk === []) {
                break;
            }

            $n = 0;
            foreach ($chunk as $row) {
                if (is_array($row)) {
                    $all[] = $row;
                    $n++;
                }
            }
            if ($n < $limit) {
                break;
            }
            $start += $limit;
        }

        return $all;
    }

    /**
     * Grupos em árvore (por parentIdentifier) com usuários por grupo
     * (vinda de GET /api/v1/users/{id}/groups por cada usuário).
     *
     * @return array{
     *     tree: list<array<string, mixed>>,
     *     unassigned: list<array<string, mixed>>,
     *     unknownGroupMemberships: list<array{groupId: string, users: list<array<string, mixed>>}>
     * }
     */
    public function getGroupTreeWithUsers(?string $token = null): array
    {
        $this->ensureScriptBudgetForEnableyHeavyWork();
        $token ??= $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $groupList = $this->enableyPending($token)
            ->get($base.'/api/v1/groups/list', array_filter(['subAccountName' => $sub]));

        if (! $groupList->successful()) {
            $this->throwForResponse('Grupos /api/v1/groups/list', $groupList);
        }

        $rawGroups = $groupList->json();
        if (! is_array($rawGroups)) {
            $rawGroups = [];
        }

        $users = $this->listAllUsers($token);
        [$byGroupId, $groupsForRolesByUserId] = $this->fetchUserIdentifiersPerGroup($token, $users, $sub, $base);
        foreach ($users as &$u) {
            if (! is_array($u)) {
                continue;
            }
            $id = $u['identifier'] ?? '';
            $u['groupsForRoles'] = is_string($id) && $id !== ''
                ? ($groupsForRolesByUserId[$id] ?? [])
                : [];
        }
        unset($u);

        return $this->buildGroupTreePayload($rawGroups, $byGroupId, $users);
    }

    /**
     * Tipos de grupo na ordem da hierarquia (GET /api/v1/groups/hierarchy).
     *
     * @return list<string>
     */
    public function getGroupHierarchy(?string $token = null): array
    {
        $token ??= $this->requestToken();
        $base = config('enabley.base_url');

        $response = $this->enableyPending($token)
            ->get($base.'/api/v1/groups/hierarchy');

        if (! $response->successful()) {
            $this->throwForResponse('Hierarquia /api/v1/groups/hierarchy', $response);
        }

        $data = $response->json();
        if (! is_array($data)) {
            return [];
        }

        $out = [];
        foreach ($data as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * Tipo do novo grupo: filho imediato do tipo do pai na hierarquia devolvida pela API.
     *
     * @param  list<string>  $hierarchy
     */
    public function resolveTypeForNewGroup(?string $parentType, array $hierarchy): string
    {
        if ($hierarchy === []) {
            throw new RuntimeException('A API Enabley não devolveu tipos na hierarquia de grupos.');
        }

        if ($parentType === null || $parentType === '') {
            return $hierarchy[0];
        }

        $idx = array_search($parentType, $hierarchy, true);
        if ($idx === false) {
            return $hierarchy[min(1, count($hierarchy) - 1)];
        }

        $next = $idx + 1;

        return $hierarchy[$next] ?? $hierarchy[$idx];
    }

    /**
     * Cria um grupo (PUT /api/v1/groups) com corpo JSON plano (GroupData). O identificador é um UUID gerado aqui.
     *
     * @return array<string, mixed>
     */
    public function createGroup(string $name, string $type, ?string $parentIdentifier = null, ?string $identifier = null): array
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $identifier ??= (string) Str::uuid();

        $groupUpdate = [
            'identifier' => $identifier,
            'name' => $name,
            'type' => $type,
            'subAccountName' => $sub,
        ];

        if ($parentIdentifier !== null && $parentIdentifier !== '') {
            $groupUpdate['parentIdentifier'] = $parentIdentifier;
        }

        $response = $this->enableyPending($token)
            ->asJson()
            ->put($base.'/api/v1/groups', $groupUpdate);

        if (! $response->successful()) {
            $this->throwForResponse('Criar ou atualizar grupo PUT /api/v1/groups', $response);
        }

        $json = $response->json();
        $arr = is_array($json) ? $json : [];
        $id = $arr['identifier'] ?? null;
        if (! is_string($id) || $id === '') {
            $arr['identifier'] = $identifier;
        }

        return $arr;
    }

    /**
     * Atualiza um grupo existente (PUT /api/v1/groups com o mesmo identifier).
     *
     * @return array<string, mixed>
     */
    public function updateGroup(string $identifier, string $name, string $type, ?string $parentIdentifier = null): array
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $payload = [
            'identifier' => $identifier,
            'name' => $name,
            'type' => $type,
            'subAccountName' => $sub,
        ];

        if ($parentIdentifier !== null && $parentIdentifier !== '') {
            $payload['parentIdentifier'] = $parentIdentifier;
        }

        $response = $this->enableyPending($token)
            ->asJson()
            ->put($base.'/api/v1/groups', $payload);

        if (! $response->successful()) {
            $this->throwForResponse('Atualizar grupo PUT /api/v1/groups', $response);
        }

        $json = $response->json();

        return is_array($json) ? $json : [];
    }

    /**
     * Cria ou atualiza um usuário Enabley (PUT /api/v2/users).
     *
     * @param  list<string>  $possibleRoles
     * @param  ?string  $email  Omitido no JSON se null ou vazio.
     * @return array<string, mixed>
     */
    public function putUser(
        string $identifier,
        string $firstName,
        string $lastName,
        string $username,
        ?string $email,
        string $address,
        array $possibleRoles,
        bool $isActive,
        ?string $password = null,
    ): array {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $payload = [
            'identifier' => $identifier,
            'subAccountName' => $sub,
            'firstName' => $firstName,
            'lastName' => $lastName,
            'username' => $username,
            'address' => $address,
            'possibleRoles' => array_values($possibleRoles),
            'isActive' => $isActive,
        ];

        if ($email !== null && $email !== '') {
            $payload['email'] = $email;
        }

        if ($password !== null && $password !== '') {
            $payload['password'] = $password;
        }

        $response = $this->enableyPending($token)
            ->asJson()
            ->put($base.'/api/v2/users', $payload);

        if (! $response->successful()) {
            $this->throwForResponse('Criar ou atualizar usuário PUT /api/v2/users', $response);
        }

        $json = $response->json();
        $arr = is_array($json) ? $json : [];
        if (! isset($arr['identifier']) || ! is_string($arr['identifier']) || $arr['identifier'] === '') {
            $arr['identifier'] = $identifier;
        }

        return $arr;
    }

    /**
     * Novo utilizador (UUID gerado se não passar identifier).
     *
     * @param  list<string>  $possibleRoles
     */
    public function createUser(
        string $firstName,
        string $lastName,
        string $username,
        ?string $email,
        string $address,
        array $possibleRoles,
        ?string $password = null,
        ?string $identifier = null,
    ): array {
        $identifier ??= (string) Str::uuid();

        return $this->putUser(
            identifier: $identifier,
            firstName: $firstName,
            lastName: $lastName,
            username: $username,
            email: $email,
            address: $address,
            possibleRoles: $possibleRoles,
            isActive: true,
            password: $password,
        );
    }

    /**
     * Lista plana de grupos da subconta (GET /api/v1/groups/list).
     *
     * @return list<array{identifier: string, name: string, type: string|null}>
     */
    public function listFlatGroups(?string $token = null): array
    {
        $this->ensureScriptBudgetForEnableyHeavyWork();
        $token ??= $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $groupList = $this->enableyPending($token)
            ->get($base.'/api/v1/groups/list', array_filter(['subAccountName' => $sub]));

        if (! $groupList->successful()) {
            $this->throwForResponse('Grupos /api/v1/groups/list', $groupList);
        }

        $raw = $groupList->json();
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $g) {
            if (! is_array($g) || ! isset($g['identifier']) || ! is_string($g['identifier']) || $g['identifier'] === '') {
                continue;
            }
            $name = is_string($g['name'] ?? null) ? $g['name'] : $g['identifier'];
            $type = $g['type'] ?? null;
            $out[] = [
                'identifier' => $g['identifier'],
                'name' => $name,
                'type' => is_string($type) ? $type : null,
            ];
        }
        usort($out, function (array $a, array $b): int {
            return strcasecmp($a['name'], $b['name']);
        });

        return $out;
    }

    /**
     * Lista plana de grupos incluindo parentIdentifier (para expansão de subárvore).
     *
     * @return list<array{identifier: string, name: string, type: string|null, parentIdentifier: string|null}>
     */
    public function listFlatGroupsWithParents(?string $token = null): array
    {
        $this->ensureScriptBudgetForEnableyHeavyWork();
        $token ??= $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $groupList = $this->enableyPending($token)
            ->get($base.'/api/v1/groups/list', array_filter(['subAccountName' => $sub]));

        if (! $groupList->successful()) {
            $this->throwForResponse('Grupos /api/v1/groups/list', $groupList);
        }

        $raw = $groupList->json();
        if (! is_array($raw)) {
            return [];
        }

        $out = [];
        foreach ($raw as $g) {
            if (! is_array($g) || ! isset($g['identifier']) || ! is_string($g['identifier']) || $g['identifier'] === '') {
                continue;
            }
            $name = is_string($g['name'] ?? null) ? $g['name'] : $g['identifier'];
            $type = $g['type'] ?? null;
            $parent = $g['parentIdentifier'] ?? null;
            $out[] = [
                'identifier' => $g['identifier'],
                'name' => $name,
                'type' => is_string($type) ? $type : null,
                'parentIdentifier' => is_string($parent) && $parent !== '' ? $parent : null,
            ];
        }

        return $out;
    }

    /**
     * Localiza um utilizador Enabley pelo username exato na subconta ativa.
     *
     * @return array<string, mixed>|null
     */
    public function findUserByUsername(string $username, ?string $token = null): ?array
    {
        $username = trim($username);
        if ($username === '') {
            return null;
        }

        $token ??= $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $paginationKey = null;

        for ($i = 0; $i < 500; $i++) {
            $query = array_filter(
                [
                    'subAccountName' => $sub,
                    'usernameSubstring' => $username,
                    'paginationKey' => $paginationKey,
                ],
                static fn (mixed $v) => $v !== null && $v !== ''
            );

            $response = $this->enableyPending($token)
                ->get($base.'/api/v3/users', $query);

            if (! $response->successful()) {
                $this->throwForResponse('Busca por username GET /api/v3/users', $response);
            }

            $data = $response->json();
            if (! is_array($data)) {
                return null;
            }

            $items = $data['items'] ?? [];
            if (is_array($items)) {
                foreach ($items as $row) {
                    if (! is_array($row)) {
                        continue;
                    }
                    $rowUsername = $row['username'] ?? null;
                    if (is_string($rowUsername) && strcasecmp(trim($rowUsername), $username) === 0) {
                        return $row;
                    }
                }
            }

            $next = $data['paginationKey'] ?? null;
            if (! is_string($next) || $next === '') {
                return null;
            }
            $paginationKey = $next;
        }

        return null;
    }

    /**
     * Associa o utilizador ao grupo (membro; papel de aluno naquele grupo). POST /api/v1/groups/{group}/users/{user}.
     *
     * @param  bool  $replaceAllMappings  Se true, remove outras associações do utilizador a grupos (query replace=true).
     */
    public function assignUserToGroup(string $userIdentifier, string $groupIdentifier, bool $replaceAllMappings = false): void
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $path = '/api/v1/groups/'.rawurlencode($groupIdentifier).'/users/'.rawurlencode($userIdentifier);
        $query = ['subAccountName' => $sub];
        if ($replaceAllMappings) {
            $query['replace'] = 'true';
        }
        $url = $base.$path.'?'.http_build_query($query);

        $response = $this->enableyPending($token)
            ->post($url);

        if (! $response->successful()) {
            $this->throwForResponse('Associar usuário ao grupo POST /api/v1/groups/{group}/users/{user}', $response);
        }
    }

    /**
     * Remove o utilizador do grupo (membro). DELETE /api/v1/groups/{group}/users/{user}.
     */
    public function removeUserFromGroup(string $userIdentifier, string $groupIdentifier): void
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $path = '/api/v1/groups/'.rawurlencode($groupIdentifier).'/users/'.rawurlencode($userIdentifier);
        $url = $base.$path.'?'.http_build_query(['subAccountName' => $sub]);

        $response = $this->enableyPending($token)
            ->delete($url);

        if (! $response->successful()) {
            $this->throwForResponse('Remover usuário do grupo DELETE /api/v1/groups/{group}/users/{user}', $response);
        }
    }

    /**
     * Grupos por papel (GET /api/v1/users/{id}/groups), mesmo formato que {@see groupsForRolesFromUserGroupsList}.
     *
     * @return array<string, list<array{identifier: string, name: string}>>
     */
    public function listUserRoleGroupsMap(string $userIdentifier): array
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');

        $response = $this->enableyPending($token)
            ->get($base.'/api/v1/users/'.rawurlencode($userIdentifier).'/groups', array_filter([
                'subAccountName' => $sub,
            ]));

        if (! $response->successful()) {
            $this->throwForResponse('Grupos do utilizador GET /api/v1/users/{id}/groups', $response);
        }

        $glist = $response->json();
        if (! is_array($glist)) {
            return [];
        }

        return $this->groupsForRolesFromUserGroupsList($glist);
    }

    /**
     * Atribui um papel Enabley ao utilizador num grupo (POST /api/v2/users/entitlements).
     * LEARNER não usa este método — usa-se assignUserToGroup.
     */
    public function addUserGroupEntitlement(string $userIdentifier, string $groupIdentifier, string $userRole): void
    {
        $allowed = ['INSTRUCTOR', 'EDITOR', 'MANAGER', 'SITE_ADMIN', 'PREVIEW', 'HR_MANAGER', 'SITE_TRAINING_MANAGER', 'EVALUATOR'];
        if (! in_array($userRole, $allowed, true)) {
            throw new RuntimeException('Papel de entitlement inválido para grupo: '.$userRole);
        }

        $token = $this->requestToken();
        $base = config('enabley.base_url');

        $response = $this->enableyPending($token)
            ->asJson()
            ->post($base.'/api/v2/users/entitlements', [
                'userIdentifier' => $userIdentifier,
                'entityIdentifier' => $groupIdentifier,
                'entityType' => 'GROUP',
                'userRole' => $userRole,
            ]);

        if (! $response->successful()) {
            $this->throwForResponse('Adicionar papel no grupo POST /api/v2/users/entitlements', $response);
        }
    }

    /**
     * Remove entitlement de papel no grupo (DELETE /api/v2/users/entitlements).
     */
    public function removeUserGroupEntitlement(string $userIdentifier, string $groupIdentifier, string $userRole): void
    {
        $allowed = ['INSTRUCTOR', 'EDITOR', 'MANAGER', 'SITE_ADMIN', 'PREVIEW', 'HR_MANAGER', 'SITE_TRAINING_MANAGER', 'EVALUATOR'];
        if (! in_array($userRole, $allowed, true)) {
            throw new RuntimeException('Papel de entitlement inválido para grupo: '.$userRole);
        }

        $token = $this->requestToken();
        $base = config('enabley.base_url');

        $response = $this->enableyPending($token)
            ->asJson()
            ->delete($base.'/api/v2/users/entitlements', [
                'userIdentifier' => $userIdentifier,
                'entityIdentifier' => $groupIdentifier,
                'entityType' => 'GROUP',
                'userRole' => $userRole,
            ]);

        if (! $response->successful()) {
            $this->throwForResponse('Remover papel no grupo DELETE /api/v2/users/entitlements', $response);
        }
    }

    /**
     * Remove um grupo (DELETE /api/v1/groups/{identifier}).
     */
    public function deleteGroup(string $identifier): void
    {
        $token = $this->requestToken();
        $sub = $this->requireSubAccountName();
        $base = config('enabley.base_url');
        $url = $base.'/api/v1/groups/'.rawurlencode($identifier);

        $response = $this->enableyPending($token)
            ->delete($url, [
                'subAccountName' => $sub,
            ]);

        if (! $response->successful()) {
            $this->throwForResponse('Apagar grupo DELETE /api/v1/groups/{identifier}', $response);
        }
    }

    private function ensureScriptBudgetForEnableyHeavyWork(): void
    {
        $secs = max(90, min(7200, (int) config('enabley.script_max_seconds', 480)));
        if (function_exists('set_time_limit')) {
            @set_time_limit($secs);
        }
    }

    private function httpTimeoutSeconds(): int
    {
        return max(10, min(600, (int) config('enabley.http_timeout', 28)));
    }

    private function httpConnectTimeoutSeconds(): int
    {
        return max(3, min(120, (int) config('enabley.http_connect_timeout', 12)));
    }

    private function enableyPending(?string $token = null): PendingRequest
    {
        $pending = Http::acceptJson()
            ->timeout($this->httpTimeoutSeconds())
            ->connectTimeout($this->httpConnectTimeoutSeconds());

        if ($token !== null && $token !== '') {
            $pending = $pending->withToken($token);
        }

        return $pending;
    }

    private function requireSubAccountName(): string
    {
        $sub = EnableyContext::activeSubAccountName();
        if ($sub === '') {
            throw new RuntimeException('Defina a subconta (ENABLEY_SUB_ACCOUNT_NAME no .env).');
        }

        return $sub;
    }

    /**
     * Grupos raiz onde o utilizador é gerente (MANAGER explícito na API + cache local de entitlements).
     *
     * @param  list<string>  $possibleRoles
     * @return list<string>
     */
    public function listUserManagerRootGroupIds(string $userIdentifier, array $possibleRoles = []): array
    {
        $groupsForRoles = $this->listUserRoleGroupsMap($userIdentifier);
        $explicit = $this->extractExplicitManagerGroupIds($groupsForRoles);

        $persisted = EnableyUserManagerGroup::query()
            ->where('enabley_user_identifier', $userIdentifier)
            ->pluck('group_identifier')
            ->all();

        $merged = array_values(array_unique([...$explicit, ...$persisted]));

        if (in_array('MANAGER', $possibleRoles, true)) {
            $discovered = $this->discoverManagerEntitlementGroupIds($userIdentifier);
            if ($discovered !== []) {
                $merged = array_values(array_unique([...$merged, ...$discovered]));
                $this->persistUserManagerGroups($userIdentifier, $merged);
            }
        }

        return $merged;
    }

    /**
     * @param  list<string>  $groupIds
     */
    public function persistUserManagerGroups(string $userIdentifier, array $groupIds): void
    {
        $groupIds = array_values(array_unique(array_filter($groupIds, fn ($id) => is_string($id) && $id !== '')));
        if ($groupIds === []) {
            EnableyUserManagerGroup::query()
                ->where('enabley_user_identifier', $userIdentifier)
                ->delete();

            return;
        }

        EnableyUserManagerGroup::query()
            ->where('enabley_user_identifier', $userIdentifier)
            ->whereNotIn('group_identifier', $groupIds)
            ->delete();

        foreach ($groupIds as $groupId) {
            EnableyUserManagerGroup::query()->updateOrCreate(
                [
                    'enabley_user_identifier' => $userIdentifier,
                    'group_identifier' => $groupId,
                ],
                [],
            );
        }
    }

    public function tryRemoveUserGroupEntitlement(string $userIdentifier, string $groupIdentifier, string $userRole): void
    {
        try {
            $this->removeUserGroupEntitlement($userIdentifier, $groupIdentifier, $userRole);
        } catch (RuntimeException) {
            // Enabley devolve 200 mesmo sem entitlement existente; falhas de rede ignoram-se na sondagem.
        }
    }

    /**
     * Enabley não expõe GET de entitlements MANAGER por grupo. Sonda cada UNIDADE candidata
     * (fora do ramo de membership de aluno) e repõe todos os entitlements detectados.
     *
     * @return list<string>
     */
    public function discoverManagerEntitlementGroupIds(string $userIdentifier): array
    {
        $unidadeCandidates = $this->managerEntitlementUnidadeCandidates($userIdentifier);
        if ($unidadeCandidates === []) {
            return [];
        }

        $discovered = $this->findLiveManagerEntitlementMask($userIdentifier, $unidadeCandidates);

        foreach ($unidadeCandidates as $gid) {
            $this->tryRemoveUserGroupEntitlement($userIdentifier, $gid, 'MANAGER');
        }
        foreach ($discovered as $gid) {
            try {
                $this->addUserGroupEntitlement($userIdentifier, $gid, 'MANAGER');
            } catch (RuntimeException) {
            }
        }

        return $discovered;
    }

    /**
     * @return list<string>
     */
    private function managerEntitlementUnidadeCandidates(string $userIdentifier): array
    {
        $groupsForRoles = $this->listUserRoleGroupsMap($userIdentifier);
        $candidateIds = $this->managerEntitlementCandidateGroupIds($groupsForRoles);
        if ($candidateIds === []) {
            return [];
        }

        $flat = $this->listFlatGroupsWithParents();
        $flatById = collect($flat)->keyBy('identifier');
        $memberIds = $this->collectGroupIdsFromRoleMap($groupsForRoles);

        return array_values(array_filter(
            $candidateIds,
            function (string $gid) use ($flatById, $memberIds): bool {
                if (in_array($gid, $memberIds, true)) {
                    return false;
                }

                return ($flatById[$gid]['type'] ?? null) === 'UNIDADE';
            }
        ));
    }

    /**
     * @return list<string>
     */
    private function findLiveManagerEntitlementMask(string $userIdentifier, array $universe): array
    {
        return $this->multiRoundManagerPeel($userIdentifier, $universe, []);
    }

    /**
     * @param  list<string>  $universe
     * @param  list<string>  $seed
     * @return list<string>
     */
    private function multiRoundManagerPeel(string $userIdentifier, array $universe, array $seed): array
    {
        $discovered = array_values(array_unique($seed));
        $pending = array_values(array_filter(
            $universe,
            fn (string $gid) => ! in_array($gid, $discovered, true),
        ));
        $flat = $this->listFlatGroupsWithParents();
        $scopeService = app(EnableyScopeService::class);
        $maxRounds = count($universe);

        for ($round = 0; $round < $maxRounds; $round++) {
            if ($pending === []) {
                break;
            }

            if (count($pending) === 1 && count($discovered) >= 1) {
                break;
            }

            foreach ($universe as $gid) {
                $this->tryRemoveUserGroupEntitlement($userIdentifier, $gid, 'MANAGER');
            }
            foreach ($discovered as $gid) {
                try {
                    $this->addUserGroupEntitlement($userIdentifier, $gid, 'MANAGER');
                } catch (RuntimeException) {
                }
            }

            $sortedPending = $this->sortUnidadeCandidatesBySubtreeSize($pending, $scopeService, $flat);
            $next = null;

            foreach ($sortedPending as $candidateId) {
                $sizes = [];
                foreach ($pending as $gid) {
                    $sizes[$gid] = count($scopeService->expandDescendants([$gid], $flat));
                }
                arsort($sizes);
                $sizeValues = array_values($sizes);
                if (($sizeValues[0] ?? 0) <= ($sizeValues[1] ?? 0)) {
                    break;
                }
                if (array_key_first($sizes) !== $candidateId) {
                    continue;
                }
                $next = $candidateId;
                break;
            }

            if ($next === null) {
                break;
            }

            $discovered[] = $next;
            $pending = array_values(array_filter($pending, fn (string $gid) => $gid !== $next));

            try {
                $this->addUserGroupEntitlement($userIdentifier, $next, 'MANAGER');
            } catch (RuntimeException) {
                array_pop($discovered);
                break;
            }
        }

        return array_values(array_unique($discovered));
    }

    /**
     * @param  list<string>  $candidates
     * @return list<string>
     */
    private function sortUnidadeCandidatesBySubtreeSize(array $candidates, EnableyScopeService $scopeService, array $flat): array
    {
        usort($candidates, function (string $a, string $b) use ($scopeService, $flat): int {
            $sizeA = count($scopeService->expandDescendants([$a], $flat));
            $sizeB = count($scopeService->expandDescendants([$b], $flat));

            return $sizeB <=> $sizeA;
        });

        return $candidates;
    }

    /**
     * @param  array<string, list<array{identifier: string, name: string}>>  $groupsForRoles
     * @return list<string>
     */
    private function extractExplicitManagerGroupIds(array $groupsForRoles): array
    {
        $ids = [];
        foreach ($groupsForRoles['MANAGER'] ?? [] as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            $gid = $entry['identifier'] ?? null;
            if (is_string($gid) && $gid !== '') {
                $ids[$gid] = true;
            }
        }

        return array_keys($ids);
    }

    /**
     * @param  array<string, list<array{identifier: string, name: string}>>  $groupsForRoles
     * @return list<string>
     */
    private function managerEntitlementCandidateGroupIds(array $groupsForRoles): array
    {
        $flatGroups = $this->listFlatGroupsWithParents();
        $flatById = [];
        foreach ($flatGroups as $group) {
            $flatById[$group['identifier']] = $group;
        }

        $memberIds = $this->collectGroupIdsFromRoleMap($groupsForRoles);
        $learnerBranchIds = $this->learnerBranchAncestorIds($memberIds, $flatById);

        $managerRootTypes = config('enabley.manager_root_group_types', ['UNIDADE', 'EIXO']);
        $learnerMembershipTypes = config('enabley.learner_membership_group_types', ['CARGO', 'SETOR', 'TURMA', 'CURSO']);

        $candidates = [];
        foreach ($flatGroups as $group) {
            $gid = $group['identifier'] ?? null;
            $type = $group['type'] ?? null;
            if (! is_string($gid) || $gid === '' || ! is_string($type) || ! in_array($type, $managerRootTypes, true)) {
                continue;
            }

            if (isset($learnerBranchIds[$gid])) {
                continue;
            }

            if (in_array($gid, $memberIds, true)) {
                $memberType = $flatById[$gid]['type'] ?? null;
                if (is_string($memberType) && in_array($memberType, $learnerMembershipTypes, true)) {
                    continue;
                }
            }

            $candidates[$gid] = true;
        }

        return array_keys($candidates);
    }

    /**
     * @param  list<string>  $memberGroupIds
     * @param  array<string, array{identifier: string, type: string|null, parentIdentifier: string|null}>  $flatById
     * @return array<string, true>
     */
    private function learnerBranchAncestorIds(array $memberGroupIds, array $flatById): array
    {
        $learnerMembershipTypes = config('enabley.learner_membership_group_types', ['CARGO', 'SETOR', 'TURMA', 'CURSO']);
        $ancestors = [];

        foreach ($memberGroupIds as $memberId) {
            $member = $flatById[$memberId] ?? null;
            if (! is_array($member)) {
                continue;
            }
            $memberType = $member['type'] ?? null;
            if (! is_string($memberType) || ! in_array($memberType, $learnerMembershipTypes, true)) {
                continue;
            }

            $current = $memberId;
            while (isset($flatById[$current])) {
                $ancestors[$current] = true;
                $parent = $flatById[$current]['parentIdentifier'] ?? null;
                if (! is_string($parent) || $parent === '' || ! isset($flatById[$parent])) {
                    break;
                }
                $current = $parent;
            }
        }

        return $ancestors;
    }

    /**
     * @param  array<string, list<array{identifier: string, name: string}>>  $groupsForRoles
     * @return list<string>
     */
    private function collectGroupIdsFromRoleMap(array $groupsForRoles): array
    {
        $ids = [];
        foreach ($groupsForRoles as $roleGroups) {
            if (! is_array($roleGroups)) {
                continue;
            }
            foreach ($roleGroups as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $gid = $entry['identifier'] ?? null;
                if (is_string($gid) && $gid !== '') {
                    $ids[$gid] = true;
                }
            }
        }

        return array_keys($ids);
    }

    /**
     * Papéis por grupo devolvidos na lista GET /api/v1/users/{id}/groups (campos opcionais além de GroupInfo).
     *
     * @param  array<string, mixed>  $g
     * @return list<string>
     */
    private function extractRoleCodesFromGroupEntry(array $g): array
    {
        $out = [];
        foreach (['userRoles', 'groupRoles', 'roles'] as $k) {
            if (! isset($g[$k])) {
                continue;
            }
            $v = $g[$k];
            if (is_string($v) && $v !== '') {
                $out[] = $v;
            }
            if (is_array($v)) {
                foreach ($v as $item) {
                    if (is_string($item) && $item !== '') {
                        $out[] = $item;
                    }
                }
            }
        }
        if (isset($g['userRole']) && is_string($g['userRole']) && $g['userRole'] !== '') {
            $out[] = $g['userRole'];
        }

        return array_values(array_unique($out));
    }

    /**
     * Lista de grupos ({identifier, name}) por código de papel (membro sem papéis explícitos → LEARNER).
     *
     * @param  list<mixed>  $glist
     * @return array<string, list<array{identifier: string, name: string}>>
     */
    private function groupsForRolesFromUserGroupsList(array $glist): array
    {
        /** @var array<string, array<string, array{identifier: string, name: string}>> */
        $acc = [];
        foreach ($glist as $g) {
            if (! is_array($g)) {
                continue;
            }
            $gid = $g['identifier'] ?? null;
            if (! is_string($gid) || $gid === '') {
                continue;
            }
            $name = isset($g['name']) && is_string($g['name']) && trim($g['name']) !== ''
                ? trim($g['name'])
                : $gid;
            $entry = ['identifier' => $gid, 'name' => $name];
            $roles = $this->extractRoleCodesFromGroupEntry($g);
            if ($roles === []) {
                $acc['LEARNER'][$gid] = $entry;

                continue;
            }
            foreach ($roles as $role) {
                $acc[$role][$gid] = $entry;
            }
        }
        foreach ($acc as $role => $byId) {
            $list = array_values($byId);
            usort($list, function (array $a, array $b): int {
                return strcasecmp($a['name'], $b['name']);
            });
            $acc[$role] = $list;
        }
        ksort($acc);

        return $acc;
    }

    /**
     * @param  list<array<string, mixed>>  $users
     * @return array{0: array<string, list<array<string, mixed>>>, 1: array<string, array<string, list<array{identifier: string, name: string}>>>}
     */
    private function fetchUserIdentifiersPerGroup(string $token, array $users, string $sub, string $base): array
    {
        $userMap = [];
        foreach ($users as $u) {
            if (is_array($u) && isset($u['identifier']) && is_string($u['identifier']) && $u['identifier'] !== '') {
                $userMap[$u['identifier']] = $u;
            }
        }

        $ids = array_keys($userMap);
        $limit = max(0, (int) config('enabley.max_users_for_group_enrichment', 500));
        if ($limit > 0 && count($ids) > $limit) {
            Log::warning('Enabley: muitos utilizadores — enrichment grupos por utilizador omitido na listagem/árvore', [
                'count' => count($ids),
                'threshold' => $limit,
                'sub_account' => $sub,
            ]);

            return $this->emptyUserGroupEnrichment($ids);
        }

        $byGroup = [];
        /** @var array<string, array<string, list<array{identifier: string, name: string}>>> */
        $groupsForRolesByUserId = [];
        $chunkSize = max(1, min(50, (int) config('enabley.http_pool_chunk', 10)));
        $deadline = $this->httpTimeoutSeconds();
        $connectDeadline = $this->httpConnectTimeoutSeconds();
        foreach (array_chunk($ids, $chunkSize) as $chunk) {
            $responses = Http::pool(function (Pool $pool) use ($chunk, $base, $sub, $token, $deadline, $connectDeadline) {
                foreach ($chunk as $userId) {
                    $pool->as($userId)
                        ->withToken($token)
                        ->acceptJson()
                        ->timeout($deadline)
                        ->connectTimeout($connectDeadline)
                        ->get($base.'/api/v1/users/'.rawurlencode($userId).'/groups', array_filter(['subAccountName' => $sub]));
                }
            });

            foreach ($chunk as $userId) {
                $res = $responses[$userId] ?? null;
                if (! $res?->successful()) {
                    continue;
                }
                $glist = $res->json();
                if (! is_array($glist)) {
                    continue;
                }
                $groupsForRolesByUserId[$userId] = $this->groupsForRolesFromUserGroupsList($glist);
                $userMap[$userId]['groupsForRoles'] = $groupsForRolesByUserId[$userId];
                $user = $userMap[$userId];
                $simple = $this->simplifyUser($user);
                foreach ($glist as $g) {
                    if (! is_array($g)) {
                        continue;
                    }
                    $gid = $g['identifier'] ?? null;
                    if (! is_string($gid) || $gid === '') {
                        continue;
                    }
                    if (! isset($byGroup[$gid])) {
                        $byGroup[$gid] = [];
                    }
                    $byGroup[$gid][] = $simple;
                }
            }
        }

        foreach ($ids as $userId) {
            $groupsForRolesByUserId[$userId] ??= [];
            $userMap[$userId]['groupsForRoles'] = $groupsForRolesByUserId[$userId];
        }

        return [$byGroup, $groupsForRolesByUserId];
    }

    /**
     * @param  list<string>  $userIds
     */
    private function emptyUserGroupEnrichment(array $userIds): array
    {
        $groupsForRolesByUserId = [];
        foreach ($userIds as $uid) {
            $groupsForRolesByUserId[$uid] = [];
        }

        return [[], $groupsForRolesByUserId];
    }

    /**
     * @param  list<array<string, mixed>>  $rawGroups
     * @param  array<string, list<array<string, mixed>>>  $byGroup
     * @param  list<array<string, mixed>>  $allUsers
     * @return array{tree: list<array<string, mixed>>, unassigned: list<array<string, mixed>>, unknownGroupMemberships: list<array{groupId: string, users: list<array<string, mixed>>}>}
     */
    private function buildGroupTreePayload(array $rawGroups, array $byGroup, array $allUsers): array
    {
        $byId = [];
        foreach ($rawGroups as $g) {
            if (! is_array($g) || ! isset($g['identifier']) || ! is_string($g['identifier']) || $g['identifier'] === '') {
                continue;
            }
            $byId[$g['identifier']] = $g;
        }

        $childIds = [];
        $rootIds = [];
        foreach ($byId as $id => $g) {
            $p = $g['parentIdentifier'] ?? null;
            $p = (is_string($p) && $p !== '') ? $p : null;
            if ($p && isset($byId[$p])) {
                $childIds[$p] ??= [];
                $childIds[$p][] = $id;
            } else {
                $rootIds[] = $id;
            }
        }
        usort($rootIds, function (string $a, string $b) use ($byId) {
            $na = (string) ($byId[$a]['name'] ?? $a);
            $nb = (string) ($byId[$b]['name'] ?? $b);

            return strcasecmp($na, $nb);
        });
        foreach ($childIds as $pid => &$list) {
            usort($list, function (string $a, string $b) use ($byId) {
                $na = (string) ($byId[$a]['name'] ?? $a);
                $nb = (string) ($byId[$b]['name'] ?? $b);

                return strcasecmp($na, $nb);
            });
        }
        unset($list);

        $build = function (string $id) use (&$build, $byId, $byGroup, $childIds): array {
            $g = $byId[$id];
            $name = is_string($g['name'] ?? null) ? $g['name'] : $id;
            $type = $g['type'] ?? null;
            $subAccount = $g['subAccountName'] ?? null;
            $parentRaw = $g['parentIdentifier'] ?? null;
            $parentIdentifier = (is_string($parentRaw) && $parentRaw !== '') ? $parentRaw : null;

            $out = [
                'identifier' => $id,
                'name' => $name,
                'type' => is_string($type) ? $type : null,
                'subAccountName' => is_string($subAccount) ? $subAccount : null,
                'parentIdentifier' => $parentIdentifier,
                'users' => $byGroup[$id] ?? [],
                'children' => [],
            ];
            foreach ($childIds[$id] ?? [] as $childId) {
                $out['children'][] = $build($childId);
            }

            return $out;
        };

        $tree = [];
        foreach ($rootIds as $rid) {
            $tree[] = $build($rid);
        }

        $assigned = [];
        foreach ($byGroup as $users) {
            foreach ($users as $u) {
                if (isset($u['identifier']) && is_string($u['identifier'])) {
                    $assigned[$u['identifier']] = true;
                }
            }
        }
        $unassigned = [];
        foreach ($allUsers as $u) {
            if (! is_array($u)) {
                continue;
            }
            $id = $u['identifier'] ?? null;
            if (is_string($id) && $id !== '' && empty($assigned[$id])) {
                $unassigned[] = $this->simplifyUser($u);
            }
        }

        $unknown = [];
        foreach (array_keys($byGroup) as $gid) {
            if (! isset($byId[$gid])) {
                $unknown[] = [
                    'groupId' => $gid,
                    'users' => $byGroup[$gid] ?? [],
                ];
            }
        }

        return [
            'tree' => $tree,
            'unassigned' => $unassigned,
            'unknownGroupMemberships' => $unknown,
        ];
    }

    /**
     * Normaliza o identificador e repassa o resto do registo tal como veio da API.
     *
     * @param  array<string, mixed>  $u
     * @return array<string, mixed>
     */
    private function simplifyUser(array $u): array
    {
        $out = $u;
        $id = $u['identifier'] ?? '';
        $out['identifier'] = is_string($id) ? $id : (string) $id;

        return $out;
    }

    /**
     * @param  Response  $response
     */
    private function throwForResponse(string $context, $response): never
    {
        $body = $response->body();
        $message = "Enabley ({$context}): HTTP {$response->status()}";
        if ($body !== '') {
            $message .= ' — '.mb_substr($body, 0, 2000);
        }
        throw new RuntimeException($message);
    }
}
