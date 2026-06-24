<?php

namespace App\Support;

final class EnableyScope
{
    /**
     * @param  list<string>  $managedRootGroupIds
     * @param  list<string>  $scopeGroupIds
     */
    public function __construct(
        public readonly string $accessMode,
        public readonly ?string $enableyUsername,
        public readonly ?string $enableyIdentifier,
        public readonly array $managedRootGroupIds = [],
        public readonly array $scopeGroupIds = [],
    ) {}

    public function isAdmin(): bool
    {
        return $this->accessMode === 'admin';
    }

    public function isManager(): bool
    {
        return $this->accessMode === 'manager';
    }

    public function allowsGroup(string $groupId): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($groupId, $this->scopeGroupIds, true);
    }

    public function allowsUserIdentifier(string $userIdentifier, array $userGroupsForRoles): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if (
            $this->isManager()
            && is_string($this->enableyIdentifier)
            && $this->enableyIdentifier !== ''
            && $userIdentifier === $this->enableyIdentifier
        ) {
            return true;
        }

        foreach ($userGroupsForRoles as $roleGroups) {
            if (! is_array($roleGroups)) {
                continue;
            }
            foreach ($roleGroups as $entry) {
                if (! is_array($entry)) {
                    continue;
                }
                $gid = $entry['identifier'] ?? null;
                if (is_string($gid) && $gid !== '' && $this->allowsGroup($gid)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function toSessionArray(): array
    {
        return [
            'access_mode' => $this->accessMode,
            'enabley_username' => $this->enableyUsername,
            'enabley_identifier' => $this->enableyIdentifier,
            'managed_root_group_ids' => $this->managedRootGroupIds,
            'scope_group_ids' => $this->scopeGroupIds,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromSessionArray(array $data): self
    {
        return new self(
            accessMode: is_string($data['access_mode'] ?? null) ? $data['access_mode'] : 'admin',
            enableyUsername: is_string($data['enabley_username'] ?? null) ? $data['enabley_username'] : null,
            enableyIdentifier: is_string($data['enabley_identifier'] ?? null) ? $data['enabley_identifier'] : null,
            managedRootGroupIds: self::stringList($data['managed_root_group_ids'] ?? []),
            scopeGroupIds: self::stringList($data['scope_group_ids'] ?? []),
        );
    }

    /**
     * @return list<string>
     */
    private static function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $out = [];
        foreach ($value as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            } elseif (is_int($item)) {
                $out[] = (string) $item;
            }
        }

        return array_values(array_unique($out));
    }
}
