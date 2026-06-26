import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import BaseModal from '@/Components/UI/BaseModal';

export default function ForceChangePasswordModal({ isOpen }) {
    const form = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.put('/password/change', {
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <BaseModal
            isOpen={isOpen}
            title="Ação Necessária: Alterar Senha"
            // Sem onClose para forçar o usuário a alterar a senha
            maxWidthClass="max-w-md"
            footer={
                <button
                    type="submit"
                    form="force-change-password-form"
                    className="flex-1 cursor-pointer rounded-xl bg-[#04385D] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#205E8A] disabled:opacity-60"
                    disabled={form.processing}
                >
                    {form.processing ? 'Atualizando...' : 'Atualizar Senha'}
                </button>
            }
        >
            <div className="mb-4">
                <p className="text-sm text-slate-600">
                    Como este é o seu primeiro acesso (ou sua senha foi redefinida), você precisa definir uma nova senha pessoal antes de continuar.
                </p>
            </div>

            <form id="force-change-password-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Nova Senha</label>
                    <div className="relative mt-1">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            required
                            minLength={8}
                            className="block w-full rounded-md border-slate-300 py-2 pl-3 pr-10 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                    </div>
                    {form.errors.password && <p className="mt-1 text-xs text-red-600">{form.errors.password}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.data.password_confirmation}
                        onChange={(e) => form.setData('password_confirmation', e.target.value)}
                        required
                        minLength={8}
                        className="mt-1 block w-full rounded-md border-slate-300 py-2 pl-3 shadow-sm focus:border-[#3757A1] focus:ring-[#3757A1] sm:text-sm"
                    />
                </div>
            </form>
        </BaseModal>
    );
}
