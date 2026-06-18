import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';
import GroupUsersTable from './users-table';

export default function GroupUsersModal({ open, onClose, groupName, groupIdentifier, users }) {
    const list = Array.isArray(users) ? users : [];
    const [tableStats, setTableStats] = useState({
        searchQuery: '',
        filteredCount: 0,
        totalCount: 0,
    });

    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setTableStats({
                searchQuery: '',
                filteredCount: list.length,
                totalCount: list.length,
            });
        }
    }, [open, groupIdentifier, list.length]);

    if (!open) {
        return null;
    }

    const titleId = 'group-users-modal-title';

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <AnimatedDialogBackdrop onClose={onClose} ariaLabel="Fechar" />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
                <AnimatedContent
                    key={groupIdentifier ?? groupName ?? 'users'}
                    {...DIALOG_MOTION}
                    className="pointer-events-auto flex h-[min(90vh,800px)] max-h-[min(90vh,800px)] w-full max-w-[min(1600px,calc(100vw-2rem))] flex-col overflow-hidden"
                >
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#04385D] bg-[#F2F2E9] shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-[#04385D] px-5 py-4">
                            <h2 id={titleId} className="text-lg font-semibold text-[#F2F2E9]">
                                Usuários do grupo
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#F2F2E9] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2F2E9]"
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </button>
                        </div>
                        <p className="shrink-0 border-b border-slate-200/80 px-5 py-3 text-sm font-medium text-slate-800">
                            {groupName?.trim() ? groupName.trim() : '—'}
                            <span className="ml-2 text-xs font-normal text-slate-500">
                                ({list.length} {list.length === 1 ? 'pessoa' : 'pessoas'} no grupo
                                {tableStats.searchQuery.trim() &&
                                tableStats.filteredCount !== list.length
                                    ? ` · ${tableStats.filteredCount} ${
                                          tableStats.filteredCount === 1 ? 'resultado' : 'resultados'
                                      } com o filtro`
                                    : ''}
                                )
                            </span>
                        </p>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5">
                            <GroupUsersTable
                                users={list}
                                resetKey={groupIdentifier ?? groupName}
                                variant="modal"
                                showViewInUsersAction
                                onBeforeNavigateToUsers={onClose}
                                emptyListMessage="Nenhum usuário neste grupo."
                                onTableStatsChange={setTableStats}
                            />
                        </div>
                        <div className="shrink-0 border-t border-slate-200 p-4 sm:px-5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:scale-[1.01] hover:bg-slate-50 sm:w-auto"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </AnimatedContent>
            </div>
        </div>
    );
}
