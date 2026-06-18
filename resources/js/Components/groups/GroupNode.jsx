import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import GroupUsersModal from './GroupUsersModal';

export default function GroupNode({
    node,
    depth = 0,
    onOpenCreateChild,
    onOpenEditGroup,
    onDeleteGroup,
    treeSync = 0,
    treeBulkExpanded = true,
    focusGroupIdentifier = '',
    forceExpandedIds,
}) {
    const hasKids = node.children && node.children.length > 0;
    const userCount = Array.isArray(node.users) ? node.users.length : 0;
    const canToggle = hasKids;
    const [open, setOpen] = useState(true);
    const [usersModalOpen, setUsersModalOpen] = useState(false);
    const [actionsOpen, setActionsOpen] = useState(false);
    const actionsWrapRef = useRef(null);
    const rowRef = useRef(null);

    useEffect(() => {
        if (treeSync === 0) {
            return;
        }
        setOpen(treeBulkExpanded);
    }, [treeSync, treeBulkExpanded]);

    useEffect(() => {
        if (forceExpandedIds?.has(node.identifier)) {
            setOpen(true);
        }
    }, [forceExpandedIds, node.identifier]);

    useEffect(() => {
        if (
            !focusGroupIdentifier ||
            node.identifier !== focusGroupIdentifier ||
            !rowRef.current
        ) {
            return;
        }
        rowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [focusGroupIdentifier, node.identifier]);

    useEffect(() => {
        if (!actionsOpen) {
            return undefined;
        }
        const onDoc = (e) => {
            if (actionsWrapRef.current && !actionsWrapRef.current.contains(e.target)) {
                setActionsOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setActionsOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [actionsOpen]);

    const closeActions = () => setActionsOpen(false);
    const indentStepPx = 20;
    const treeIndentPx = depth * indentStepPx;

    return (
        <li className="list-none w-full min-w-0">
            <div
                ref={rowRef}
                className={`-mx-1.5 grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 rounded-md px-1.5 py-1.5 transition-[background-color,box-shadow] duration-200 ease-out hover:bg-[#04385D]/[0.07] hover:shadow-sm focus-within:bg-[#04385D]/[0.07] focus-within:shadow-sm ${
                    focusGroupIdentifier && node.identifier === focusGroupIdentifier
                        ? 'ring-2 ring-[#20A39E] ring-offset-2 ring-offset-[#F2F2E9]'
                        : ''
                }`}
            >
                <div className="min-w-0">
                    <div
                        className="border-l border-slate-300 pl-2"
                        style={{ marginLeft: treeIndentPx }}
                    >
                        <div className="flex w-full min-w-0 items-start gap-0.5">
                            {canToggle ? (
                                <button
                                    type="button"
                                    className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#0d7c78] transition hover:bg-slate-200/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0d7c78]"
                                    onClick={() => setOpen((v) => !v)}
                                    aria-expanded={open}
                                    aria-label={open ? 'Recolher grupo' : 'Expandir grupo'}
                                >
                                    {open ? (
                                        <ChevronDown className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                    )}
                                </button>
                            ) : (
                                <span className="w-6 shrink-0" aria-hidden />
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-medium text-[#0d7c78]">
                                    <span>{node.name}</span>
                                    {node.type ? (
                                        <span className="text-xs font-normal text-slate-500">{node.type}</span>
                                    ) : null}
                                    <span
                                        className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#20A39E]/20 px-1 text-[0.65rem] font-semibold tabular-nums leading-none text-[#0d7c78]"
                                        title={`${userCount} usuário${userCount === 1 ? '' : 's'}`}
                                    >
                                        {userCount}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative shrink-0 justify-self-end self-start pt-1" ref={actionsWrapRef}>
                <button
                    type="button"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#20A39E] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0d7c78] shadow-sm transition hover:scale-[1.02] hover:bg-[#20A39E] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d7c78] sm:text-sm"
                    aria-expanded={actionsOpen}
                    aria-haspopup="menu"
                    aria-label="Abrir menu de ações do grupo"
                    onClick={() => setActionsOpen((v) => !v)}
                >
                    <MoreVertical className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                    <span>Ações</span>
                </button>
                {actionsOpen ? (
                    <ul
                        className="absolute right-0 z-[80] mt-1 min-w-[14rem] overflow-hidden rounded-lg border border-slate-200/90 bg-white py-1 shadow-lg ring-1 ring-slate-200/50"
                        role="menu"
                        aria-label="Ações do grupo"
                    >
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-[#20A39E]/10"
                                onClick={() => {
                                    setUsersModalOpen(true);
                                    closeActions();
                                }}
                            >
                                <Eye className="h-4 w-4 shrink-0 text-[#0d7c78]" strokeWidth={2.25} aria-hidden />
                                Ver usuários
                            </button>
                        </li>
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-[#20A39E]/10"
                                onClick={() => {
                                    onOpenEditGroup?.(node);
                                    closeActions();
                                }}
                            >
                                <Pencil className="h-4 w-4 shrink-0 text-[#0d7c78]" strokeWidth={2.25} aria-hidden />
                                Editar grupo
                            </button>
                        </li>
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-[#20A39E]/10"
                                onClick={() => {
                                    onOpenCreateChild?.(node);
                                    closeActions();
                                }}
                            >
                                <Plus className="h-4 w-4 shrink-0 text-[#0d7c78]" strokeWidth={2.25} aria-hidden />
                                Criar subgrupo
                            </button>
                        </li>
                        <li className="my-1 border-t border-slate-200" role="separator" aria-hidden />
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-700 transition hover:bg-red-50"
                                onClick={() => {
                                    onDeleteGroup?.(node);
                                    closeActions();
                                }}
                            >
                                <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                                Apagar grupo
                            </button>
                        </li>
                    </ul>
                ) : null}
                </div>
            </div>
            {open && hasKids ? (
                <ul className="w-full min-w-0 pl-0">
                    {node.children.map((c) => (
                        <GroupNode
                            key={c.identifier}
                            node={c}
                            depth={depth + 1}
                            onOpenCreateChild={onOpenCreateChild}
                            onOpenEditGroup={onOpenEditGroup}
                            onDeleteGroup={onDeleteGroup}
                            treeSync={treeSync}
                            treeBulkExpanded={treeBulkExpanded}
                            focusGroupIdentifier={focusGroupIdentifier}
                            forceExpandedIds={forceExpandedIds}
                        />
                    ))}
                </ul>
            ) : null}
            <GroupUsersModal
                open={usersModalOpen}
                onClose={() => setUsersModalOpen(false)}
                groupName={node.name}
                groupIdentifier={node.identifier}
                users={node.users}
            />
        </li>
    );
}
