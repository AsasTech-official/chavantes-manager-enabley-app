import { useEffect, useMemo, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

/**
 * Modal de configuração — gestão de subcontas Enabley na aplicação.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {{ id: number; name: string }[]} props.items
 * @param {string} props.activeSubAccount
 * @param {string} props.envSubAccount
 * @param {boolean} props.hasDefaultUserPassword
 * @param {string|null} props.defaultUserPassword
 */
export default function ConfigurationModal({
    open,
    onClose,
    items,
    activeSubAccount,
    envSubAccount,
    hasDefaultUserPassword = false,
    defaultUserPassword = null,
}) {
    const list = Array.isArray(items) ? items : [];
    const [editingId, setEditingId] = useState(null);
    const [subAccountSwitching, setSubAccountSwitching] = useState(false);

    const selectableSubAccountNames = useMemo(() => {
        const set = new Set(list.map((r) => String(r.name ?? '').trim()).filter(Boolean));
        const env = String(envSubAccount ?? '').trim();
        if (env !== '') {
            set.add(env);
        }
        const active = String(activeSubAccount ?? '').trim();
        if (active !== '') {
            set.add(active);
        }
        return [...set].sort((a, b) => a.localeCompare(b));
    }, [list, envSubAccount, activeSubAccount]);

    const createForm = useForm({ name: '' });
    const editForm = useForm({ name: '' });
    const passwordForm = useForm({
        default_user_password: '',
    });

    useEffect(() => {
        if (!open) {
            setEditingId(null);
            editForm.reset();
            createForm.reset();
            createForm.clearErrors();
            editForm.clearErrors();
            passwordForm.reset();
            passwordForm.clearErrors();
        }
    }, [open]);

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
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    const startEdit = (row) => {
        setEditingId(row.id);
        editForm.setData('name', row.name);
        editForm.clearErrors();
    };

    const cancelEdit = () => {
        setEditingId(null);
        editForm.reset();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/configuracoes/subcontas/${editingId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingId(null);
                editForm.reset();
            },
        });
    };

    const destroy = (id) => {
        if (!window.confirm('Remover esta subconta da aplicação?')) {
            return;
        }
        router.delete(`/configuracoes/subcontas/${id}`, { preserveScroll: true });
    };

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
                    className="pointer-events-auto flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden"
                >
                    <div className="flex max-h-[min(90vh,720px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#04385D] bg-[#F2F2E9] shadow-2xl">
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
                        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
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
                            <hr className="my-6 border-0 border-t border-slate-200" />
                            <h3 className="mb-3 text-sm font-semibold text-slate-800">Subcontas</h3>
                            <p className="mb-2 text-sm text-slate-600">
                                Subconta ativa agora:{' '}
                                <span className="font-mono font-medium text-slate-800">
                                    {activeSubAccount || '—'}
                                </span>
                            </p>
                            {selectableSubAccountNames.length > 0 ? (
                                <div className="mb-4 space-y-2">
                                    <label
                                        htmlFor="configuration-active-subaccount"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Mudar subconta ativa
                                    </label>
                                    <select
                                        id="configuration-active-subaccount"
                                        value={activeSubAccount}
                                        disabled={subAccountSwitching}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            if (!name || name === activeSubAccount) {
                                                return;
                                            }
                                            setSubAccountSwitching(true);
                                            router.post(
                                                '/configuracoes/subconta-ativa',
                                                { name },
                                                {
                                                    preserveScroll: true,
                                                    onFinish: () => setSubAccountSwitching(false),
                                                    onSuccess: () => {
                                                        router.reload({ preserveScroll: true });
                                                    },
                                                },
                                            );
                                        }}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-900 shadow-sm focus:border-[#3757A1] focus:outline-none focus:ring-2 focus:ring-[#3757A1]/25 disabled:opacity-60"
                                    >
                                        {activeSubAccount === '' ? (
                                            <option value="" disabled>
                                                — Escolha uma subconta —
                                            </option>
                                        ) : null}
                                        {selectableSubAccountNames.map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    {envSubAccount ? (
                                        <button
                                            type="button"
                                            disabled={subAccountSwitching}
                                            onClick={() => {
                                                setSubAccountSwitching(true);
                                                router.delete('/configuracoes/subconta-ativa', {
                                                    preserveScroll: true,
                                                    onFinish: () => setSubAccountSwitching(false),
                                                    onSuccess: () => {
                                                        router.reload({ preserveScroll: true });
                                                    },
                                                });
                                            }}
                                            className="text-left text-sm font-medium text-[#3757A1] underline decoration-[#3757A1]/40 underline-offset-2 hover:text-[#2d4680] disabled:opacity-50"
                                        >
                                            Repor para o valor padrão ({envSubAccount})
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}

                            <h4 className="mb-2 text-sm font-medium text-slate-700">Nova subconta</h4>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    createForm.post('/configuracoes/subcontas', {
                                        preserveScroll: true,
                                        onSuccess: () => createForm.reset('name'),
                                    });
                                }}
                                className="mb-6 flex flex-wrap items-end gap-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <label htmlFor="configuration-modal-new-subaccount" className="sr-only">
                                        Nome
                                    </label>
                                    <input
                                        id="configuration-modal-new-subaccount"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#3757A1] focus:outline-none focus:ring-2 focus:ring-[#3757A1]/25"
                                        placeholder="identificador (ex.: demonstracao)"
                                        autoComplete="off"
                                    />
                                    {createForm.errors.name ? (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.name}</p>
                                    ) : null}
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="shrink-0 rounded-lg bg-[#3757A1] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 disabled:opacity-50"
                                >
                                    {createForm.processing ? 'Guardando…' : 'Criar'}
                                </button>
                            </form>

                            <h4 className="mb-2 text-sm font-medium text-slate-700">Registadas</h4>
                            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white/80">
                                <table className="w-full min-w-[280px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500">
                                            <th className="px-3 py-2">Nome</th>
                                            <th className="w-0 whitespace-nowrap px-3 py-2 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {list.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-3 py-4 text-slate-500">
                                                    Nenhuma subconta na base de dados. Crie uma acima (pode corresponder à
                                                    do .env).
                                                </td>
                                            </tr>
                                        ) : null}
                                        {list.map((row) => (
                                            <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                                <td className="px-3 py-2 align-middle">
                                                    {editingId === row.id ? (
                                                        <form onSubmit={submitEdit} className="w-full min-w-0 max-w-md space-y-1">
                                                            <div className="flex flex-wrap gap-2">
                                                                <input
                                                                    value={editForm.data.name}
                                                                    onChange={(e) =>
                                                                        editForm.setData('name', e.target.value)
                                                                    }
                                                                    className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-slate-900"
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={editForm.processing}
                                                                    className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                                                                >
                                                                    Guardar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEdit}
                                                                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                            {editForm.errors.name ? (
                                                                <p className="text-xs text-red-600">{editForm.errors.name}</p>
                                                            ) : null}
                                                        </form>
                                                    ) : (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-mono text-slate-800">{row.name}</span>
                                                            {row.name === envSubAccount ? (
                                                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                                                                    padrão
                                                                </span>
                                                            ) : null}
                                                            {row.name === activeSubAccount ? (
                                                                <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-xs text-cyan-900">
                                                                    ativa
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right align-middle">
                                                    {editingId !== row.id ? (
                                                        <div className="flex justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => startEdit(row)}
                                                                className="text-xs font-medium text-[#3757A1] hover:underline"
                                                            >
                                                                Editar
                                                            </button>
                                                            <span className="text-slate-300">|</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => destroy(row.id)}
                                                                className="text-xs font-medium text-rose-600 hover:underline"
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
