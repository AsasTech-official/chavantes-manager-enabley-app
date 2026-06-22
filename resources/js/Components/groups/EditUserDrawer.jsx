import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

const sectionTitleClass =
    'mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04385D]/75';
const panelClass = 'rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-sm shadow-slate-900/5';
const fieldLabelClass = 'block text-xs font-medium text-slate-600';
const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#1F3860] focus:outline-none focus:ring-2 focus:ring-[#1F3860]/20';
const LEARNER_ROLE = 'LEARNER';

/**
 * Edição de utilizador existente na Enabley (PATCH /usuarios/{id}).
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object|null} props.user — linha da tabela (firstName, identifier, …)
 * @param {import('@inertiajs/react').InertiaFormProps} props.form
 * @param {Array<{ identifier: string, name: string, type?: string|null }>} [props.groups]
 * @param {string|null} [props.groupsError]
 */
export default function EditUserDrawer({ open, onClose, user, form, groups = [], groupsError = null }) {
    const [groupSearchQuery, setGroupSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            setGroupSearchQuery('');
        }
    }, [open]);

    const filteredGroups = useMemo(() => {
        const q = groupSearchQuery.trim().toLowerCase();
        if (!q) {
            return groups;
        }
        return groups.filter((g) => {
            const name = String(g.name ?? '').toLowerCase();
            const id = String(g.identifier ?? '').toLowerCase();
            return name.includes(q) || id.includes(q);
        });
    }, [groups, groupSearchQuery]);

    const showLearnerGroups = (form.data.possible_roles ?? []).includes('LEARNER');

    if (!open || !user) {
        return null;
    }

    const identifier = user.identifier != null ? String(user.identifier).trim() : '';
    if (identifier === '') {
        return null;
    }

    const submit = (e) => {
        e.preventDefault();
        form.patch(`/usuarios/${encodeURIComponent(identifier)}`, {
            preserveScroll: true,
            onSuccess: () => {
                onClose();
            },
        });
    };

    const roleGroups = form.data.role_groups ?? {};
    const learnerRgErr = form.errors[`role_groups.${LEARNER_ROLE}`];
    const learnerPicked = (roleGroups[LEARNER_ROLE] ?? []).length;
    const learnerPickedLabel =
        learnerPicked === 0
            ? 'Nenhum grupo'
            : learnerPicked === 1
              ? '1 grupo'
              : `${learnerPicked} grupos`;

    const toggleGroupForRole = (role, groupIdRaw, checked) => {
        const groupId =
            typeof groupIdRaw === 'string' ? groupIdRaw : groupIdRaw != null ? String(groupIdRaw) : '';
        if (groupId === '') {
            return;
        }

        form.setData((d) => {
            const rg = { ...(d.role_groups ?? {}) };
            const list = [...(rg[role] ?? [])];
            if (checked) {
                if (!list.includes(groupId)) {
                    list.push(groupId);
                }
            } else {
                const i = list.indexOf(groupId);
                if (i !== -1) {
                    list.splice(i, 1);
                }
            }
            rg[role] = list;
            return { ...d, role_groups: rg };
        });
    };

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <AnimatedDialogBackdrop
                onClose={onClose}
                ariaLabel="Fechar painel"
                closeDisabled={form.processing}
            />
            <AnimatedContent
                {...DIALOG_MOTION}
                direction="horizontal"
                className="absolute right-0 top-0 z-10 h-full w-full max-w-xl"
            >
                <aside className="flex h-full min-h-0 w-full flex-col border-l border-[#04385D]/80 bg-[#ffffff] shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#04385D] px-6 py-4">
                        <div>
                            <h2 id="edit-user-title" className="text-lg font-semibold tracking-tight text-[#F2F2E9]">
                                Editar usuário
                            </h2>
                            <p className="mt-0.5 max-w-md break-all font-mono text-[11px] text-[#F2F2E9]/70">
                                {identifier}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#F2F2E9] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2F2E9]"
                            aria-label="Fechar"
                        >
                            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                        </button>
                    </div>
                    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                            <div className="space-y-8">
                                <section>
                                    <h3 className={sectionTitleClass}>Identificação</h3>
                                    <div className={`${panelClass} space-y-4`}>
                                        <div>
                                            <label htmlFor="edit-user-first-name" className={fieldLabelClass}>
                                                Nome
                                            </label>
                                            <input
                                                id="edit-user-first-name"
                                                type="text"
                                                value={form.data.first_name}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'first_name',
                                                        e.target.value.toLocaleUpperCase('pt-PT'),
                                                    )
                                                }
                                                className={`${inputClass} uppercase tracking-wide`}
                                                autoComplete="given-name"
                                                required
                                                disabled={form.processing}
                                            />
                                            {form.errors.first_name ? (
                                                <p className="mt-1 text-xs text-red-700">{form.errors.first_name}</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label htmlFor="edit-user-last-name" className={fieldLabelClass}>
                                                Sobrenome
                                            </label>
                                            <input
                                                id="edit-user-last-name"
                                                type="text"
                                                value={form.data.last_name}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'last_name',
                                                        e.target.value.toLocaleUpperCase('pt-PT'),
                                                    )
                                                }
                                                className={`${inputClass} uppercase tracking-wide`}
                                                autoComplete="family-name"
                                                required
                                                disabled={form.processing}
                                            />
                                            {form.errors.last_name ? (
                                                <p className="mt-1 text-xs text-red-700">{form.errors.last_name}</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label htmlFor="edit-user-username" className={fieldLabelClass}>
                                                Username
                                            </label>
                                            <input
                                                id="edit-user-username"
                                                type="text"
                                                value={form.data.username}
                                                onChange={(e) => form.setData('username', e.target.value)}
                                                className={inputClass}
                                                autoComplete="username"
                                                required
                                                disabled={form.processing}
                                            />
                                            {form.errors.username ? (
                                                <p className="mt-1 text-xs text-red-700">{form.errors.username}</p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <label htmlFor="edit-user-email" className={fieldLabelClass}>
                                                E-mail{' '}
                                                <span className="font-normal text-slate-400">(opcional)</span>
                                            </label>
                                            <input
                                                id="edit-user-email"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(e) => form.setData('email', e.target.value)}
                                                className={inputClass}
                                                autoComplete="email"
                                                disabled={form.processing}
                                            />
                                            {form.errors.email ? (
                                                <p className="mt-1 text-xs text-red-700">{form.errors.email}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </section>

                                {showLearnerGroups ? (
                                    <section className="space-y-3">
                                        <h3 className={sectionTitleClass}>Grupos como aluno</h3>
                                        <p className="text-xs leading-relaxed text-slate-500">
                                            Apenas a associação como aluno pode ser alterada aqui. Outros papéis nos
                                            grupos (ex.: instrutor) não são editados neste formulário.
                                        </p>
                                        {groupsError ? (
                                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                                                {groupsError}
                                            </p>
                                        ) : null}
                                        {!groupsError && groups.length === 0 ? (
                                            <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                                                Nenhum grupo disponível nesta subconta.
                                            </p>
                                        ) : null}
                                        {!groupsError && groups.length > 0 ? (
                                            <div className={panelClass}>
                                                <label
                                                    htmlFor="edit-user-group-search"
                                                    className={fieldLabelClass}
                                                >
                                                    Pesquisar grupos
                                                </label>
                                                <div className="relative mt-1.5">
                                                    <Search
                                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                                        strokeWidth={2}
                                                        aria-hidden
                                                    />
                                                    <input
                                                        id="edit-user-group-search"
                                                        type="search"
                                                        value={groupSearchQuery}
                                                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                        placeholder="Nome ou identificador…"
                                                        autoComplete="off"
                                                        disabled={form.processing}
                                                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#1F3860] focus:outline-none focus:ring-2 focus:ring-[#1F3860]/20"
                                                    />
                                                </div>
                                                <p className="mt-1.5 text-xs text-slate-500">
                                                    Filtra pela denominação ou pelo UUID do grupo.
                                                </p>
                                                {filteredGroups.length === 0 ? (
                                                    <p className="mt-2 text-xs text-slate-600">
                                                        Nenhum grupo corresponde à pesquisa.
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        <div className="space-y-2">
                                            <details
                                                className="group/details rounded-xl border border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 open:border-[#04385D]/25 open:shadow-md"
                                            >
                                                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
                                                    <span
                                                        className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#1F3860]"
                                                        aria-hidden
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-slate-800">
                                                            Grupos em que é aluno
                                                        </span>
                                                        <span className="mt-0.5 block text-xs text-slate-500">
                                                            {learnerPickedLabel}
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        strokeWidth={2}
                                                        className="h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 group-open/details:rotate-180"
                                                        aria-hidden
                                                    />
                                                </summary>
                                                <div className="border-t border-slate-100 px-3 pb-3 pt-1">
                                                    {!groupsError &&
                                                    groups.length > 0 &&
                                                    filteredGroups.length > 0 ? (
                                                        <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg bg-slate-50/90 px-1 py-2">
                                                            {filteredGroups.map((g) => {
                                                                const gid = g.identifier;
                                                                const checked = (roleGroups[LEARNER_ROLE] ?? []).includes(
                                                                    gid,
                                                                );
                                                                const typeLine = g.type ? (
                                                                    <span className="text-slate-500">
                                                                        {' '}
                                                                        · {g.type}
                                                                    </span>
                                                                ) : null;
                                                                return (
                                                                    <li key={`${LEARNER_ROLE}-${gid}`}>
                                                                        <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 transition hover:bg-white">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1F3860] focus:ring-[#1F3860]/35"
                                                                                checked={checked}
                                                                                disabled={form.processing}
                                                                                onChange={(e) =>
                                                                                    toggleGroupForRole(
                                                                                        LEARNER_ROLE,
                                                                                        gid,
                                                                                        e.target.checked,
                                                                                    )
                                                                                }
                                                                            />
                                                                            <span className="min-w-0 flex-1">
                                                                                <span className="font-medium text-slate-800">
                                                                                    {g.name}
                                                                                </span>
                                                                                {typeLine}
                                                                                {g.parentIdentifier ? (
                                                                                    <span className="ml-1 text-slate-500">
                                                                                        · Pai: {groups.find(pg => pg.identifier === g.parentIdentifier)?.name ?? g.parentIdentifier}
                                                                                    </span>
                                                                                ) : null}
                                                                                <span className="mt-1 block font-mono text-[11px] leading-snug text-slate-500 break-all">
                                                                                    {gid}
                                                                                </span>
                                                                            </span>
                                                                        </label>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    ) : (
                                                        <p className="px-2 py-3 text-xs text-slate-500">
                                                            Sem grupos para mostrar com os filtros atuais.
                                                        </p>
                                                    )}
                                                    {learnerRgErr ? (
                                                        <p className="mt-2 px-1 text-xs text-red-700">{learnerRgErr}</p>
                                                    ) : null}
                                                </div>
                                            </details>
                                        </div>
                                        {form.errors.role_groups ? (
                                            <p className="text-xs text-red-700">{form.errors.role_groups}</p>
                                        ) : null}
                                    </section>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-3 border-t border-slate-200/90 bg-[#F2F2E9]/95 px-6 py-4 backdrop-blur-sm">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                                disabled={form.processing}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 cursor-pointer rounded-xl bg-[#04385D] px-4 py-3 text-sm font-semibold text-[#F2F2E9] shadow-md transition hover:bg-[#205E8A] disabled:opacity-60"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Guardando…' : 'Guardar alterações'}
                            </button>
                        </div>
                    </form>
                </aside>
            </AnimatedContent>
        </div>
    );
}
