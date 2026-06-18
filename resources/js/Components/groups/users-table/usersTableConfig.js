/** Config e formatadores da tabela de usuários Enabley (modal + página). */

/** Query string na rota `/usuarios` para pré-preencher o filtro de busca */
export const USERS_BUSCA_QUERY = 'busca';

/** Papéis para os quais o backend aceita `role_groups` (alinhado a `EnableyUserController::ROLE_GROUPS_KEYS`). */
export const ENABLEY_ROLE_GROUPS_KEYS = [
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

/** Query na rota `/home` para focar e expandir um grupo na árvore */
export const GROUP_FOCUS_QUERY = 'grupo';

export const PAGE_SIZE_ALL = 'all';
export const PAGE_SIZES = [10, 25, 50, 100, 500];

/** Ordem das colunas: identificação → Status → Criado em → Atualizado → restantes A–Z */
export const COLUMN_KEY_ORDER = [
    'identifier',
    'firstName',
    'firstname',
    'first_name',
    'givenName',
    'given_name',
    'lastName',
    'lastname',
    'last_name',
    'surname',
    'familyName',
    'family_name',
    'email',
    'username',
    'possibleRoles',
    'possible_roles',
    'isActive',
    'is_active',
    'created',
    'createdAt',
    'createdDate',
    'modified',
    'modifiedAt',
    'modifiedDate',
    'updatedAt',
    'updated',
    'lastModified',
    'last_modified',
];

export const PT_COLUMN = new Map([
    ['identifier', 'Identificador'],
    ...['firstName', 'first_name', 'firstname', 'givenName', 'given_name', 'givenname'].map((k) => [k, 'Nome']),
    ...['lastName', 'last_name', 'lastname', 'surname', 'familyName', 'family_name', 'familyname'].map((k) => [
        k,
        'Sobrenome',
    ]),
    ...['possibleRoles', 'possible_roles'].map((k) => [k, 'Função']),
    ...['created', 'createdAt', 'createdDate'].map((k) => [k, 'Criado']),
    ...['isActive', 'is_active'].map((k) => [k, 'Status']),
    ...[
        'modified',
        'modifiedAt',
        'modifiedDate',
        'updatedAt',
        'updated',
        'lastModified',
        'last_modified',
    ].map((k) => [k, 'Atualizado']),
]);

export const IS_ACTIVE_STATUS_KEYS = new Set(['isActive', 'is_active']);

export const POSSIBLE_ROLES_KEYS = new Set(['possibleRoles', 'possible_roles']);

/** Códigos devolvidos pela API Enabley → rótulo em português */
export const ENABLEY_ROLE_LABEL_PT = {
    ACCOUNT_ADMIN: 'Administrador',
    SUB_ACCOUNT_ADMIN: 'Administrador de subconta',
    SUBACCOUNT_ADMIN: 'Administrador de subconta',
    TRAINING_MANAGER: 'Gerente de treinamento',
    SUB_ACCOUNT_TRAINING_MANAGER: 'Gerente de Treinamento de Subcontas',
    SUBACCOUNT_TRAINING_MANAGER: 'Gerente de Treinamento de Subcontas',
    INSTRUCTOR: 'Instrutor',
    LEARNER: 'Aluno',
    EDITOR: 'Editor',
    MANAGER: 'Gerente',
    AUDITOR: 'Auditor',
    SITE_ADMIN: 'Administrador do site',
};

export function titleCaseSnakeFallback(code) {
    return String(code)
        .split(/_+/)
        .filter(Boolean)
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ');
}

export function labelEnableyRole(code) {
    const c = String(code ?? '').trim();
    if (!c) {
        return '—';
    }
    return ENABLEY_ROLE_LABEL_PT[c] ?? titleCaseSnakeFallback(c);
}

/** Entradas `{ identifier, name }` por papel (API); aceita legado só com string (sem link). */
export function normalizeRoleGroupEntries(groupsForRoles, roleCode) {
    const code = String(roleCode ?? '').trim();
    if (!code || !groupsForRoles || typeof groupsForRoles !== 'object') {
        return [];
    }
    const raw = groupsForRoles[code];
    if (!Array.isArray(raw)) {
        return [];
    }
    const out = [];
    for (const item of raw) {
        if (typeof item === 'string') {
            const name = item.trim();
            if (name) {
                out.push({ identifier: '', name });
            }
            continue;
        }
        if (item && typeof item === 'object') {
            const id = String(item.identifier ?? '').trim();
            const name = String(item.name ?? item.identifier ?? '').trim() || id;
            if (name) {
                out.push({ identifier: id, name });
            }
        }
    }
    return out;
}

export function roleGroupsEmptyMessage(roleCode) {
    const code = String(roleCode ?? '').trim();
    if (code === 'LEARNER') {
        return 'Sem grupos como aluno nesta subconta.';
    }
    return 'Sem lista de grupos para este papel nestes dados.';
}

/** Array da API ou string JSON tipo ["A","B"] */
function looksLikeEnableyRoleCode(s) {
    return /^[A-Z][A-Z0-9_]*$/.test(String(s).trim());
}

export function normalizePossibleRolesRaw(val) {
    if (val === null || val === undefined || val === '') {
        return [];
    }
    if (Array.isArray(val)) {
        return val
            .filter((x) => x !== null && x !== undefined && String(x).trim() !== '')
            .map((x) => String(x).trim());
    }
    if (typeof val === 'string') {
        const t = val.trim();
        if (t.startsWith('[')) {
            try {
                const p = JSON.parse(t);
                if (Array.isArray(p)) {
                    return p
                        .filter((x) => typeof x === 'string' && x.trim())
                        .map((x) => x.trim());
                }
            } catch {
                /* ignorar */
            }
        }
        return t ? [t] : [];
    }
    return [];
}

export function canonColumnKey(key) {
    if (!key || !key.length) {
        return key;
    }
    return key[0].toLowerCase() + key.slice(1);
}

/** Colunas da API que não devem aparecer na tabela */
const HIDDEN_COLUMN_KEYS_CANON = new Set([
    'userSubAccountNames',
    'user_sub_account_names',
    'address',
    'phone',
    'customAttributes',
    'custom_attributes',
    /** Metadado UI (tooltips na coluna Função), não é coluna da API Enabley */
    'groupsForRoles',
    'groups_for_roles',
]);

export function isHiddenUserColumnKey(key) {
    return HIDDEN_COLUMN_KEYS_CANON.has(canonColumnKey(key));
}

const CREATED_OR_UPDATED_DATE_KEYS = new Set([
    'created',
    'createdAt',
    'createdDate',
    'modified',
    'modifiedAt',
    'modifiedDate',
    'updatedAt',
    'updated',
    'lastModified',
    'last_modified',
]);

export function isCreatedOrUpdatedDateColumn(key) {
    return CREATED_OR_UPDATED_DATE_KEYS.has(canonColumnKey(key));
}

const PERSON_NAME_COLUMN_KEYS = new Set([
    'firstName',
    'first_name',
    'firstname',
    'givenName',
    'given_name',
    'givenname',
    'lastName',
    'last_name',
    'lastname',
    'surname',
    'familyName',
    'family_name',
    'familyname',
]);

export function isPersonNameColumn(key) {
    return key != null && PERSON_NAME_COLUMN_KEYS.has(canonColumnKey(key));
}

export function columnLabel(key) {
    const canon = canonColumnKey(key);
    const pt = PT_COLUMN.get(canon);
    if (pt) {
        return pt;
    }
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
}

function valuesToSearchBlob(val, depth = 0) {
    if (depth > 8) {
        return '';
    }
    if (val === null || val === undefined) {
        return '';
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
    }
    if (Array.isArray(val)) {
        return val.map((v) => valuesToSearchBlob(v, depth + 1)).join(' ');
    }
    if (typeof val === 'object') {
        return Object.values(val)
            .map((v) => valuesToSearchBlob(v, depth + 1))
            .join(' ');
    }
    return '';
}

export function matchesSearch(u, query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        return true;
    }
    return valuesToSearchBlob(u).toLowerCase().includes(q);
}

/** Opções pt-PT para colunas Criado/Atualizado: data só, ano com 4 dígitos */
function ptDateOnlyFullYearOpts(timeZone) {
    const base = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return timeZone ? { ...base, timeZone } : base;
}

/** pt-PT — datas ISO; `omitTime` só data em colunas criado/atualizado */
export function formatIsoLikeString(s, { omitTime = false } = {}) {
    const t = s.trim();
    if (!t) {
        return null;
    }
    const ymdOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (ymdOnly) {
        const [, y, mo, da] = ymdOnly;
        const d = new Date(Number(y), Number(mo) - 1, Number(da));
        if (Number.isNaN(d.getTime())) {
            return null;
        }
        return new Intl.DateTimeFormat(
            'pt-PT',
            omitTime ? ptDateOnlyFullYearOpts() : { dateStyle: 'short' },
        ).format(d);
    }
    if (!/^\d{4}-\d{2}-\d{2}T/.test(t)) {
        return null;
    }
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    if (omitTime) {
        return new Intl.DateTimeFormat(
            'pt-PT',
            ptDateOnlyFullYearOpts('Europe/Lisbon'),
        ).format(d);
    }
    return new Intl.DateTimeFormat('pt-PT', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Europe/Lisbon',
    }).format(d);
}

export function formatNumericAsDateTime(val, { omitTime = false } = {}) {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
        return null;
    }
    const ms = val > 1e12 ? val : val > 1e9 ? val * 1000 : NaN;
    if (!Number.isFinite(ms)) {
        return null;
    }
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    if (ms < 946684800000 || ms > 4102444800000) {
        return null;
    }
    if (omitTime) {
        return new Intl.DateTimeFormat(
            'pt-PT',
            ptDateOnlyFullYearOpts('Europe/Lisbon'),
        ).format(d);
    }
    return new Intl.DateTimeFormat('pt-PT', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'Europe/Lisbon',
    }).format(d);
}

export function formatUserCellValue(val, columnKey = null) {
    if (val === null || val === undefined || val === '') {
        return '—';
    }
    if (Array.isArray(val)) {
        const roles = normalizePossibleRolesRaw(val);
        if (roles.length > 0 && roles.every(looksLikeEnableyRoleCode)) {
            return roles.map((c) => labelEnableyRole(c)).join(', ');
        }
    }
    if (typeof val === 'object') {
        try {
            return JSON.stringify(val);
        } catch {
            return String(val);
        }
    }
    const dateOmitTime = columnKey != null && isCreatedOrUpdatedDateColumn(columnKey);
    if (typeof val === 'number') {
        const asNumDate = formatNumericAsDateTime(val, { omitTime: dateOmitTime });
        if (asNumDate) {
            return asNumDate;
        }
    }
    if (typeof val === 'string') {
        const asDate = formatIsoLikeString(val, { omitTime: dateOmitTime });
        if (asDate) {
            return asDate;
        }
        const asRoles = normalizePossibleRolesRaw(val);
        if (asRoles.length > 0 && asRoles.every(looksLikeEnableyRoleCode)) {
            return asRoles.map((c) => labelEnableyRole(c)).join(', ');
        }
    }
    let out = String(val);
    if (columnKey != null && isPersonNameColumn(columnKey) && out.trim() !== '') {
        out = out.trim().toLocaleUpperCase('pt-PT');
    }
    return out;
}

/** null = valor não reconhecido como booleano */
export function coerceToBoolean(val) {
    if (val === null || val === undefined || val === '') {
        return null;
    }
    if (val === true || val === false) {
        return val;
    }
    if (typeof val === 'number') {
        if (val === 1) {
            return true;
        }
        if (val === 0) {
            return false;
        }
        return null;
    }
    if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (['true', '1', 'yes', 'sim'].includes(s)) {
            return true;
        }
        if (['false', '0', 'no', 'não', 'nao'].includes(s)) {
            return false;
        }
        return null;
    }
    return null;
}

export function collectColumnKeys(rows) {
    const set = new Set();
    for (const u of rows) {
        if (u && typeof u === 'object' && !Array.isArray(u)) {
            Object.keys(u).forEach((k) => {
                if (!isHiddenUserColumnKey(k)) {
                    set.add(k);
                }
            });
        }
    }
    const ordered = COLUMN_KEY_ORDER.filter((k) => set.has(k));
    const rest = [...set]
        .filter((k) => !COLUMN_KEY_ORDER.includes(k))
        .sort((a, b) => a.localeCompare(b));
    return [...ordered, ...rest];
}

/** Inicializa `role_groups` para editar utilizador: só listas de aluno (LEARNER). */
export function buildRoleGroupsFormFromUser(u) {
    const roles = normalizePossibleRolesRaw(u?.possibleRoles ?? u?.possible_roles);
    const out = {};
    if (!roles.includes('LEARNER')) {
        return out;
    }
    const gfr = u?.groupsForRoles ?? u?.groups_for_roles ?? {};
    const entries = normalizeRoleGroupEntries(gfr, 'LEARNER');
    const ids = [];
    const seen = new Set();
    for (const e of entries) {
        const id = String(e?.identifier ?? '').trim();
        if (id && !seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    }
    out.LEARNER = ids;
    return out;
}

/** Payload alinhado à validação `EnableyUserController@update` (a partir de uma linha da tabela). */
export function userRowToUpdatePayload(u) {
    const roles = normalizePossibleRolesRaw(u?.possibleRoles ?? u?.possible_roles);
    const active = coerceToBoolean(u?.isActive ?? u?.is_active);
    const first = String(u?.firstName ?? u?.first_name ?? '').trim();
    const last = String(u?.lastName ?? u?.last_name ?? '').trim();
    const emailRaw = u?.email;
    return {
        first_name: first,
        last_name: last,
        username: String(u?.username ?? '').trim(),
        email: emailRaw != null && String(emailRaw).trim() !== '' ? String(emailRaw).trim() : '',
        possible_roles: roles,
        address: typeof u?.address === 'string' && u.address.trim() !== '' ? u.address.trim() : '—',
        is_active: active !== false,
    };
}
