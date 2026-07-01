import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/Layout';
import { Plus } from 'lucide-react';
import SystemUserFormModal from '@/Components/SystemUsers/SystemUserFormModal';
import SystemUserDeleteModal from '@/Components/SystemUsers/SystemUserDeleteModal';
import SystemUsersTable from '@/Components/SystemUsers/SystemUsersTable';

export default function SystemUsersIndex({ auth, systemUsers: initialSystemUsers, hasDefaultUserPassword }) {
    const [systemUsers, setSystemUsers] = useState(initialSystemUsers || []);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        setSystemUsers(initialSystemUsers);
    }, [initialSystemUsers]);

    const openCreateModal = () => {
        setEditingUser(null);
        setCreateModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setCreateModalOpen(true);
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setDeleteModalOpen(true);
    };

    const handleDeleteSuccess = (user) => {
        setSystemUsers(systemUsers.filter(u => u.id !== user.id));
    };

    return (
        <>
            <Head title="Gerenciamento de Usuários do Sistema" />
            <AppPageLayout>
                <AppNav />

                <main className="mx-auto flex w-full max-w-[min(1920px,calc(100vw-1.5rem))] flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-3 border-b-2 border-[#04385D] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-[#1F3860]">Gerenciamento de Usuários do Sistema</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    {systemUsers.length === 0
                                        ? 'Nenhum usuário do sistema encontrado.'
                                        : `${systemUsers.length} usuário${systemUsers.length === 1 ? '' : 's'} do sistema`}
                                </p>
                                {!hasDefaultUserPassword ? (
                                    <p className="mt-2 text-sm text-red-700">
                                        Defina a <span className="font-medium">senha padrão</span> em{' '}
                                        <span className="font-medium">Configurações</span> para poder criar usuários do sistema.
                                    </p>
                                ) : null}
                            </div>
                            <button
                                onClick={openCreateModal}
                                disabled={!hasDefaultUserPassword}
                                title={hasDefaultUserPassword ? 'Novo Usuário do Sistema' : 'Defina primeiro a senha padrão em Configurações'}
                                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1F3860] bg-white px-3 py-2 text-sm font-medium text-[#1F3860] shadow-sm transition hover:scale-105 hover:bg-[#1F3860] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-[#1F3860]"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                Novo Usuário
                            </button>
                        </div>
                        
                        <SystemUsersTable 
                            systemUsers={systemUsers}
                            currentUserId={auth?.user?.id}
                            onEditUser={openEditModal} 
                            onDeleteUser={openDeleteModal} 
                        />
                    </div>
                </main>

                <SystemUserFormModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setCreateModalOpen(false)} 
                    systemUser={editingUser} 
                />

                <SystemUserDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    systemUser={selectedUser}
                    onSuccess={handleDeleteSuccess}
                />
            </AppPageLayout>
        </>
    );
}
