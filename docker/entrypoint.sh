#!/usr/bin/env bash
set -e

php artisan migrate:fresh --seed --force

exec /usr/local/bin/start-container "$@"
