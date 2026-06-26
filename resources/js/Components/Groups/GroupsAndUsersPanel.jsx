import { useState } from 'react';
import { FoldVertical, UnfoldVertical } from 'lucide-react';
import GroupNode from './GroupNode';
import UserLine from './UserLine';

export default function GroupsAndUsersPanel({
    enableyError,
    enableyTree,
    showOrphanUserSections = true,
    focusGroupIdentifier = '',
    forceExpandedIds,
}) {
    const [treeBulkExpanded, setTreeBulkExpanded] = useState(true);
    const [treeSync, setTreeSync] = useState(0);

    const tree = enableyTree?.tree ?? [];
    const unassigned = enableyTree?.unassigned ?? [];
    const unknown = enableyTree?.unknownGroupMemberships ?? [];

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
            {enableyError ? (
                <pre className="mb-4 overflow-x-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{enableyError}</pre>
            ) : null}

            {!enableyError && enableyTree ? (
                <>
                    <div className="flex flex-col gap-3 border-b-2 border-[#04385D] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <h2 className="pl-3 text-lg font-bold leading-snug tracking-tight text-[#1F3860] sm:text-xl">
                            Grupos Organizacionais
                        </h2>
                        {tree.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setTreeBulkExpanded((prev) => !prev);
                                    setTreeSync((s) => s + 1);
                                }}
                                aria-label={
                                    treeBulkExpanded
                                        ? 'Recolher toda a árvore de grupos'
                                        : 'Expandir toda a árvore de grupos'
                                }
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1F3860] bg-white px-3 py-2 text-sm font-medium text-[#1F3860] shadow-sm transition hover:scale-105 hover:border-[#3757A1]/50 hover:bg-[#1F3860] hover:text-white sm:shrink-0"
                            >
                                {treeBulkExpanded ? (
                                    <>
                                        <FoldVertical className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                        Recolher árvore
                                    </>
                                ) : (
                                    <>
                                        <UnfoldVertical className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                        Expandir árvore
                                    </>
                                )}
                            </button>
                        ) : null}
                    </div>
                    {tree.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-600">Nenhum grupo existente</p>
                    ) : null}
                    {tree.length > 0 ? (
                        <ul className="mt-4 divide-y divide-slate-300/80 pl-0 [&>li]:py-4 [&>li]:first:pt-3 [&>li]:last:pb-0">
                            {tree.map((n) => (
                                <GroupNode
                                    key={n.identifier}
                                    node={n}
                                    treeSync={treeSync}
                                    treeBulkExpanded={treeBulkExpanded}
                                    focusGroupIdentifier={focusGroupIdentifier}
                                    forceExpandedIds={forceExpandedIds}
                                />
                            ))}
                        </ul>
                    ) : null}

                    {showOrphanUserSections && unassigned.length > 0 ? (
                        <div className="mt-6 border-t-2 border-[#04385D] pt-6">
                            <h3 className="text-sm font-medium text-slate-700">Usuários sem grupo</h3>
                            <ul className="pl-0">
                                {unassigned.map((u) => (
                                    <UserLine key={u.identifier} u={u} />
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {showOrphanUserSections && unknown.length > 0 ? (
                        <div className="mt-6 border-t border-slate-300/80 pt-6">
                            <h3 className="text-sm font-medium text-amber-800">
                                Membros noutros identificadores de grupo (não na listagem de grupos)
                            </h3>
                            {unknown.map((b) => (
                                <div
                                    key={b.groupId}
                                    className="mt-3 border-t border-slate-200/90 pt-3 first:mt-0 first:border-t-0 first:pt-0"
                                >
                                    <p className="text-xs text-slate-600">{b.groupId}</p>
                                    <ul className="pl-0">
                                        {b.users.map((u) => (
                                            <UserLine key={`${b.groupId}-${u.identifier}`} u={u} />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
