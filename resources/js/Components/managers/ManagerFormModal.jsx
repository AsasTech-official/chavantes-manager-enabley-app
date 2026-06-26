import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import BaseModal from '@/Components/ui/BaseModal';

export default function ManagerFormModal({ isOpen, onClose, manager }) {
    const form = useForm({
        name: '',
        username: '',
        password: '',
    });

    useEffect(() => {
        if (isOpen) {
            form.clearErrors();
            if (manager) {
                form.setData({
                    name: manager.name,
                    username: manager.username,
                    password: '',
                });
            } else {
                form.setData({
                    name: '',
                    username: '',
                    password: '',
                });
            }
        }
    }, [isOpen, manager]);

    const handleSaveManager = (e) => {
        e.preventDefault();
        
        if (manager) {
            form.put(`/gerentes/${manager.id}`, {
                onSuccess: () => onClose()
            });
        } else {
            form.post('/gerentes', {
                onSuccess: () => onClose()
            });
        }
    };

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
                onClick={handleSaveManager}
                disabled={form.processing}
                className="rounded-md bg-[#3757A1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2a437e] disabled:opacity-50 cursor-pointer"
            >
                Salvar
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={manager ? 'Editar Gerente' : 'Novo Gerente'}
            footer={footer}
        >
            <form id="manager-form" onSubmit={handleSaveManager} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700">Nome Completo</label>
                    <input
                        type="text"
                        required
                        value={form.data.name}
                        onChange={e => form.setData('name', e.target.value.toUpperCase())}
                        className="uppercase mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm px-2"
                    />
                    {form.errors.name && <p className="mt-1 text-xs text-red-600">{form.errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700">CPF (Usuário)</label>
                    <input
                        type="text"
                        required
                        value={form.data.username}
                        onChange={e => form.setData('username', e.target.value.replace(/\D/g, ""))}
                        className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm px-2"
                    />
                    {form.errors.username && <p className="mt-1 text-xs text-red-600">{form.errors.username}</p>}
                </div>
                {manager && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700">
                            Senha <span className="text-slate-400 font-normal">(Deixe em branco para não alterar)</span>
                        </label>
                        <input
                            type="password"
                            value={form.data.password}
                            onChange={e => form.setData('password', e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 py-2 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm px-2"
                        />
                        {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
                    </div>
                )}
            </form>
        </BaseModal>
    );
}
