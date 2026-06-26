import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Eye, MoreHorizontal } from 'lucide-react';
import RoleGroupsModal from '@/Components/groups/RoleGroupsModal';
import DataTableLayout, { PAGE_SIZE_ALL } from '@/Components/ui/DataTableLayout';
import {
    PAGE_SIZES,
    USERS_BUSCA_QUERY,
    IS_ACTIVE_STATUS_KEYS,
    POSSIBLE_ROLES_KEYS,
    canonColumnKey,
    columnLabel,
    collectColumnKeys,
    coerceToBoolean,
    formatUserCellValue,
    isPersonNameColumn,
    labelEnableyRole,
    matchesSearch,
    normalizePossibleRolesRaw,
    normalizeRoleGroupEntries,
    roleGroupsEmptyMessage,
} from './usersTableConfig';

export { GROUP_FOCUS_QUERY, USERS_BUSCA_QUERY } from './usersTableConfig';

function userRowSubtitle(u) {
    const parts = [u?.firstName, u?.lastName]
        .filter((x) => x != null && String(x).trim() !== '')
        .map((x) => String(x).trim());
    const full = parts.join(' ').trim();
    if (full) {
        return full;
    }
    if (u?.username != null && String(u.username).trim() !== '') {
        return String(u.username).trim();
    }
    if (u?.identifier != null && String(u.identifier).trim() !== '') {
        return String(u.identifier).trim();
    }
    return '';
}

const ACTIONS_MENU_MIN_PX = 176;

/** Posição do menu de ações no viewport (`position: fixed`). */
function computeActionsMenuPosition(triggerRect) {
    let left = triggerRect.left;
    if (left + ACTIONS_MENU_MIN_PX > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - 8 - ACTIONS_MENU_MIN_PX);
    }
    return {
        top: triggerRect.bottom + 6,
        left,
    };
}

const CELL_MAX_W = 'max-w-[min(24rem,40vw)]';

export default function GroupUsersTable({
    users,
    resetKey,
    variant = 'page',
    emptyListMessage = 'Nenhum usuário.',
    searchPlaceholder = 'Buscar em todos os campos do usuário…',
    initialSearchQuery = '',
    showViewInUsersAction = false,
    showUserMaintenanceActions = false,
    onEditUser,
    onDeactivateUser,
    onActivateUser,
    onBeforeNavigateToUsers,
    onTableStatsChange,
}) {
    const list = Array.isArray(users) ? users : [];
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(1);
    const [roleGroupsModal, setRoleGroupsModal] = useState(null);
    /** Menu de manutenção: um único painel `fixed` (detalhes na tabela sobrepoem linhas). */
    const [actionsMenu, setActionsMenu] = useState(null);

    useEffect(() => {
        setPageSize(25);
        setPage(1);
        if (variant === 'modal') {
            setSearchQuery('');
        }
    }, [resetKey, variant]);

    useEffect(() => {
        if (variant !== 'page') {
            return;
        }
        setSearchQuery(initialSearchQuery ?? '');
        setPage(1);
    }, [initialSearchQuery, variant]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, pageSize]);

    const filtered = useMemo(
        () => list.filter((u) => matchesSearch(u, searchQuery)),
        [list, searchQuery],
    );

    const columnKeys = useMemo(() => collectColumnKeys(list), [list]);

    const effectivePageSize =
        pageSize === PAGE_SIZE_ALL ? Math.max(filtered.length, 1) : pageSize;
    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / effectivePageSize) || 1,
    );
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * effectivePageSize;
    const pageRows = filtered.slice(startIdx, startIdx + effectivePageSize);

    useEffect(() => {
        if (page !== safePage) {
            setPage(safePage);
        }
    }, [page, safePage]);

    useEffect(() => {
        onTableStatsChange?.({
            searchQuery,
            filteredCount: filtered.length,
            totalCount: list.length,
        });
    }, [searchQuery, filtered.length, list.length, onTableStatsChange]);

    useEffect(() => {
        setActionsMenu(null);
    }, [resetKey, searchQuery, pageSize, safePage]);

    useEffect(() => {
        if (!actionsMenu) {
            return undefined;
        }
        const close = () => setActionsMenu(null);
        const onKey = (ev) => {
            if (ev.key === 'Escape') {
                close();
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
        };
    }, [actionsMenu]);

    const goToUsersFiltered = (u) => {
        const id = u?.identifier;
        if (id == null || String(id).trim() === '') {
            return;
        }
        onBeforeNavigateToUsers?.();
        router.get('/usuarios', { [USERS_BUSCA_QUERY]: String(id).trim() });
    };

    const toggleActionsMenu = useCallback((e, u) => {
        e.stopPropagation();
        const sid = u?.identifier != null ? String(u.identifier) : '';
        if (sid === '') {
            return;
        }
        const trigger = e.currentTarget;
        if (!trigger || typeof trigger.getBoundingClientRect !== 'function') {
            return;
        }
        const pos = computeActionsMenuPosition(trigger.getBoundingClientRect());
        setActionsMenu((prev) => {
            if (
                prev?.user?.identifier != null
                && String(prev.user.identifier) === sid
            ) {
                return null;
            }
            return { user: u, ...pos };
        });
    }, []);

    const showActionsColumn = showViewInUsersAction || showUserMaintenanceActions;

    const actionsHeadClass =
        'whitespace-nowrap border-l border-[#04385D]/25 px-3 py-2.5 text-left';
    const actionsCellClass = (rowStripe) =>
        `whitespace-nowrap border-l border-slate-200/90 px-2 py-2 align-middle text-left transition-colors ${rowStripe}`;

    if (list.length === 0) {
        return (
            <p className="text-center text-sm text-slate-600">
                {emptyListMessage}
            </p>
        );
    }

    return (
        <>
            <DataTableLayout
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder={searchPlaceholder}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                page={page}
                onPageChange={setPage}
                totalItems={list.length}
                filteredItemsCount={filtered.length}
                emptyMessage={emptyListMessage}
                variant={variant}
            >
                        <table className="w-full min-w-max text-left text-sm text-slate-800">
                            <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-[#04385D]/95 text-xs font-semibold uppercase tracking-wide text-[#F2F2E9] backdrop-blur-sm">
                                <tr>
                                    {columnKeys.map((key) => (
                                        <th
                                            key={key}
                                            scope="col"
                                            className={`${CELL_MAX_W} whitespace-nowrap px-3 py-2.5`}
                                            title={key}
                                        >
                                            {columnLabel(key)}
                                        </th>
                                    ))}
                                    {showActionsColumn ? (
                                        <th scope="col" className={actionsHeadClass}>
                                            Ações
                                        </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((u, i) => {
                                    const globalRowIndex = startIdx + i;
                                    const rowStripe = `${
                                        globalRowIndex % 2 === 0
                                            ? 'bg-white'
                                            : 'bg-[#46A6B9]/10'
                                    } group-hover:bg-[#3757A1]/15`;
                                    return (
                                        <tr
                                            key={`${String(u.identifier ?? '')}-${globalRowIndex}`}
                                            className="group border-b border-slate-200/80 transition-colors"
                                        >
                                            {columnKeys.map((key) => {
                                                const raw = u[key];
                                                const isActiveCol =
                                                    IS_ACTIVE_STATUS_KEYS.has(
                                                        canonColumnKey(key),
                                                    );
                                                const isRolesCol =
                                                    POSSIBLE_ROLES_KEYS.has(
                                                        canonColumnKey(key),
                                                    );
                                                const rolesList = isRolesCol
                                                    ? normalizePossibleRolesRaw(
                                                          raw,
                                                      )
                                                    : [];
                                                const active = isActiveCol
                                                    ? coerceToBoolean(raw)
                                                    : null;
                                                const isNameCol =
                                                    isPersonNameColumn(key);
                                                const text =
                                                    formatUserCellValue(
                                                        raw,
                                                        key,
                                                    );
                                                const isId =
                                                    key === 'identifier';
                                                const isLong =
                                                    !isActiveCol &&
                                                    !isRolesCol &&
                                                    (typeof raw === 'object' ||
                                                        (typeof text ===
                                                            'string' &&
                                                            text.length > 80));
                                                return (
                                                    <td
                                                        key={key}
                                                        className={`${CELL_MAX_W} px-3 py-2.5 align-top text-slate-700 transition-colors ${rowStripe} ${
                                                            isId
                                                                ? 'font-mono text-xs text-slate-600'
                                                                : ''
                                                        } ${isNameCol ? 'uppercase' : ''} ${isRolesCol || isLong ? 'whitespace-normal break-words' : 'whitespace-nowrap'}`}
                                                        title={
                                                            isLong
                                                                ? text
                                                                : isRolesCol &&
                                                                    rolesList.length
                                                                  ? rolesList.join(
                                                                        ', ',
                                                                    )
                                                                  : undefined
                                                        }
                                                    >
                                                        {isActiveCol ? (
                                                            active === null ? (
                                                                '—'
                                                            ) : active ? (
                                                                <span className="inline-flex rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/25">
                                                                    Ativo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full bg-red-600/15 px-2.5 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-600/25">
                                                                    Inativo
                                                                </span>
                                                            )
                                                        ) : isRolesCol ? (
                                                            rolesList.length ===
                                                            0 ? (
                                                                '—'
                                                            ) : (
                                                                <span className="flex max-w-[20rem] flex-wrap gap-1.5 sm:max-w-[28rem]">
                                                                    {rolesList.map(
                                                                        (
                                                                            code,
                                                                            ri,
                                                                        ) => (
                                                                            <button
                                                                                key={`${code}-${ri}`}
                                                                                type="button"
                                                                                className="inline-flex cursor-pointer rounded-full border border-[#04385D]/20 bg-[#04385D]/8 px-2 py-0.5 text-xs font-medium text-slate-800 transition hover:scale-105 hover:border-[#04385D]/40 hover:bg-[#04385D]/15 active:scale-100"
                                                                                title="Ver grupos deste papel"
                                                                                onClick={() =>
                                                                                    setRoleGroupsModal({
                                                                                        roleCode: code,
                                                                                        entries:
                                                                                            normalizeRoleGroupEntries(
                                                                                                u.groupsForRoles,
                                                                                                code,
                                                                                            ),
                                                                                        subtitle:
                                                                                            userRowSubtitle(u),
                                                                                        emptyMessage:
                                                                                            roleGroupsEmptyMessage(
                                                                                                code,
                                                                                            ),
                                                                                    })
                                                                                }
                                                                            >
                                                                                {labelEnableyRole(code)}
                                                                            </button>
                                                                        ),
                                                                    )}
                                                                </span>
                                                            )
                                                        ) : (
                                                            text
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {showActionsColumn ? (
                                                <td className={actionsCellClass(rowStripe)}>
                                                    <div className="flex flex-wrap items-center justify-end gap-1">
                                                        {showViewInUsersAction ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => goToUsersFiltered(u)}
                                                                disabled={!u?.identifier}
                                                                className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#04385D]/30 bg-white text-[#04385D] shadow-sm transition hover:border-[#04385D]/50 hover:bg-[#04385D]/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                                title="Ver na página Usuários"
                                                                aria-label="Ver este usuário na lista completa de Usuários"
                                                            >
                                                                <Eye
                                                                    className="h-4 w-4"
                                                                    strokeWidth={2}
                                                                    aria-hidden
                                                                />
                                                            </button>
                                                        ) : null}
                                                        {showUserMaintenanceActions ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => toggleActionsMenu(e, u)}
                                                                aria-expanded={
                                                                    actionsMenu?.user?.identifier === u?.identifier
                                                                }
                                                                aria-haspopup="menu"
                                                                className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-[#04385D]/30 bg-white px-2.5 text-xs font-semibold text-[#04385D] shadow-sm transition hover:border-[#04385D]/50 hover:bg-[#04385D]/10"
                                                                aria-label="Menu de ações do usuário"
                                                            >
                                                                <span>Ações</span>
                                                                <MoreHorizontal
                                                                    className="h-4 w-4 shrink-0 opacity-80"
                                                                    strokeWidth={2}
                                                                    aria-hidden
                                                                />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
        </DataTableLayout>
            {actionsMenu && showUserMaintenanceActions ? (
                <>
                    <div
                        className="fixed inset-0 z-[90]"
                        aria-hidden
                        onClick={() => setActionsMenu(null)}
                    />
                    <div
                        role="menu"
                        className="fixed z-[100] min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
                        style={{ top: actionsMenu.top, left: actionsMenu.left }}
                    >
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                const u = actionsMenu.user;
                                setActionsMenu(null);
                                onEditUser?.(u);
                            }}
                            className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                            Editar
                        </button>
                        {coerceToBoolean(
                            actionsMenu.user?.isActive ?? actionsMenu.user?.is_active,
                        ) !== false ? (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const u = actionsMenu.user;
                                    setActionsMenu(null);
                                    onDeactivateUser?.(u);
                                }}
                                className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-red-800 hover:bg-red-50"
                            >
                                Inativar
                            </button>
                        ) : (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const u = actionsMenu.user;
                                    setActionsMenu(null);
                                    onActivateUser?.(u);
                                }}
                                className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-emerald-800 hover:bg-emerald-50"
                            >
                                Ativar
                            </button>
                        )}
                    </div>
                </>
            ) : null}
            <RoleGroupsModal
                open={roleGroupsModal != null}
                onClose={() => setRoleGroupsModal(null)}
                roleCode={roleGroupsModal?.roleCode}
                entries={roleGroupsModal?.entries ?? []}
                subtitle={roleGroupsModal?.subtitle}
                emptyMessage={roleGroupsModal?.emptyMessage}
            />
        </>
    );
}
