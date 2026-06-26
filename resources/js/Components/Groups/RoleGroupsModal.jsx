import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Eye, X } from 'lucide-react';
import AnimatedContent from '@/Components/UI/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/UI/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/UI/dialogMotion';
import { GROUP_FOCUS_QUERY, labelEnableyRole } from './UsersTable/usersTableConfig';

/**
 * Lista grupos associados a um papel do utilizador; olho navega para `/home` com o grupo focado na árvore.
 */
export default function RoleGroupsModal({ open, onClose, roleCode, entries = [], subtitle, emptyMessage = '—' }) {
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

    if (!open) {
        return null;
    }

    const titleId = 'role-groups-modal-title';
    const label = labelEnableyRole(roleCode);

    const goToGroup = (identifier) => {
        const id = String(identifier ?? '').trim();
        if (!id) {
            return;
        }
        onClose();
        router.get('/home', { [GROUP_FOCUS_QUERY]: id });
    };

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <AnimatedDialogBackdrop onClose={onClose} ariaLabel="Fechar" />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
                <AnimatedContent
                    key={roleCode ?? 'role-groups'}
                    {...DIALOG_MOTION}
                    className="pointer-events-auto flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col overflow-hidden"
                >
                    <div className="flex max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#04385D] bg-[#F2F2E9] shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-[#04385D] px-5 py-4">
                            <h2 id={titleId} className="text-lg font-semibold text-[#F2F2E9]">
                                Grupos — {label}
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
                        {subtitle?.trim() ? (
                            <p className="shrink-0 border-b border-slate-200/80 px-5 py-2 text-xs text-slate-600">
                                {subtitle.trim()}
                            </p>
                        ) : null}
                        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                            {entries.length === 0 ? (
                                <p className="text-sm text-slate-600">{emptyMessage}</p>
                            ) : (
                                <ul className="divide-y divide-slate-200/90">
                                    {entries.map((row) => (
                                        <li
                                            key={`${row.identifier || 'noid'}-${row.name}`}
                                            className="flex items-center justify-between gap-3 py-3 first:pt-0"
                                        >
                                            <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">
                                                {row.name}
                                            </span>
                                            {row.identifier ? (
                                                <button
                                                    type="button"
                                                    title="Abrir na página de grupos"
                                                    aria-label={`Abrir grupo ${row.name} na página de grupos`}
                                                    onClick={() => goToGroup(row.identifier)}
                                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#1F3860] bg-white p-2 text-[#3757A1] shadow-sm transition hover:scale-105 hover:bg-[#1F3860] hover:text-white"
                                                >
                                                    <Eye className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                                </button>
                                            ) : (
                                                <span className="shrink-0 text-xs text-slate-400">—</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
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
