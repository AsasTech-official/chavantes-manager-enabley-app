<?php

return [

    'base_url' => rtrim(env('ENABLEY_BASE_URL', 'https://api.prod.timetoknow.com'), '/'),

    'client_key' => env('ENABLEY_CLIENT_KEY'),
    'secret' => env('ENABLEY_SECRET'),

    'sub_account_name' => env('ENABLEY_SUB_ACCOUNT_NAME', ''),

    /*
     | Timeouts PHP < pedidos lentos Enabley | script_max permite paginação + pool longo para subconta demonstração grande.
     */
    'http_timeout' => max(10, min(600, (int) env('ENABLEY_HTTP_TIMEOUT', 28))),
    'http_connect_timeout' => max(3, min(120, (int) env('ENABLEY_HTTP_CONNECT_TIMEOUT', 12))),
    'http_pool_chunk' => max(1, min(50, (int) env('ENABLEY_HTTP_POOL_CHUNK', 10))),
    'script_max_seconds' => max(90, min(7200, (int) env('ENABLEY_SCRIPT_MAX_SECONDS', 480))),

    /*
     | Subcontas com muitos utilizadores (ex.: demonstração): acima deste valor não faz GET grupos/utilizador na lista/árvore.
     | 0 = sem limiar (pode ficar «a carregar infinito»). O .env já traz típico 600.
     */
    'max_users_for_group_enrichment' => max(0, min(2000000, (int) env('ENABLEY_MAX_USERS_FOR_GROUP_ENRICHMENT', 500))),

    'identifier_prefix' => env('ENABLEY_IDENTIFIER_PREFIX', ''),
    'default_password' => env('ENABLEY_DEFAULT_PASSWORD'),

    /*
     | Tipos de grupo elegíveis como raiz de escopo MANAGER (gerente por entitlement).
     | Tipos de membership típicos de aluno (nunca raiz de gerente).
     */
    'manager_root_group_types' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('ENABLEY_MANAGER_ROOT_GROUP_TYPES', 'UNIDADE,EIXO,REGIONAL,CONTA'))
    ))),

    'learner_membership_group_types' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('ENABLEY_LEARNER_MEMBERSHIP_GROUP_TYPES', 'CARGO,SETOR,TURMA,CURSO'))
    ))),

];
