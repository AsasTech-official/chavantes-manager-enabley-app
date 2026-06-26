import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/layout';
import { Plus } from 'lucide-react';
import ManagerFormModal from '@/Components/managers/ManagerFormModal';
import ManagerGroupsModal from '@/Components/managers/ManagerGroupsModal';
import ManagerDeleteModal from '@/Components/managers/ManagerDeleteModal';
import ManagersTable from '@/Components/managers/ManagersTable';

export default function ManagersIndex({ auth, managers: initialManagers, groups, hasDefaultUserPassword }) {
    const [managers, setManagers] = useState(initialManagers || []);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState(null);
    const [isGroupsModalOpen, setGroupsModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);

    useEffect(() => {
        setManagers(initialManagers);
    }, [initialManagers]);

    const openCreateModal = () => {
        setEditingManager(null);
        setCreateModalOpen(true);
    };

    const openEditModal = (manager) => {
        setEditingManager(manager);
        setCreateModalOpen(true);
    };

    const openGroupsModal = (manager) => {
        setSelectedManager(manager);
        setGroupsModalOpen(true);
    };

    const openDeleteModal = (manager) => {
        setSelectedManager(manager);
        setDeleteModalOpen(true);
    };

    const handleDeleteSuccess = (manager) => {
        setManagers(managers.filter(m => m.id !== manager.id));
    };

    const handleGroupsSuccess = (managerId, updatedGroups) => {
        setManagers(managers.map(m => {
            if (m.id === managerId) {
                return { ...m, groups: updatedGroups };
            }
            return m;
        }));
    };

    return (
        <>
            <Head title="Gerenciamento de Gerentes" />
            <AppPageLayout>
                <AppNav />

                <main className="mx-auto flex w-full max-w-[min(1920px,calc(100vw-1.5rem))] flex-1 flex-col px-4 pb-10 pt-4 sm:px-6">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-3 border-b-2 border-[#04385D] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-[#1F3860]">Gerenciamento de Gerentes</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    {managers.length === 0
                                        ? 'Nenhum gerente encontrado.'
                                        : `${managers.length} gerente${managers.length === 1 ? '' : 's'}`}
                                </p>
                                {!hasDefaultUserPassword ? (
                                    <p className="mt-2 text-sm text-red-700">
                                        Defina a <span className="font-medium">senha padrão</span> em{' '}
                                        <span className="font-medium">Configurações</span> para poder criar gerentes.
                                    </p>
                                ) : null}
                            </div>
                            <button
                                onClick={openCreateModal}
                                disabled={!hasDefaultUserPassword}
                                title={hasDefaultUserPassword ? 'Novo Gerente' : 'Defina primeiro a senha padrão em Configurações'}
                                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1F3860] bg-white px-3 py-2 text-sm font-medium text-[#1F3860] shadow-sm transition hover:scale-105 hover:bg-[#1F3860] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-[#1F3860]"
                            >
                                <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                                Novo Gerente
                            </button>
                        </div>
                        
                        <ManagersTable 
                            managers={managers} 
                            onEditManager={openEditModal} 
                            onGroupsManager={openGroupsModal} 
                            onDeleteManager={openDeleteModal} 
                        />
                    </div>
                </main>

                <ManagerFormModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setCreateModalOpen(false)} 
                    manager={editingManager} 
                />

                <ManagerGroupsModal 
                    isOpen={isGroupsModalOpen} 
                    onClose={() => setGroupsModalOpen(false)} 
                    manager={selectedManager} 
                    groups={groups} 
                    onSuccess={handleGroupsSuccess} 
                />

                <ManagerDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    manager={selectedManager}
                    onSuccess={handleDeleteSuccess}
                />
            </AppPageLayout>
        </>
    );
}
