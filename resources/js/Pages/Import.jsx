import { Head, useForm, usePage } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/layout';
import SubAccountHeader from '@/Components/subaccount/SubAccountHeader';

/** Navegação completa: evita resposta binária ser tratada como visita Inertia e ignora conflitos do atributo `download` com Content-Disposition. */
function startModelDownload(path) {
    window.location.assign(path);
}

function ImportResultTable({ title, payload }) {
    if (!payload?.rows?.length) {
        return null;
    }
    return (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/90 bg-white">
            <p className="border-b border-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">{title}</p>
            <div className="max-h-64 overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                        <tr>
                            <th className="px-3 py-2 font-semibold text-slate-600">Linha</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Estado</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Detalhe</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payload.rows.map((row, idx) => (
                            <tr key={`${row.line}-${row.status}-${idx}`} className={row.status === 'error' ? 'bg-red-50/60' : ''}>
                                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-slate-700">{row.line}</td>
                                <td className="whitespace-nowrap px-3 py-1.5">
                                    {row.status === 'ok' ? (
                                        <span className="text-emerald-700">OK</span>
                                    ) : (
                                        <span className="text-red-700">Erro</span>
                                    )}
                                </td>
                                <td className="px-3 py-1.5 text-slate-800">
                                    {row.status === 'ok' ? (
                                        <span className="font-mono text-[0.7rem] leading-snug">
                                            {row.identifier ? `${row.identifier}` : ''}
                                            {row.name ? ` · ${row.name}` : ''}
                                            {row.username ? ` · @${row.username}` : ''}
                                        </span>
                                    ) : (
                                        <span className="leading-snug text-red-900">{row.message}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Kbd({ children }) {
    return (
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.7rem] text-slate-800">{children}</code>
    );
}

export default function Import({ enableyGroupTypes = [] }) {
    const page = usePage();
    const { enabley, subContasSettings, flash } = page.props;
    const activeSubAccount = enabley?.activeSubAccount ?? '';
    const hasDefaultUserPassword = Boolean(subContasSettings?.hasDefaultUserPassword);

    const groupsForm = useForm({ file: null });
    const usersForm = useForm({ file: null });

    const importGroupsResult = flash?.import_groups ?? null;
    const importUsersResult = flash?.import_users ?? null;

    return (
        <>
            <Head title="Importação" />
            <AppPageLayout>
                <AppNav />
                <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <SubAccountHeader subAccountName={activeSubAccount} />
                    <div className="rounded-2xl border border-slate-200/80 bg-[#F2F2E9] p-5 shadow-sm sm:p-8">
                        <div className="mb-6 border-b-2 border-[#04385D] pb-3">
                            <h1 className="text-lg font-semibold text-slate-900">Importação</h1>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Utilize um ficheiro <strong>Excel (.xlsx)</strong> conforme as{' '}
                                <a
                                    href="#regras-importacao-titulo"
                                    className="cursor-pointer font-medium text-[#0d7c78] underline decoration-[#0d7c78]/35 underline-offset-2 hover:no-underline"
                                >
                                    regras abaixo
                                </a>
                            </p>
                            {Array.isArray(enableyGroupTypes) && enableyGroupTypes.length > 0 ? (
                                <p className="mt-2 text-xs text-slate-600">
                                    Tipos válidos na hierarquia atual:{' '}
                                    <span className="font-mono text-[0.65rem] text-slate-800">
                                        {enableyGroupTypes.join(', ')}
                                    </span>
                                </p>
                            ) : null}
                        </div>

                        <section
                            className="mb-6 rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm"
                            aria-labelledby="regras-importacao-titulo"
                        >
                            <h2 id="regras-importacao-titulo" className="text-base font-semibold text-slate-800">
                                Regras do ficheiro (.xlsx)
                            </h2>
                            <div className="mt-4 space-y-5 text-sm leading-relaxed text-slate-600">
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Geral</h3>
                                    <ul className="mt-2 list-disc space-y-1.5 pl-5">
                                        <li>
                                            Formato <strong>só .xlsx</strong>, até <strong>500 linhas de dados</strong> e{' '}
                                            <strong>10&nbsp;MB</strong> (o cabeçalho não conta para o limite de linhas).
                                        </li>
                                        <li>
                                            Só é lida a <strong>primeira folha</strong>. O <strong>cabeçalho</strong> (nomes de
                                            coluna <strong>fixos</strong>, como no modelo) deve estar na <strong>linha 1</strong>.
                                        </li>
                                        <li>
                                            Linhas em branco no meio da folha são <strong>ignoradas</strong>, mas o número da
                                            linha no relatório de erros corresponde ao Excel (útil para localizar células).
                                        </li>
                                        <li>
                                            Importação de <strong>usuários</strong> cria sempre perfil{' '}
                                            <strong>ALUNO</strong>, com a <strong>senha padrão</strong> das configurações.
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grupos</h3>
                                    <p className="mt-2">
                                        O valor de <Kbd>type</Kbd> tem de ser um dos tipos da hierarquia Enabley da subconta
                                        (lista acima).
                                    </p>
                                    <ul className="mt-2 list-disc space-y-1.5 pl-5">
                                        <li>
                                            <strong>Obrigatório:</strong> <Kbd>name</Kbd> e <Kbd>type</Kbd>.
                                        </li>
                                        <li>
                                            <strong>Opcional:</strong> <Kbd>parent_identifier</Kbd> — UUID de um grupo que{' '}
                                            <strong>já exista</strong> na subconta.
                                        </li>
                                        <li>
                                            <strong>Opcional:</strong> <Kbd>ref</Kbd> — etiqueta <strong>tua</strong> nessa linha;
                                            não repetir no mesmo ficheiro.
                                        </li>
                                        <li>
                                            <strong>Opcional:</strong> <Kbd>parent_ref</Kbd> — deve coincidir com o <Kbd>ref</Kbd>{' '}
                                            de uma <strong>linha anterior</strong> no mesmo ficheiro.
                                        </li>
                                        <li>
                                            <strong>Não</strong> preencha <Kbd>parent_ref</Kbd> e <Kbd>parent_identifier</Kbd> na
                                            mesma linha.
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuários</h3>
                                    <ul className="mt-2 list-disc space-y-1.5 pl-5">
                                        <li>
                                            <strong>Obrigatório:</strong> <Kbd>first_name</Kbd>, <Kbd>last_name</Kbd> e{' '}
                                            <Kbd>username</Kbd>.
                                        </li>
                                        <li>
                                            <strong>Opcional:</strong> <Kbd>email</Kbd> — válido, se preenchido.
                                        </li>
                                        <li>
                                            <strong>Opcional:</strong> <Kbd>learner_groups</Kbd> — um ou vários UUIDs de grupos da
                                            subconta, separados por <strong>vírgula</strong> ou <strong>ponto e vírgula</strong>.
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-800">Grupos</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Colunas e regras estão descritas na secção <strong>Regras do ficheiro</strong>. O modelo
                                inclui exemplo com <Kbd>ref</Kbd> e <Kbd>parent_ref</Kbd>.
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => startModelDownload('/importacao/modelo/grupos')}
                                    className="cursor-pointer font-medium text-[#0d7c78] underline decoration-[#0d7c78]/35 underline-offset-2 hover:no-underline"
                                >
                                    Descarregar modelo Excel (.xlsx)
                                </button>
                            </p>

                            <form
                                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    groupsForm.post('/importacao/grupos', {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => groupsForm.reset(),
                                    });
                                }}
                            >
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600" htmlFor="file-grupos">
                                        Ficheiro
                                    </label>
                                    <input
                                        id="file-grupos"
                                        type="file"
                                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        className="mt-1 block w-full cursor-pointer text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#04385D]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#04385D]"
                                        onChange={(e) => groupsForm.setData('file', e.target.files?.[0] ?? null)}
                                    />
                                    {groupsForm.errors.file ? (
                                        <p className="mt-1 text-xs text-red-600">{groupsForm.errors.file}</p>
                                    ) : null}
                                </div>
                                <button
                                    type="submit"
                                    disabled={groupsForm.processing || !groupsForm.data.file}
                                    className="cursor-pointer rounded-lg bg-[#EF6F6C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {groupsForm.processing ? 'A importar…' : 'Importar grupos'}
                                </button>
                            </form>

                            {importGroupsResult ? (
                                <ImportResultTable
                                    title={`Resultado · ${importGroupsResult.ok ?? 0} OK · ${importGroupsResult.failed ?? 0} falhas`}
                                    payload={importGroupsResult}
                                />
                            ) : null}
                        </section>

                        <section className="mt-8 rounded-xl border border-slate-200/90 bg-white/90 p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-slate-800">Usuários</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Colunas e regras estão na secção <strong>Regras do ficheiro</strong>. É necessária{' '}
                                <strong>senha padrão</strong> nas configurações.
                            </p>
                            {!hasDefaultUserPassword ? (
                                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                                    Defina a senha padrão nas Configurações antes de importar usuários.
                                </p>
                            ) : null}
                            <p className="mt-2 text-sm text-slate-600">
                                <button
                                    type="button"
                                    onClick={() => startModelDownload('/importacao/modelo/usuarios')}
                                    className="cursor-pointer font-medium text-[#0d7c78] underline decoration-[#0d7c78]/35 underline-offset-2 hover:no-underline"
                                >
                                    Descarregar modelo Excel (.xlsx)
                                </button>
                            </p>

                            <form
                                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    usersForm.post('/importacao/usuarios', {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        onSuccess: () => usersForm.reset(),
                                    });
                                }}
                            >
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-600" htmlFor="file-usuarios">
                                        Ficheiro
                                    </label>
                                    <input
                                        id="file-usuarios"
                                        type="file"
                                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        className="mt-1 block w-full cursor-pointer text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#04385D]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#04385D]"
                                        onChange={(e) => usersForm.setData('file', e.target.files?.[0] ?? null)}
                                    />
                                    {usersForm.errors.file ? (
                                        <p className="mt-1 text-xs text-red-600">{usersForm.errors.file}</p>
                                    ) : null}
                                </div>
                                <button
                                    type="submit"
                                    disabled={
                                        usersForm.processing || !usersForm.data.file || !hasDefaultUserPassword
                                    }
                                    className="cursor-pointer rounded-lg bg-[#EF6F6C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {usersForm.processing ? 'Importando…' : 'Importar usuários'}
                                </button>
                            </form>

                            {importUsersResult ? (
                                <ImportResultTable
                                    title={`Resultado · ${importUsersResult.ok ?? 0} OK · ${importUsersResult.failed ?? 0} falhas`}
                                    payload={importUsersResult}
                                />
                            ) : null}
                        </section>
                    </div>
                </main>
            </AppPageLayout>
        </>
    );
}
