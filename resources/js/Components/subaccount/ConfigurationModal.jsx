import { useEffect, useState } from 'react';
import axios from 'axios';
import { router, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

/**
 * Modal de configuração — senha padrão para novos usuários.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {boolean} props.hasDefaultUserPassword
 * @param {string|null} props.defaultUserPassword
 */
export default function ConfigurationModal({
    open,
    onClose,
    hasDefaultUserPassword = false,
    defaultUserPassword = null,
}) {
    const passwordForm = useForm({
        default_user_password: '',
    });

    useEffect(() => {
        if (!open) {
            passwordForm.reset();
            passwordForm.clearErrors();
        }
    }, [open]);

    if (!open) {
        return null;
    }

    const titleId = 'configuration-modal-title';

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <AnimatedDialogBackdrop onClose={onClose} ariaLabel="Fechar" />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
                <AnimatedContent
                    {...DIALOG_MOTION}
                    className="pointer-events-auto flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden"
                >
                    <div className="flex max-h-[min(90vh,720px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#04385D] bg-[#ffffff] shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/90 bg-[#04385D] px-5 py-4">
                            <h2 id={titleId} className="text-lg font-semibold text-[#F2F2E9]">
                                Configurações
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
                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-8">
                            {/* SENHA PADRÃO */}
                            <section>
                                <h3 className="mb-2 text-md font-semibold text-[#04385D]">
                                    Senha padrão (novos usuários)
                                </h3>
                                <p className="mb-3 text-sm text-slate-600">
                                    Defina a palavra-passe usada em todos os usuários criados em{' '}
                                    <span className="font-medium text-slate-800">Usuários</span>.
                                </p>
                                {hasDefaultUserPassword && defaultUserPassword != null && defaultUserPassword !== '' ? (
                                    <div className="mb-3">
                                        <label
                                            htmlFor="configuration-current-default-password"
                                            className="block text-sm font-medium text-slate-700"
                                        >
                                            Senha padrão atual
                                        </label>
                                        <input
                                            id="configuration-current-default-password"
                                            type="text"
                                            readOnly
                                            value={defaultUserPassword}
                                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900"
                                            aria-describedby="configuration-password-hint"
                                        />
                                        <p id="configuration-password-hint" className="mt-1 text-xs text-slate-500">
                                            Visível apenas neste ecrã após iniciar sessão.
                                        </p>
                                    </div>
                                ) : null}
                                {hasDefaultUserPassword ? (
                                    <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
                                        Senha padrão definida. Pode substituí-la abaixo ou removê-la (deixa de ser possível
                                        criar usuários até definir outra).
                                    </p>
                                ) : (
                                    <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                                        Ainda não há senha padrão. Guarde uma senha abaixo antes de criar usuários na Plataforma.
                                    </p>
                                )}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        passwordForm.put('/configuracoes/senha-padrao-usuarios', {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                passwordForm.reset();
                                            },
                                        });
                                    }}
                                    className="mb-2 space-y-3"
                                >
                                    <div>
                                        <label
                                            htmlFor="configuration-default-password"
                                            className="block text-sm font-medium text-slate-700"
                                        >
                                            {hasDefaultUserPassword ? 'Nova palavra-passe' : 'Palavra-passe'}
                                        </label>
                                        <input
                                            id="configuration-default-password"
                                            type="text"
                                            value={passwordForm.data.default_user_password}
                                            onChange={(e) =>
                                                passwordForm.setData('default_user_password', e.target.value)
                                            }
                                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#3757A1] focus:outline-none focus:ring-2 focus:ring-[#3757A1]/25"
                                            autoComplete="off"
                                            disabled={passwordForm.processing}
                                            minLength={8}
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                        {passwordForm.errors.default_user_password ? (
                                            <p className="mt-1 text-xs text-red-600">
                                                {passwordForm.errors.default_user_password}
                                            </p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="w-full rounded-lg bg-[#04385D] px-4 py-2.5 cursor-pointer hover:scale-105 text-sm font-medium text-white shadow-sm transition hover:bg-[#205E8A] disabled:opacity-60 sm:w-auto"
                                    >
                                        {passwordForm.processing ? 'Salvando…' : 'Salvar senha padrão'}
                                    </button>
                                </form>
                                {hasDefaultUserPassword ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            router.delete('/configuracoes/senha-padrao-usuarios', { preserveScroll: true });
                                        }}
                                        className="mt-2 cursor-pointer hover:scale-105 text-sm font-medium text-rose-700 underline decoration-rose-300 underline-offset-2 hover:text-rose-800"
                                    >
                                        Remover senha padrão
                                    </button>
                                ) : null}
                            </section>


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
