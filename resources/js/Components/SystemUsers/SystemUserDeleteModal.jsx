import React, { useState } from 'react';
import BaseModal from '@/Components/UI/BaseModal';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

export default function SystemUserDeleteModal({ isOpen, onClose, systemUser, onSuccess }) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!systemUser) return;
        setIsDeleting(true);
        axios.delete(`/usuarios-sistema/${systemUser.id}`).then(() => {
            onSuccess(systemUser);
            onClose();
        }).catch((error) => {
            const message = error.response?.data?.message || 'Erro ao excluir usuário do sistema.';
            alert(message);
        }).finally(() => {
            setIsDeleting(false);
        });
    };

    if (!systemUser) return null;

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
                {isDeleting ? 'Excluindo...' : 'Excluir Usuário'}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Excluir Usuário do Sistema"
            footer={footer}
            maxWidthClass="max-w-md"
        >
            <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="pt-2">
                    <p className="text-sm text-slate-700">
                        Tem certeza que deseja remover o usuário <strong className="text-slate-900">{systemUser.name}</strong>?
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Esta ação não pode ser desfeita e removerá imediatamente o acesso do usuário ao sistema.
                    </p>
                </div>
            </div>
        </BaseModal>
    );
}
