import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import DataTableLayout, { PAGE_SIZE_ALL } from '@/Components/UI/DataTableLayout';

const ACTIONS_MENU_MIN_PX = 176;

function computeActionsMenuPosition(triggerRect) {
    let left = triggerRect.left - ACTIONS_MENU_MIN_PX + triggerRect.width;
    if (left < 8) left = 8;
    return {
        top: triggerRect.bottom + 6,
        left,
    };
}

export default function SystemUsersTable({
    systemUsers,
    currentUserId,
    onEditUser,
    onDeleteUser,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [actionsMenu, setActionsMenu] = useState(null);

    const filteredUsers = systemUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.includes(searchQuery)
    );

    const effectivePageSize = pageSize === PAGE_SIZE_ALL ? Math.max(filteredUsers.length, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / effectivePageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * effectivePageSize;
    const paginatedUsers = filteredUsers.slice(startIdx, startIdx + effectivePageSize);

    // Reset to page 1 when searching
    useEffect(() => {
        setPage(1);
    }, [searchQuery, pageSize]);

    useEffect(() => {
        setActionsMenu(null);
    }, [searchQuery, pageSize, safePage]);

    useEffect(() => {
        if (!actionsMenu) return undefined;
        
        const close = () => setActionsMenu(null);
        const onKey = (ev) => {
            if (ev.key === 'Escape') close();
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

    const toggleActionsMenu = useCallback((e, user) => {
        e.stopPropagation();
        if (!user || !user.id) return;
        
        const trigger = e.currentTarget;
        if (!trigger || typeof trigger.getBoundingClientRect !== 'function') return;
        
        const pos = computeActionsMenuPosition(trigger.getBoundingClientRect());
        setActionsMenu((prev) => {
            if (prev?.user?.id === user.id) {
                return null;
            }
            return { user, ...pos };
        });
    }, []);

    return (
        <>
            <DataTableLayout
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar por Nome ou CPF..."
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                page={page}
                onPageChange={setPage}
                totalItems={systemUsers.length}
                filteredItemsCount={filteredUsers.length}
                emptyMessage="Nenhum usuário do sistema encontrado."
            >
                <table className="w-full min-w-max text-left text-sm text-slate-800">
                    <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-[#04385D]/95 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                        <tr>
                            <th scope="col" className="whitespace-nowrap px-3 py-2.5">
                                Nome
                            </th>
                            <th scope="col" className="whitespace-nowrap px-3 py-2.5">
                                Username
                            </th>
                            <th scope="col" className="whitespace-nowrap border-l border-[#04385D]/25 px-3 py-2.5 text-left">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user, index) => {
                            const globalRowIndex = startIdx + index;
                            const rowStripe = `${globalRowIndex % 2 === 0 ? 'bg-white' : 'bg-[#46A6B9]/10'} group-hover:bg-[#3757A1]/15`;
                            const isSelf = user.id === currentUserId;
                            return (
                                <tr key={user.id} className={`group border-b border-slate-200/80 transition-colors ${rowStripe}`}>
                                    <td className={`whitespace-nowrap px-3 py-2.5 align-top text-slate-700 transition-colors ${rowStripe}`}>
                                        <div className="flex items-center gap-2">
                                            {user.name}
                                            {isSelf && (
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                    Você
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`whitespace-nowrap px-3 py-2.5 align-top text-slate-600 transition-colors ${rowStripe}`}>
                                        {user.username}
                                    </td>
                                    <td className={`whitespace-nowrap border-l border-slate-200/90 px-2 py-2 align-middle text-left transition-colors ${rowStripe}`}>
                                        <div className="flex flex-wrap items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => toggleActionsMenu(e, user)}
                                                aria-expanded={actionsMenu?.user?.id === user.id}
                                                className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border border-[#04385D]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#04385D] shadow-sm hover:border-[#04385D]/50 hover:bg-[#04385D]/10 focus:outline-none"
                                            >
                                                Ações
                                                <ChevronDown className="h-4 w-4 opacity-80" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </DataTableLayout>
            
            {actionsMenu && (
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
                                onEditUser(u);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                            <Pencil className="h-4 w-4 text-slate-600" />
                            Editar Dados
                        </button>
                        {actionsMenu.user.id !== currentUserId && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    const u = actionsMenu.user;
                                    setActionsMenu(null);
                                    onDeleteUser(u);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-red-800 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Excluir Usuário
                            </button>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
