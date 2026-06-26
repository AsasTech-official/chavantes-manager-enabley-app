import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import DataTableLayout, { PAGE_SIZE_ALL } from '@/Components/ui/DataTableLayout';

const ACTIONS_MENU_MIN_PX = 176;

function computeActionsMenuPosition(triggerRect) {
    let left = triggerRect.left - ACTIONS_MENU_MIN_PX + triggerRect.width;
    if (left < 8) left = 8;
    return {
        top: triggerRect.bottom + 6,
        left,
    };
}

export default function ManagersTable({
    managers,
    onEditManager,
    onGroupsManager,
    onDeleteManager
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [actionsMenu, setActionsMenu] = useState(null);

    const filteredManagers = managers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.username.includes(searchQuery)
    );

    const effectivePageSize = pageSize === PAGE_SIZE_ALL ? Math.max(filteredManagers.length, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredManagers.length / effectivePageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * effectivePageSize;
    const paginatedManagers = filteredManagers.slice(startIdx, startIdx + effectivePageSize);

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

    const toggleActionsMenu = useCallback((e, manager) => {
        e.stopPropagation();
        if (!manager || !manager.id) return;
        
        const trigger = e.currentTarget;
        if (!trigger || typeof trigger.getBoundingClientRect !== 'function') return;
        
        const pos = computeActionsMenuPosition(trigger.getBoundingClientRect());
        setActionsMenu((prev) => {
            if (prev?.manager?.id === manager.id) {
                return null;
            }
            return { manager, ...pos };
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
                totalItems={managers.length}
                filteredItemsCount={filteredManagers.length}
                emptyMessage="Nenhum gerente encontrado."
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
                            <th scope="col" className="whitespace-nowrap px-3 py-2.5">
                                Acesso Concedido
                            </th>
                            <th scope="col" className="whitespace-nowrap border-l border-[#04385D]/25 px-3 py-2.5 text-left">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedManagers.map((manager, index) => {
                            const globalRowIndex = startIdx + index;
                            const rowStripe = `${globalRowIndex % 2 === 0 ? 'bg-white' : 'bg-[#46A6B9]/10'} group-hover:bg-[#3757A1]/15`;
                            return (
                                <tr key={manager.id} className={`group border-b border-slate-200/80 transition-colors ${rowStripe}`}>
                                    <td className={`whitespace-nowrap px-3 py-2.5 align-top text-slate-700 transition-colors ${rowStripe}`}>
                                        {manager.name}
                                    </td>
                                    <td className={`whitespace-nowrap px-3 py-2.5 align-top text-slate-600 transition-colors ${rowStripe}`}>
                                        {manager.username}
                                    </td>
                                    <td className={`px-3 py-2.5 align-top transition-colors ${rowStripe}`}>
                                        {manager.groups.length === 0 ? (
                                            <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                                                Sem acesso
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5">
                                                {manager.groups.slice(0, 3).map(g => (
                                                    <span key={g.id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-[#3757A1] ring-1 ring-inset ring-[#3757A1]/20" title={g.group_name || g.group_identifier}>
                                                        {g.group_name ? (g.group_name.length > 25 ? g.group_name.substring(0, 25) + '...' : g.group_name) : g.group_identifier}
                                                    </span>
                                                ))}
                                                {manager.groups.length > 3 && (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        +{manager.groups.length - 3} mais
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className={`whitespace-nowrap border-l border-slate-200/90 px-2 py-2 align-middle text-left transition-colors ${rowStripe}`}>
                                        <div className="flex flex-wrap items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => toggleActionsMenu(e, manager)}
                                                aria-expanded={actionsMenu?.manager?.id === manager.id}
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
                                const m = actionsMenu.manager;
                                setActionsMenu(null);
                                onGroupsManager(m);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                            <ShieldCheck className="h-4 w-4 text-[#04385D]" />
                            Gerenciar Permissões
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                const m = actionsMenu.manager;
                                setActionsMenu(null);
                                onEditManager(m);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                        >
                            <Pencil className="h-4 w-4 text-slate-600" />
                            Editar Dados
                        </button>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                const m = actionsMenu.manager;
                                setActionsMenu(null);
                                onDeleteManager(m);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-red-800 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            Excluir Gerente
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
