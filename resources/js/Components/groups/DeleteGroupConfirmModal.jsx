import { X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

export default function DeleteGroupConfirmModal({ open, groupNode, onClose, onConfirm, processing }) {
    if (!open || !groupNode) {
        return null;
    }

    const name = groupNode.name ? String(groupNode.name) : 'este grupo';

    return (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="delete-group-title">
            <AnimatedDialogBackdrop onClose={onClose} ariaLabel="Fechar" closeDisabled={processing} />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
                <AnimatedContent
                    key={groupNode.identifier}
                    {...DIALOG_MOTION}
                    className="pointer-events-auto w-full max-w-md"
                >
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#04385D] bg-[#F2F2E9] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200/90 bg-[#04385D] px-5 py-4">
                            <h2 id="delete-group-title" className="text-lg font-semibold text-[#F2F2E9]">
                                Deletar Grupo
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#F2F2E9] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2F2E9]"
                                aria-label="Fechar"
                                disabled={processing}
                            >
                                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                            </button>
                        </div>
                        <div className="flex flex-1 flex-col gap-0 p-5">
                            <p className="text-sm leading-relaxed text-slate-800">
                                Tem a certeza que deseja apagar o grupo{' '}
                                <span className="font-semibold text-slate-900"> {name}</span>? <br />
                                <span className="text-slate-900">Está ação não pode ser anulada.</span>
                            </p>
                            {groupNode.identifier ? (
                                <p className="mt-3 break-all font-mono text-xs text-slate-500">
                                    ID: {groupNode.identifier}
                                </p>
                            ) : null}
                        </div>
                        <div className="flex gap-2 border-t border-slate-200 p-5 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:scale-105 hover:bg-slate-50"
                                disabled={processing}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex-1 cursor-pointer rounded-lg border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:scale-105 hover:border-red-700 hover:bg-red-700 disabled:opacity-60"
                                disabled={processing}
                            >
                                {processing ? 'Apagando' : 'Deletar Grupo'}
                            </button>
                        </div>
                    </div>
                </AnimatedContent>
            </div>
        </div>
    );
}
