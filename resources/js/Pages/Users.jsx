import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { AppNav, AppPageLayout } from '@/Components/layout';
import SubAccountHeader from '@/Components/subaccount/SubAccountHeader';
import {
    buildRoleGroupsFormFromUser,
    CreateUserDrawer,
    EditUserDrawer,
    GroupUsersTable,
    USERS_BUSCA_QUERY,
    userRowToUpdatePayload,
} from '@/Components/groups';

/** Cópia nova em cada reset — evita partilha de referências em nested objects e alinha defaults do useForm após POST (Inertia atualiza defaults com os dados submetidos). */
function createEmptyCreateUserFormData() {
    return {
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        possible_roles: ['LEARNER'],
        role_groups: { LEARNER: [] },
    };
}

/** Referência estável só para o estado inicial do hook — não reinstanciar por render. */
const INITIAL_CREATE_USER_FORM = createEmptyCreateUserFormData();

const INITIAL_EDIT_USER_FORM = {
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    possible_roles: [],
    address: '—',
    is_active: true,
    role_groups: {},
};

export default function Users({
    enableyUsers = [],
    enableyError,
    enableyGroups = [],
    enableyGroupsError = null,
}) {
    const page = usePage();
    const { enabley, subContasSettings } = page.props;
    const activeSubAccount = enabley?.activeSubAccount ?? '';
    const hasDefaultUserPassword = Boolean(subContasSettings?.hasDefaultUserPassword);

    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    /** Incrementa ao abrir o drawer para remount limpo (evita estado visual residual no off-canvas). */
    const [createDrawerKey, setCreateDrawerKey] = useState(0);

    const form = useForm(INITIAL_CREATE_USER_FORM);
    const [editUser, setEditUser] = useState(null);
    const editForm = useForm(INITIAL_EDIT_USER_FORM);

    const initialSearchFromUrl = useMemo(() => {
        const qs = page.url.split('?')[1];
        if (!qs) {
            return '';
        }
        return new URLSearchParams(qs).get(USERS_BUSCA_QUERY) ?? '';
    }, [page.url]);

    const resetCreateUserForm = () => {
        const freshDefaults = createEmptyCreateUserFormData();
        const freshData = createEmptyCreateUserFormData();
        form.setDefaults(freshDefaults);
        form.setData(freshData);
        form.clearErrors();
    };

    const openCreateDrawer = () => {
        flushSync(() => {
            resetCreateUserForm();
            setCreateDrawerKey((k) => k + 1);
            setCreateDrawerOpen(true);
        });
    };

    const closeCreateDrawer = () => {
        if (form.processing) {
            return;
        }
        flushSync(() => {
            setCreateDrawerOpen(false);
            resetCreateUserForm();
        });
    };

    useEffect(() => {
        if (!createDrawerOpen) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeCreateDrawer();
            }
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [createDrawerOpen, form.processing]);

    const openEditUser = (u) => {
        const p = userRowToUpdatePayload(u);
        if (!p.possible_roles?.length) {
            window.alert(
                'Não foi possível ler as funções deste utilizador. Recarregue a página e tente de novo.',
            );
            return;
        }
        editForm.clearErrors();
        editForm.setData({ ...p, role_groups: buildRoleGroupsFormFromUser(u) });
        setEditUser(u);
    };

    const closeEditUser = () => {
        if (editForm.processing) {
            return;
        }
        setEditUser(null);
        editForm.reset();
    };

    /** Ativar ou inativar via menu (sem confirmação). */
    const patchUserStatus = (u, isActive) => {
        const id = u?.identifier;
        if (id == null || String(id).trim() === '') {
            return;
        }
        const p = userRowToUpdatePayload(u);
        if (!p.possible_roles?.length) {
            window.alert(
                'Não foi possível ler as funções deste utilizador. Recarregue a página e tente de novo.',
            );
            return;
        }
        router.patch(`/usuarios/${encodeURIComponent(String(id).trim())}`, {
            ...p,
            is_active: isActive,
            status_only: true,
        }, { preserveScroll: true });
    };

    const handleDeactivateUser = (u) => {
        patchUserStatus(u, false);
    };

    const handleActivateUser = (u) => {
        patchUserStatus(u, true);
    };

    useEffect(() => {
        if (!editUser) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape' && !editForm.processing) {
                setEditUser(null);
                editForm.reset();
            }
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [editUser, editForm.processing]);

    return (
        <>
            <Head title="Usuários" />
            <AppPageLayout>
                <AppNav />
                <main className="mx-auto flex w-full max-w-[min(1920px,calc(100vw-1.5rem))] flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <SubAccountHeader subAccountName={activeSubAccount} />
                    <div className="rounded-2xl border border-slate-200/80 bg-[#F2F2E9] p-5 shadow-sm sm:p-8">
                        {enableyError ? (
                            <pre className="mb-4 overflow-x-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                {enableyError}
                            </pre>
                        ) : null}
                        {!enableyError ? (
                            <>
                                <div className="flex flex-col gap-3 border-b-2 border-[#04385D] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-800">Usuários</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {enableyUsers.length === 0
                                                ? 'Nenhum usuário na subconta.'
                                                : `${enableyUsers.length} usuário${enableyUsers.length === 1 ? '' : 's'}`}
                                        </p>
                                        {!hasDefaultUserPassword ? (
                                            <p className="mt-2 text-sm text-amber-900">
                                                Defina a <span className="font-medium">senha padrão</span> em{' '}
                                                <span className="font-medium">Configurações </span> 
                                                para poder criar usuários.
                                            </p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openCreateDrawer}
                                        disabled={!hasDefaultUserPassword}
                                        title={
                                            hasDefaultUserPassword
                                                ? 'Criar novo usuário na Enabley'
                                                : 'Defina primeiro a senha padrão em Configurações'
                                        }
                                        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#20A39E] bg-white px-3 py-2 text-sm font-medium text-[#20A39E] shadow-sm transition hover:scale-105 hover:bg-[#20A39E] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-[#20A39E]"
                                    >
                                        <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                        Criar usuário
                                    </button>
                                </div>
                                <GroupUsersTable
                                    users={enableyUsers}
                                    resetKey={`${activeSubAccount}-${enableyUsers.length}`}
                                    variant="page"
                                    initialSearchQuery={initialSearchFromUrl}
                                    emptyListMessage="Nenhum usuário na subconta."
                                    showUserMaintenanceActions
                                    onEditUser={openEditUser}
                                    onDeactivateUser={handleDeactivateUser}
                                    onActivateUser={handleActivateUser}
                                />
                            </>
                        ) : null}
                    </div>
                </main>
            </AppPageLayout>

            <CreateUserDrawer
                key={createDrawerKey}
                open={createDrawerOpen}
                onClose={closeCreateDrawer}
                form={form}
                groups={enableyGroups}
                groupsError={enableyGroupsError}
                postOptions={{
                    onSuccess: () => {
                        flushSync(() => {
                            setCreateDrawerOpen(false);
                            resetCreateUserForm();
                        });
                    },
                }}
            />

            <EditUserDrawer
                open={editUser != null}
                user={editUser}
                form={editForm}
                onClose={closeEditUser}
                groups={enableyGroups}
                groupsError={enableyGroupsError}
            />
        </>
    );
}
