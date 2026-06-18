import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import AnimatedDialogBackdrop from '@/Components/ui/AnimatedDialogBackdrop';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

/** Valores UserData.possibleRoles (API v2 Enabley) + rótulos em português */
export const ENABLEY_CREATE_USER_ROLE_OPTIONS = [
    { value: 'LEARNER', label: 'Aluno' },
    { value: 'INSTRUCTOR', label: 'Instrutor' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'MANAGER', label: 'Gerente' },
    { value: 'PREVIEW', label: 'Pré-visualização' },
    { value: 'HR_MANAGER', label: 'Gestor de RH' },
    { value: 'SITE_TRAINING_MANAGER', label: 'Gestor de formação (site)' },
    { value: 'EVALUATOR', label: 'Avaliador' },
];

/** Títulos das secções de grupos por função (mesma ordem que ENABLEY_CREATE_USER_ROLE_OPTIONS). */
const GROUP_ROLE_SECTION_TITLES = {
    LEARNER: 'Grupos como aluno',
    INSTRUCTOR: 'Grupos como instrutor',
    EDITOR: 'Grupos como editor',
    MANAGER: 'Grupos como gerente',
    PREVIEW: 'Grupos — pré-visualização',
    HR_MANAGER: 'Grupos como gestor de RH',
    SITE_TRAINING_MANAGER: 'Grupos como gestor de formação (site)',
    EVALUATOR: 'Grupos como avaliador',
};

/** Criação de utilizador: apenas aluno (LEARNER); grupos são associação como membro. */
const GROUP_ROLE_SECTIONS = [{ role: 'LEARNER', title: GROUP_ROLE_SECTION_TITLES.LEARNER }];

const sectionTitleClass =
    'mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#04385D]/75';
const panelClass = 'rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-sm shadow-slate-900/5';
const fieldLabelClass = 'block text-xs font-medium text-slate-600';
const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#20A39E] focus:outline-none focus:ring-2 focus:ring-[#20A39E]/20';

export default function CreateUserDrawer({
    open,
    onClose,
    form,
    groups = [],
    groupsError = null,
    postUrl = '/usuarios',
    postOptions = {},
}) {
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

    if (!open) {
        return null;
    }

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            possible_roles: ['LEARNER'],
            role_groups: {
                LEARNER: Array.isArray(data.role_groups?.LEARNER) ? data.role_groups.LEARNER : [],
            },
        }));
        form.post(postUrl, {
            preserveScroll: true,
            ...postOptions,
        });
    };

    const selectedRoles = ['LEARNER'];
    const roleGroups = form.data.role_groups ?? {};

    const toggleGroupForRole = (role, groupIdRaw, checked) => {
        const groupId =
            typeof groupIdRaw === 'string' ? groupIdRaw : groupIdRaw != null ? String(groupIdRaw) : '';
        if (groupId === '') {
            return;
        }

        /** Atualização funcional: evita perder grupo(s) já escolhidos quando há várias marcas rápidas (race com `roleGroups` stale). */
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
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="create-user-title">
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
                <aside className="flex h-full min-h-0 w-full flex-col border-l border-[#04385D]/80 bg-[#F2F2E9] shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#04385D] px-6 py-4">
                        <div>
                            <h2 id="create-user-title" className="text-lg font-semibold tracking-tight text-[#F2F2E9]">
                                Novo usuário
                            </h2>
                            <p className="mt-0.5 text-xs text-[#F2F2E9]/65">
                                Novos utilizadores são criados apenas como aluno na Plataforma Enabley.
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
                                            <label htmlFor="new-user-first-name" className={fieldLabelClass}>
                                                Nome
                                            </label>
                                            <input
                                                id="new-user-first-name"
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
                                            <label htmlFor="new-user-last-name" className={fieldLabelClass}>
                                                Sobrenome
                                            </label>
                                            <input
                                                id="new-user-last-name"
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
                                            <label htmlFor="new-user-username" className={fieldLabelClass}>
                                                Username
                                            </label>
                                            <input
                                                id="new-user-username"
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
                                            <label htmlFor="new-user-email" className={fieldLabelClass}>
                                                E-mail{' '}
                                                <span className="font-normal text-slate-400">(opcional)</span>
                                            </label>
                                            <input
                                                id="new-user-email"
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
                                    <p className="mt-3 rounded-lg border border-[#04385D]/10 bg-[#04385D]/[0.06] px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                                        A palavra-passe na Plataforma é a{' '}
                                        <span className="font-medium text-slate-800">senha padrão</span> definida em{' '}
                                        <span className="font-medium text-slate-800">Configurações</span>.
                                    </p>
                                </section>

                                <section>
                                    <h3 className={sectionTitleClass}>Função na plataforma</h3>
                                    <div className={`${panelClass} px-3 py-2.5`}>
                                        <p className="text-sm font-medium text-slate-800">Aluno</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Apenas contas de aluno podem ser criadas por este formulário.
                                        </p>
                                    </div>
                                    {form.errors.possible_roles ? (
                                        <p className="mt-2 text-xs text-red-700">{form.errors.possible_roles}</p>
                                    ) : null}
                                </section>

                                <section className="space-y-3">
                                    <h3 className={sectionTitleClass}>Grupos do aluno</h3>
                                    <p className="text-xs leading-relaxed text-slate-500">
                                        Pesquise para filtrar a lista. Expanda a secção quando precisar de escolher grupos.
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
                                                htmlFor="create-user-group-search"
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
                                                    id="create-user-group-search"
                                                    type="search"
                                                    value={groupSearchQuery}
                                                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                                                    placeholder="Nome ou identificador…"
                                                    autoComplete="off"
                                                    disabled={form.processing}
                                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#20A39E] focus:outline-none focus:ring-2 focus:ring-[#20A39E]/20"
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
                                        {GROUP_ROLE_SECTIONS.map(({ role, title }) => {
                                            if (!selectedRoles.includes(role)) {
                                                return null;
                                            }
                                            const rgErr = form.errors[`role_groups.${role}`];
                                            const picked = (roleGroups[role] ?? []).length;
                                            const pickedLabel =
                                                picked === 0
                                                    ? 'Nenhum grupo'
                                                    : picked === 1
                                                      ? '1 grupo'
                                                      : `${picked} grupos`;
                                            return (
                                                <details
                                                    key={role}
                                                    className="group/details rounded-xl border border-slate-200/90 bg-white/95 shadow-sm shadow-slate-900/5 open:border-[#04385D]/25 open:shadow-md"
                                                >
                                                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-left [&::-webkit-details-marker]:hidden">
                                                        <span
                                                            className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#20A39E]"
                                                            aria-hidden
                                                        />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-semibold text-slate-800">
                                                                {title}
                                                            </span>
                                                            <span className="mt-0.5 block text-xs text-slate-500">
                                                                {pickedLabel}
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
                                                                    const checked = (roleGroups[role] ?? []).includes(
                                                                        gid,
                                                                    );
                                                                    const typeLine = g.type ? (
                                                                        <span className="text-slate-500">
                                                                            {' '}
                                                                            · {g.type}
                                                                        </span>
                                                                    ) : null;
                                                                    return (
                                                                        <li key={`${role}-${gid}`}>
                                                                            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-800 transition hover:bg-white">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#20A39E] focus:ring-[#20A39E]/35"
                                                                                    checked={checked}
                                                                                    disabled={form.processing}
                                                                                    onChange={(e) =>
                                                                                        toggleGroupForRole(
                                                                                            role,
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
                                                        {rgErr ? (
                                                            <p className="mt-2 px-1 text-xs text-red-700">{rgErr}</p>
                                                        ) : null}
                                                    </div>
                                                </details>
                                            );
                                        })}
                                    </div>
                                </section>
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
                                {form.processing ? 'A criar…' : 'Criar usuário'}
                            </button>
                        </div>
                    </form>
                </aside>
            </AnimatedContent>
        </div>
    );
}
