import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react';
import ConfigurationModal from '@/Components/subaccount/ConfigurationModal';

function navTabClass(active) {
    return [
        'cursor-pointer rounded-md px-4 py-2 text-base font-semibold transition sm:text-lg',
        active
            ? 'bg-black/[0.06] text-[#46A6B9]'
            : 'text-[#1F3860] hover:bg-black/[0.04] hover:text-[#46A6B9]',
    ].join(' ');
}

export default function AppNav() {
    const { props, url: pageUrl } = usePage();
    const { auth, enabley, subContasSettings } = props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [configurationModalOpen, setConfigurationModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const userMenuRef = useRef(null);

    const activeSubAccount = enabley?.activeSubAccount ?? '';

    const closeUserMenu = useCallback(() => setUserMenuOpen(false), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
        if (!userMenuOpen) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeUserMenu();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [userMenuOpen, closeUserMenu]);

    useEffect(() => {
        if (!userMenuOpen) {
            return undefined;
        }
        const onPointer = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                closeUserMenu();
            }
        };
        document.addEventListener('mousedown', onPointer);
        return () => document.removeEventListener('mousedown', onPointer);
    }, [userMenuOpen, closeUserMenu]);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [menuOpen, closeMenu]);

    const logout = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const { data } = await axios.post('/logout');
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } finally {
            setProcessing(false);
            setUserMenuOpen(false);
            setMenuOpen(false);
        }
    };

    const label = auth?.user
        ? auth.user.name || auth.user.username
        : '';

    const path = String(pageUrl ?? '').split('?')[0] || '';
    const isGrupos = path === '/home';
    const isUsuarios = path === '/usuarios';
    const isImportacao = path === '/importacao';

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white shadow-sm">
                <div className="relative flex h-[4.5rem] w-full items-center px-3 sm:px-5">
                    <Link
                        href="/home"
                        className="inline-flex shrink-0 cursor-pointer items-center"
                        onClick={closeMenu}
                    >
                        <img
                            src="/logo/chavantes-blue.png"
                            alt="Grupo Chavantes"
                            className="h-10 w-auto object-contain sm:h-11"
                        />
                    </Link>
                    <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
                        <nav
                            className="pointer-events-auto flex items-center gap-1"
                            aria-label="Secções principais"
                        >
                            <Link href="/home" className={navTabClass(isGrupos)}>
                                Grupos
                            </Link>
                            <Link href="/usuarios" className={navTabClass(isUsuarios)}>
                                Usuários
                            </Link>
                            <Link href="/importacao" className={navTabClass(isImportacao)}>
                                Importação
                            </Link>
                        </nav>
                    </div>
                    <div className="ml-auto hidden md:block" ref={userMenuRef}>
                        {auth?.user && (
                            <div className="relative flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((o) => !o)}
                                    className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-slate-800 transition duration-200 hover:scale-[1.02] hover:bg-black/[0.05]"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                >
                                    <span className="max-w-[12rem] truncate text-base font-medium sm:max-w-[16rem]">
                                        {label}
                                    </span>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 text-slate-500 transition ${userMenuOpen ? 'rotate-180' : ''}`}
                                        aria-hidden
                                    />
                                </button>
                                {userMenuOpen && (
                                    <div
                                        className="absolute right-0 top-full z-50 mt-1.5 w-80 min-w-[18rem] origin-top-right rounded-xl border border-slate-200/90 bg-white py-1 text-left shadow-lg shadow-slate-200/50 ring-1 ring-slate-900/5"
                                        role="menu"
                                    >
                                        <div className="border-b border-slate-100 px-3 py-2.5">
                                            <p className="text-sm font-medium text-slate-900">{label}</p>
                                            {auth.user?.username ? (
                                                <p className="mt-0.5 text-xs text-[#3A2618]">@{auth.user.username}</p>
                                            ) : null}
                                        </div>
                                        {activeSubAccount ? (
                                            <>
                                                <p className="px-3 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                                                    Subconta Enabley
                                                </p>
                                                <p className="px-3 pb-2 font-mono text-sm text-slate-800">
                                                    {activeSubAccount}
                                                </p>
                                            </>
                                        ) : null}
                                        <div className="border-t border-slate-100 p-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    closeUserMenu();
                                                    setConfigurationModalOpen(true);
                                                }}
                                                className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                role="menuitem"
                                            >
                                                <Settings className="h-4 w-4 shrink-0" aria-hidden />
                                                Configurações
                                            </button>
                                        </div>
                                        <form onSubmit={logout} className="border-t border-slate-100 p-1">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                role="menuitem"
                                            >
                                                <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                                {processing ? 'Saindo…' : 'Sair'}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex cursor-pointer items-center md:hidden">
                        {auth?.user && (
                            <button
                                type="button"
                                onClick={() => setMenuOpen(true)}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-800 transition hover:bg-black/[0.06]"
                                aria-label="Abrir menu"
                            >
                                <Menu className="h-6 w-6" strokeWidth={2.25} aria-hidden />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {menuOpen && (
                <div
                    className="fixed inset-0 z-50 flex md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu de navegação"
                >
                    <button
                        type="button"
                        className="absolute inset-0 cursor-pointer bg-slate-900/40 backdrop-blur-sm"
                        aria-label="Fechar menu"
                        onClick={closeMenu}
                    />
                    <div className="relative z-10 ml-auto flex h-full w-full max-w-[20rem] flex-col border-l border-slate-200/90 bg-[#F2F2E9] shadow-2xl">
                        <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-slate-200/80 pl-2 pr-1">
                            <span className="pl-1 text-sm font-semibold text-slate-500">Menu</span>
                            <button
                                type="button"
                                onClick={closeMenu}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-slate-800 hover:bg-black/[0.05]"
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                            </button>
                        </div>
                        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
                            <Link
                                href="/home"
                                onClick={closeMenu}
                                className={`cursor-pointer rounded-lg px-3 py-3.5 text-lg font-semibold transition hover:bg-black/[0.04] hover:text-[#EF6F6C] ${
                                    isGrupos ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#3757A1]'
                                }`}
                            >
                                Grupos
                            </Link>
                            <Link
                                href="/usuarios"
                                onClick={closeMenu}
                                className={`cursor-pointer rounded-lg px-3 py-3.5 text-lg font-semibold transition hover:bg-black/[0.04] hover:text-[#EF6F6C] ${
                                    isUsuarios ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#3757A1]'
                                }`}
                            >
                                Usuários
                            </Link>
                            <Link
                                href="/importacao"
                                onClick={closeMenu}
                                className={`cursor-pointer rounded-lg px-3 py-3.5 text-lg font-semibold transition hover:bg-black/[0.04] hover:text-[#EF6F6C] ${
                                    isImportacao ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#3757A1]'
                                }`}
                            >
                                Importação
                            </Link>
                            {activeSubAccount ? (
                                <>
                                    <p className="px-3 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                        Subconta Enabley
                                    </p>
                                    <p className="px-3 pb-1 font-mono text-sm text-slate-800">
                                        {activeSubAccount}
                                    </p>
                                </>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => {
                                    closeMenu();
                                    setConfigurationModalOpen(true);
                                }}
                                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-black/[0.04]"
                            >
                                <Settings className="h-4 w-4" />
                                Configurações
                            </button>
                        </nav>
                        {auth?.user && (
                            <div className="border-t border-slate-200/80 p-3">
                                <p className="mb-2 truncate text-sm text-slate-600">{label}</p>
                                <form onSubmit={logout}>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-200/80 bg-white px-3 py-2.5 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                                        {processing ? 'A saindo…' : 'Sair'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfigurationModal
                open={configurationModalOpen}
                onClose={() => setConfigurationModalOpen(false)}
                hasDefaultUserPassword={Boolean(subContasSettings?.hasDefaultUserPassword)}
                defaultUserPassword={
                    typeof subContasSettings?.defaultUserPassword === 'string'
                        ? subContasSettings.defaultUserPassword
                        : null
                }
            />
        </>
    );
}
