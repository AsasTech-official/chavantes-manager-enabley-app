<?php

namespace App\Services;

use App\Support\EnableyScope;
use RuntimeException;

class EnableyScopeService
{
    public function __construct(
        private EnableyApiService $enabley,
    ) {}

    /**
     * @param  list<string>  $possibleRoles
     */
    public function resolveForManager(string $enableyIdentifier, string $enableyUsername, array $possibleRoles = []): EnableyScope
    {
        $managedRoots = $this->enabley->listUserManagerRootGroupIds($enableyIdentifier, $possibleRoles);

        if ($managedRoots === []) {
            throw new RuntimeException('Sem permissão de gerente (MANAGER) em nenhum grupo desta subconta.');
        }

        $flatGroups = $this->enabley->listFlatGroupsWithParents();
        $scopeIds = $this->expandDescendants($managedRoots, $flatGroups);

        return new EnableyScope(
            accessMode: 'manager',
            enableyUsername: $enableyUsername,
            enableyIdentifier: $enableyIdentifier,
            managedRootGroupIds: $managedRoots,
            scopeGroupIds: $scopeIds,
        );
    }

    /**
     * Repõe scope_group_ids a partir das raízes geridas.
     * Sessões antigas podiam guardar só a UNIDADE ou misturar grupos de membership (ex.: ENFERMEIRO).
     */
    public function refreshScopeGroupIds(EnableyScope $scope): EnableyScope
    {
        if ($scope->isAdmin()) {
            return $scope;
        }

        $managedRoots = $scope->managedRootGroupIds;

        if (is_string($scope->enableyIdentifier) && $scope->enableyIdentifier !== '') {
            $storedRoots = $this->enabley->listUserManagerRootGroupIds($scope->enableyIdentifier, []);
            if ($storedRoots !== []) {
                $managedRoots = $storedRoots;
            }

            $attemptKey = 'enabley_manager_rediscovery_'.$scope->enableyIdentifier;
            if (count($managedRoots) <= 1 && ! session($attemptKey, false)) {
                session([$attemptKey => true]);
                $rediscovered = $this->enabley->listUserManagerRootGroupIds(
                    $scope->enableyIdentifier,
                    ['MANAGER'],
                );
                if ($rediscovered !== []) {
                    $managedRoots = $rediscovered;
                }
            }
        }

        if ($managedRoots === []) {
            return $scope;
        }

        $flatGroups = $this->enabley->listFlatGroupsWithParents();
        $scopeIds = $this->expandDescendants($managedRoots, $flatGroups);

        sort($scopeIds);
        $current = $scope->scopeGroupIds;
        sort($current);

        $rootsChanged = $managedRoots !== $scope->managedRootGroupIds;

        if (! $rootsChanged && $scopeIds === $current) {
            return $scope;
        }

        return new EnableyScope(
            accessMode: $scope->accessMode,
            enableyUsername: $scope->enableyUsername,
            enableyIdentifier: $scope->enableyIdentifier,
            managedRootGroupIds: $managedRoots,
            scopeGroupIds: array_values($scopeIds),
        );
    }

    /**
     * @param  list<string>  $managedRootGroupIds
     * @return list<string>
     */
    public function scopedGroupIdsForManager(array $managedRootGroupIds): array
    {
        if ($managedRootGroupIds === []) {
            return [];
        }

        return $this->expandDescendants(
            $managedRootGroupIds,
            $this->enabley->listFlatGroupsWithParents(),
        );
    }

    public function adminScope(): EnableyScope
    {
        return new EnableyScope(
            accessMode: 'admin',
            enableyUsername: null,
            enableyIdentifier: null,
        );
    }

    public function resolveForLocalManager(\App\Models\User $user): EnableyScope
    {
        $managedRoots = $user->groups()->pluck('group_identifier')->unique()->filter()->values()->all();

        if ($managedRoots === []) {
            throw new RuntimeException('Você não possui nenhum grupo atribuído. Fale com o administrador.');
        }

        $flatGroups = $this->enabley->listFlatGroupsWithParents();
        $scopeIds = $this->expandDescendants($managedRoots, $flatGroups);

        return new EnableyScope(
            accessMode: 'manager',
            enableyUsername: $user->enabley_username,
            enableyIdentifier: $user->enabley_identifier,
            managedRootGroupIds: $managedRoots,
            scopeGroupIds: $scopeIds,
        );
    }



    /**
     * @param  array<string, list<array{identifier: string, name: string}>>  $groupsForRoles
     * @return list<string>
     */
    public function managedRootGroupIds(array $groupsForRoles): array
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

        return array_map('strval', array_keys($ids));
    }

    /**
     * Grupos em que o utilizador é membro (qualquer papel explícito ou LEARNER implícito).
     *
     * @param  array<string, list<array{identifier: string, name: string}>>  $groupsForRoles
     * @return list<string>
     */
    public function allMemberGroupIds(array $groupsForRoles): array
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

        return array_map('strval', array_keys($ids));
    }

    /**
     * @param  list<string>  $rootIds
     * @param  list<array{identifier: string, parentIdentifier?: string|null}>  $flatGroups
     * @return list<string>
     */
    public function expandDescendants(array $rootIds, array $flatGroups): array
    {
        $childrenByParent = [];

        foreach ($flatGroups as $g) {
            $id = $g['identifier'] ?? null;
            if (! is_string($id) || $id === '') {
                continue;
            }
            $parent = $g['parentIdentifier'] ?? null;
            if (is_string($parent) && $parent !== '') {
                $childrenByParent[$parent][] = $id;
            }
        }

        $allowed = [];
        $stack = array_values(array_unique($rootIds));
        while ($stack !== []) {
            $id = array_pop($stack);
            if (isset($allowed[$id])) {
                continue;
            }
            $allowed[$id] = true;
            foreach ($childrenByParent[$id] ?? [] as $childId) {
                if (! isset($allowed[$childId])) {
                    $stack[] = $childId;
                }
            }
        }

        return array_map('strval', array_keys($allowed));
    }

    /**
     * @param  array{
     *     tree: list<array<string, mixed>>,
     *     unassigned: list<array<string, mixed>>,
     *     unknownGroupMemberships: list<array{groupId: string, users: list<array<string, mixed>>}>
     * }  $payload
     * @return array{
     *     tree: list<array<string, mixed>>,
     *     unassigned: list<array<string, mixed>>,
     *     unknownGroupMemberships: list<array{groupId: string, users: list<array<string, mixed>>}>
     * }
     */
    public function filterTreePayload(array $payload, EnableyScope $scope): array
    {
        if ($scope->isAdmin()) {
            return $payload;
        }

        $managedRootIds = $scope->managedRootGroupIds;
        if ($managedRootIds === [] && is_string($scope->enableyIdentifier) && $scope->enableyIdentifier !== '') {
            $managedRootIds = $this->enabley->listUserManagerRootGroupIds($scope->enableyIdentifier, ['MANAGER']);
        }

        $allowedIds = $managedRootIds !== []
            ? $this->scopedGroupIdsForManager($managedRootIds)
            : $scope->scopeGroupIds;

        $allowed = array_fill_keys($allowedIds, true);
        $managedRoots = array_fill_keys($managedRootIds, true);
        $tree = [];
        foreach ($payload['tree'] ?? [] as $node) {
            if (! is_array($node)) {
                continue;
            }
            foreach ($this->extractManagedTreeRoots($node, $allowed, $managedRoots) as $filtered) {
                $tree[] = $filtered;
            }
        }

        $unassigned = [];
        foreach ($payload['unassigned'] ?? [] as $user) {
            if (is_array($user) && $this->userInScope($user, $scope)) {
                $unassigned[] = $user;
            }
        }

        $unknown = [];
        foreach ($payload['unknownGroupMemberships'] ?? [] as $row) {
            if (! is_array($row)) {
                continue;
            }
            $gid = $row['groupId'] ?? null;
            if (! is_string($gid) || ! isset($allowed[$gid])) {
                continue;
            }
            $users = [];
            foreach ($row['users'] ?? [] as $user) {
                if (is_array($user) && $this->userInScope($user, $scope)) {
                    $users[] = $user;
                }
            }
            if ($users !== []) {
                $unknown[] = ['groupId' => $gid, 'users' => $users];
            }
        }

        return [
            'tree' => $tree,
            'unassigned' => $unassigned,
            'unknownGroupMemberships' => $unknown,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $users
     * @return list<array<string, mixed>>
     */
    public function filterUsers(array $users, EnableyScope $scope): array
    {
        if ($scope->isAdmin()) {
            return $users;
        }

        $out = [];
        foreach ($users as $user) {
            if (is_array($user) && $this->userInScope($user, $scope)) {
                $out[] = $user;
            }
        }

        return $out;
    }

    /**
     * @param  list<array{identifier: string, name: string, type: string|null}>  $groups
     * @return list<array{identifier: string, name: string, type: string|null}>
     */
    public function filterFlatGroups(array $groups, EnableyScope $scope): array
    {
        if ($scope->isAdmin()) {
            return $groups;
        }

        $allowedIds = $scope->managedRootGroupIds !== []
            ? $this->scopedGroupIdsForManager($scope->managedRootGroupIds)
            : $scope->scopeGroupIds;

        $allowed = array_fill_keys($allowedIds, true);
        $out = [];
        foreach ($groups as $g) {
            $id = $g['identifier'] ?? null;
            if (is_string($id) && isset($allowed[$id])) {
                $out[] = $g;
            }
        }

        return $out;
    }

    /**
     * @param  list<string>  $groupIds
     * @return list<string>
     */
    public function assertGroupsInScope(array $groupIds, EnableyScope $scope): array
    {
        if ($scope->isAdmin()) {
            return $groupIds;
        }

        foreach ($groupIds as $gid) {
            if (! $scope->allowsGroup($gid)) {
                throw new RuntimeException('Grupo fora do seu escopo de gerente.');
            }
        }

        return $groupIds;
    }

    public function assertUserInScope(string $userIdentifier, EnableyScope $scope): void
    {
        if ($scope->isAdmin()) {
            return;
        }

        $groupsForRoles = $this->enabley->listUserRoleGroupsMap($userIdentifier);
        if (! $scope->allowsUserIdentifier($userIdentifier, $groupsForRoles)) {
            throw new RuntimeException('Usuário fora do seu escopo de gerente.');
        }
    }

    /**
     * @param  array<string, true>  $allowed
     * @param  array<string, true>  $managedRoots
     * @return list<array<string, mixed>>
     */
    private function extractManagedTreeRoots(array $node, array $allowed, array $managedRoots): array
    {
        $id = $node['identifier'] ?? null;
        $out = [];

        if (is_string($id) && isset($managedRoots[$id]) && isset($allowed[$id])) {
            $filtered = $this->filterTreeNode($node, $allowed, array_keys($managedRoots));
            if ($filtered !== null) {
                $out[] = $filtered;
            }
        }

        foreach ($node['children'] ?? [] as $child) {
            if (is_array($child)) {
                foreach ($this->extractManagedTreeRoots($child, $allowed, $managedRoots) as $filtered) {
                    $out[] = $filtered;
                }
            }
        }

        return $out;
    }

    /**
     * @param  array<string, true>  $allowed
     * @param  list<string>  $managedRoots
     */
    private function filterTreeNode(array $node, array $allowed, array $managedRoots): ?array
    {
        $id = $node['identifier'] ?? null;
        if (! is_string($id) || ! isset($allowed[$id])) {
            return null;
        }

        $filteredChildren = [];
        foreach ($node['children'] ?? [] as $child) {
            if (is_array($child)) {
                $filtered = $this->filterTreeNode($child, $allowed, $managedRoots);
                if ($filtered !== null) {
                    $filteredChildren[] = $filtered;
                }
            }
        }

        $users = [];
        foreach ($node['users'] ?? [] as $user) {
            if (is_array($user)) {
                $users[] = $user;
            }
        }

        $out = $node;
        $out['children'] = $filteredChildren;
        $out['users'] = $users;

        return $out;
    }

    /**
     * @param  array<string, mixed>  $user
     */
    private function userInScope(array $user, EnableyScope $scope): bool
    {
        $groupsForRoles = $user['groupsForRoles'] ?? $user['groups_for_roles'] ?? [];
        if (! is_array($groupsForRoles)) {
            return false;
        }

        $identifier = $user['identifier'] ?? '';
        if (! is_string($identifier) || $identifier === '') {
            return false;
        }

        return $scope->allowsUserIdentifier($identifier, $groupsForRoles);
    }
}
