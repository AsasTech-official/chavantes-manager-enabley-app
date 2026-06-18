<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class IntegrationSetting extends Model
{
    protected $fillable = [
        'default_user_password',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_user_password' => 'encrypted',
        ];
    }

    public static function current(): self
    {
        $row = static::query()->first();
        if ($row === null) {
            $row = static::query()->create([]);
        }

        return $row;
    }

    public function defaultUserPassword(): ?string
    {
        $raw = $this->getAttributes()['default_user_password'] ?? null;
        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            $v = $this->castAttribute('default_user_password', $raw);

            return is_string($v) && $v !== '' ? $v : null;
        } catch (DecryptException $e) {
            Log::warning('default_user_password inválido após troca de APP_KEY; valor removido da base.', [
                'integration_setting_id' => $this->getKey(),
                'message' => $e->getMessage(),
            ]);
            $this->clearStaleDefaultUserPassword();

            return null;
        }
    }

    public function hasDefaultUserPassword(): bool
    {
        return $this->defaultUserPassword() !== null;
    }

    /**
     * Remove ciphertext gravado com outra APP_KEY (não é recuperável).
     */
    public function clearStaleDefaultUserPassword(): void
    {
        if (($this->getAttributes()['default_user_password'] ?? null) === null) {
            return;
        }

        static::query()->whereKey($this->getKey())->update(['default_user_password' => null]);
        $this->setAttribute('default_user_password', null);
        $this->syncOriginalAttribute('default_user_password');
    }
}
