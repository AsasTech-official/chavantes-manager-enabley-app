import React, { useState } from 'react';
import BaseModal from '@/Components/ui/BaseModal';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

export default function ManagerDeleteModal({ isOpen, onClose, manager, onSuccess }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!manager) return;
        setIsDeleting(true);
        axios.delete(`/gerentes/${manager.id}`).then(() => {
            onSuccess(manager);
            onClose();
        }).catch(() => {
            alert('Erro ao excluir gerente.');
        }).finally(() => {
            setIsDeleting(false);
        });
    };

    if (!manager) return null;

    const footer = (
        <>
            <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 cursor-pointer"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
                {isDeleting ? 'Excluindo...' : 'Excluir Gerente'}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Excluir Gerente"
            footer={footer}
            maxWidthClass="max-w-md"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="pt-2">
                    <p className="text-sm text-slate-700">
                        Tem certeza que deseja remover o gerente <strong className="text-slate-900">{manager.name}</strong>?
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Esta ação não pode ser desfeita e removerá imediatamente o acesso do gerente ao sistema.
                    </p>
                </div>
            </div>
        </BaseModal>
    );
}
