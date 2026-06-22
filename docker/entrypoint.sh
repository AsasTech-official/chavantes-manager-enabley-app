#!/usr/bin/env bash
set -e

php artisan migrate:fresh --seed --force

if [ "${APP_ENV:-local}" = "local" ]; then
    npm run dev &
fi

exec /usr/local/bin/start-container "$@"
