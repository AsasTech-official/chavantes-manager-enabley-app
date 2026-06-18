import { X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

export default function CreateGroupDrawer({ open, onClose, parentGroup, groupTypes, form, postUrl = '/grupos', postOptions = {} }) {
    if (!open) {
        return null;
    }

    const submit = (e) => {
        e.preventDefault();
        form.post(postUrl, {
            preserveScroll: true,
            ...postOptions,
        });
    };

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
            <AnimatedDialogBackdrop
                onClose={onClose}
                ariaLabel="Fechar painel"
                closeDisabled={form.processing}
            />
            <AnimatedContent
                {...DIALOG_MOTION}
                direction="horizontal"
                className="absolute right-0 top-0 z-10 h-full w-full max-w-md"
            >
                <aside className="flex h-full w-full flex-col border-l border-[#04385D] bg-[#F2F2E9] shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-200/90 bg-[#04385D] px-5 py-4">
                        <h2 id="create-group-title" className="text-lg font-semibold text-[#F2F2E9]">
                            Novo grupo
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
                    <form onSubmit={submit} className="flex flex-1 flex-col gap-0 overflow-y-auto p-5">
                        <div className="pb-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Grupo pai</p>
                            <p className="mt-1 text-sm text-slate-800">{parentGroup?.name ? parentGroup.name : 'Nível raiz'}</p>
                        </div>
                        <hr className="mb-4 border-0 border-t border-slate-200" />
                        <div className="pb-4">
                            <label htmlFor="new-group-name" className="block text-sm font-medium text-slate-700">
                                Nome do grupo
                            </label>
                            <input
                                id="new-group-name"
                                type="text"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value.toLocaleUpperCase('pt-PT'))}
                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-wide text-slate-900 shadow-sm focus:border-[#0d7c78] focus:outline-none focus:ring-2 focus:ring-[#0d7c78]/25"
                                autoComplete="off"
                                required
                                disabled={form.processing}
                            />
                            {form.errors.name ? <p className="mt-1 text-xs text-red-700">{form.errors.name}</p> : null}
                        </div>
                        <hr className="mb-4 border-0 border-t border-slate-200" />
                        <div className="pb-4">
                            <label htmlFor="new-group-type" className="block text-sm font-medium text-slate-700">
                                Tipo de grupo
                            </label>
                            <select
                                id="new-group-type"
                                value={form.data.type}
                                onChange={(e) => form.setData('type', e.target.value)}
                                className="mt-1 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-wide text-slate-900 shadow-sm focus:border-[#0d7c78] focus:outline-none focus:ring-2 focus:ring-[#0d7c78]/25"
                                required
                                disabled={form.processing || groupTypes.length === 0}
                            >
                                <option value="">
                                    {groupTypes.length === 0 ? '— Sem tipos (API indisponível) —' : '— Escolher tipo —'}
                                </option>
                                {groupTypes.map((t) => (
                                    <option key={t} value={t}>
                                        {String(t).toLocaleUpperCase('pt-PT')}
                                    </option>
                                ))}
                            </select>
                            {form.errors.type ? <p className="mt-1 text-xs text-red-700">{form.errors.type}</p> : null}
                        </div>
                        {form.errors.parent_identifier ? (
                            <p className="text-xs text-red-700">{form.errors.parent_identifier}</p>
                        ) : null}
                        <div className="mt-auto flex gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:scale-105 hover:bg-slate-50"
                                disabled={form.processing}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 cursor-pointer rounded-lg bg-[#04385D] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:scale-105 hover:bg-[#205E8A] disabled:opacity-60"
                                disabled={form.processing || groupTypes.length === 0}
                            >
                                {form.processing ? 'Criando…' : 'Criar grupo'}
                            </button>
                        </div>
                    </form>
                </aside>
            </AnimatedContent>
        </div>
    );
}
