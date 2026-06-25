import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { AppNav, AppPageLayout } from '@/Components/layout';
import { Pencil, Trash2, ShieldCheck, X, Plus, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function ManagersIndex({ auth, managers: initialManagers, groups }) {
    const [managers, setManagers] = useState(initialManagers || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState(null);
    const [isGroupsModalOpen, setGroupsModalOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    
    // Create / Edit form
    const form = useForm({
        name: '',
        username: '',
        password: '',
    });

    // Groups form
    const [assignedGroups, setAssignedGroups] = useState([]);
    const [savingGroups, setSavingGroups] = useState(false);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');

    const openCreateModal = () => {
        setEditingManager(null);
        form.reset();
        form.clearErrors();
        setCreateModalOpen(true);
    };

    const openEditModal = (manager) => {
        setOpenDropdownId(null);
        setEditingManager(manager);
        form.setData({
            name: manager.name,
            username: manager.username,
            password: '', 
        });
        form.clearErrors();
        setCreateModalOpen(true);
    };

    const openGroupsModal = (manager) => {
        setOpenDropdownId(null);
        setSelectedManager(manager);
        setAssignedGroups(manager.groups.map(g => g.group_identifier));
        setGroupSearchTerm('');
        setGroupsModalOpen(true);
    };

    const handleSaveManager = (e) => {
        e.preventDefault();
        
        if (editingManager) {
            form.put(`/gerentes/${editingManager.id}`, {
                onSuccess: () => {
                    setCreateModalOpen(false);
                    setManagers(managers.map(m => {
                        if (m.id === editingManager.id) {
                            return { ...m, name: form.data.name, username: form.data.username };
                        }
                        return m;
                    }));
                }
            });
        } else {
            form.post('/gerentes', {
                onSuccess: () => {
                    setCreateModalOpen(false);
                    window.location.reload(); 
                }
            });
        }
    };

    const handleDeleteManager = (manager) => {
        setOpenDropdownId(null);
        if (!confirm(`Tem certeza que deseja remover o gerente ${manager.name}?`)) return;

        axios.delete(`/gerentes/${manager.id}`).then(() => {
            setManagers(managers.filter(m => m.id !== manager.id));
        }).catch(() => {
            alert('Erro ao excluir gerente.');
        });
    };

    const toggleGroup = (groupIdentifier) => {
        setAssignedGroups(prev => 
            prev.includes(groupIdentifier) 
                ? prev.filter(id => id !== groupIdentifier)
                : [...prev, groupIdentifier]
        );
    };

    const handleSaveGroups = () => {
        setSavingGroups(true);
        const payload = assignedGroups.map(identifier => {
            const groupObj = groups.find(g => g.identifier === identifier);
            return {
                group_identifier: identifier,
                group_name: groupObj ? groupObj.name : ''
            };
        });

        axios.post(`/gerentes/${selectedManager.id}/groups`, { groups: payload }).then(({ data }) => {
            setGroupsModalOpen(false);
            setManagers(managers.map(m => {
                if (m.id === selectedManager.id) {
                    return { ...m, groups: data.groups };
                }
                return m;
            }));
        }).catch(() => {
            alert('Erro ao atualizar grupos.');
        }).finally(() => {
            setSavingGroups(false);
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId && !event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const filteredManagers = managers.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.username.includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredManagers.length / itemsPerPage);
    const paginatedManagers = filteredManagers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredGroups = groups.filter(g => 
        g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) || 
        g.identifier.includes(groupSearchTerm)
    );

    return (
        <>
            <Head title="Gerenciamento de Gerentes" />
            <AppPageLayout>
                <AppNav />

                <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Toolbar: Filter & Actions */}
                    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex w-full max-w-sm items-center rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-[#3757A1] focus-within:ring-1 focus-within:ring-[#3757A1]">
                            <Search className="h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por Nome ou CPF..."
                                className="w-full border-none bg-transparent px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#3757A1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2a437e] w-full justify-center md:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Gerente
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm">
                        <div className="w-full">
                            <table className="min-w-full divide-y divide-slate-200 border-collapse">
                                <thead className="bg-slate-100 border-b-2 border-slate-200">
                                    <tr>
                                        <th scope="col" className="border-r border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Nome
                                        </th>
                                        <th scope="col" className="border-r border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Username
                                        </th>
                                        <th scope="col" className="border-r border-slate-200 px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Acesso Concedido
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-700">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredManagers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-sm text-slate-500">
                                                Nenhum gerente encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedManagers.map((manager, index) => (
                                            <tr key={manager.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                <td className="border-r border-slate-200 whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    {manager.name}
                                                </td>
                                                <td className="border-r border-slate-200 whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {manager.username}
                                                </td>
                                                <td className="border-r border-slate-200 px-6 py-4">
                                                    {manager.groups.length === 0 ? (
                                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10">
                                                            Sem acesso
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {manager.groups.slice(0, 3).map(g => (
                                                                <span key={g.id} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-[#3757A1] ring-1 ring-inset ring-[#3757A1]/20" title={g.group_name || g.group_identifier}>
                                                                    {g.group_name ? (g.group_name.length > 25 ? g.group_name.substring(0, 25) + '...' : g.group_name) : g.group_identifier}
                                                                </span>
                                                            ))}
                                                            {manager.groups.length > 3 && (
                                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                                    +{manager.groups.length - 3} mais
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                    <div className="relative inline-block text-left action-dropdown-container">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === manager.id ? null : manager.id)}
                                                            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
                                                        >
                                                            Ações
                                                            <ChevronDown className="h-4 w-4 text-slate-500" />
                                                        </button>

                                                        {openDropdownId === manager.id && (
                                                            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                                <div className="py-1" role="menu">
                                                                    <button
                                                                        onClick={() => openGroupsModal(manager)}
                                                                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-[#3757A1]"
                                                                        role="menuitem"
                                                                    >
                                                                        <ShieldCheck className="h-4 w-4" />
                                                                        Gerenciar Permissões
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openEditModal(manager)}
                                                                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                                                        role="menuitem"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        Editar Dados
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteManager(manager)}
                                                                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                                                        role="menuitem"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        Excluir Gerente
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg p-2 border border-slate-300 disabled:opacity-50"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg p-2 border border-slate-300 disabled:opacity-50"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </main>

                {/* CREATE / EDIT MODAL */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setCreateModalOpen(false)}></div>
                        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                            <div className="border-b border-slate-200 bg-white px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        {editingManager ? 'Editar Gerente' : 'Novo Gerente'}
                                    </h3>
                                    <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <form onSubmit={handleSaveManager}>
                                <div className="space-y-4 px-6 py-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={form.data.name} 
                                            onChange={e => form.setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm"
                                        />
                                        {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700">CPF (Usuário)</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={form.data.username} 
                                            onChange={e => form.setData('username', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm"
                                        />
                                        {form.errors.username && <p className="mt-1 text-xs text-red-600">{form.errors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700">
                                            Senha <span className="text-slate-400 font-normal">{editingManager && '(Deixe em branco para não alterar)'}</span>
                                        </label>
                                        <input 
                                            type="password" 
                                            required={!editingManager}
                                            value={form.data.password} 
                                            onChange={e => form.setData('password', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm"
                                        />
                                        {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                                    <button 
                                        type="button" 
                                        onClick={() => setCreateModalOpen(false)} 
                                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={form.processing} 
                                        className="rounded-md bg-[#3757A1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2a437e] disabled:opacity-50"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* GROUPS MODAL */}
                {isGroupsModalOpen && selectedManager && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setGroupsModalOpen(false)}></div>
                        <div className="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all flex flex-col max-h-[90vh]">
                            <div className="border-b border-slate-200 bg-white px-6 py-4 shrink-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        Permissões: {selectedManager.name}
                                    </h3>
                                    <button onClick={() => setGroupsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-6 py-3 border-b border-slate-100 shrink-0 bg-slate-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Filtrar Unidades ou Eixos..."
                                        className="w-full rounded-md border-slate-300 py-1.5 pl-9 pr-4 text-sm shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1]"
                                        value={groupSearchTerm}
                                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-2 overflow-y-auto min-h-0 flex-1">
                                {groups.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-500">
                                        Nenhum grupo candidato encontrado na Enabley.
                                    </div>
                                ) : filteredGroups.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-500">
                                        Nenhum grupo corresponde à busca.
                                    </div>
                                ) : (
                                    <div className="space-y-1 py-2">
                                        {filteredGroups.map(g => (
                                            <label 
                                                key={g.identifier} 
                                                className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 transition-colors hover:bg-slate-50 ${assignedGroups.includes(g.identifier) ? 'border-[#3757A1] bg-blue-50/30' : 'border-transparent'}`}
                                            >
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedGroups.includes(g.identifier)}
                                                        onChange={() => toggleGroup(g.identifier)}
                                                        className="h-4 w-4 rounded border-slate-300 text-[#3757A1] focus:ring-[#3757A1] cursor-pointer"
                                                    />
                                                    <span className="ml-3 text-sm font-medium text-slate-700">
                                                        {g.name}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                                    {g.type}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 shrink-0">
                                <button 
                                    type="button" 
                                    onClick={() => setGroupsModalOpen(false)} 
                                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSaveGroups} 
                                    disabled={savingGroups} 
                                    className="rounded-md bg-[#3757A1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2a437e] disabled:opacity-50"
                                >
                                    {savingGroups ? 'Salvando...' : 'Aplicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AppPageLayout>
        </>
    );
}
