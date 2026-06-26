import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import BaseModal from '@/Components/ui/BaseModal';

export default function ManagerGroupsModal({ isOpen, onClose, manager, groups, onSuccess }) {
    const [assignedGroups, setAssignedGroups] = useState([]);
    const [savingGroups, setSavingGroups] = useState(false);
    const [groupSearchTerm, setGroupSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && manager) {
            setAssignedGroups(manager.groups.map(g => g.group_identifier));
            setGroupSearchTerm('');
        }
    }, [isOpen, manager]);

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

        axios.post(`/gerentes/${manager.id}/groups`, { groups: payload }).then(({ data }) => {
            onSuccess(manager.id, data.groups);
            onClose();
        }).catch(() => {
            alert('Erro ao atualizar grupos.');
        }).finally(() => {
            setSavingGroups(false);
        });
    };

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
        g.identifier.includes(groupSearchTerm)
    );

    if (!manager) return null;

    const footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="rounded-md cursor-pointer bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleSaveGroups}
                disabled={savingGroups}
                className="rounded-md cursor-pointer bg-[#3757A1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2a437e] disabled:opacity-50"
            >
                {savingGroups ? 'Salvando...' : 'Aplicar'}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Permissões: ${manager.name}`}
            footer={footer}
            maxWidthClass="max-w-lg"
        >
            <div className="-mx-6 -mt-6 px-6 py-3 border-b border-slate-100 bg-slate-50 mb-4 sticky top-0 z-10">
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

            {groups.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Nenhum grupo candidato encontrado na Enabley.
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                    Nenhum grupo corresponde à busca.
                </div>
            ) : (
                <div className="space-y-1">
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
        </BaseModal>
    );
}
