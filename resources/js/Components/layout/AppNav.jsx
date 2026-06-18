import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeftRight, Check, ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react';
import ConfigurationModal from '@/Components/subaccount/ConfigurationModal';

function navTabClass(active) {
    return [
        'cursor-pointer rounded-md px-4 py-2 text-base font-semibold transition sm:text-lg',
        active
            ? 'bg-black/[0.06] text-[#EF6F6C]'
            : 'text-[#0d7c78] hover:bg-black/[0.04] hover:text-[#EF6F6C]',
    ].join(' ');
}

export default function AppNav() {
    const { props, url: pageUrl } = usePage();
    const { auth, enabley, subContasSettings } = props;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [configurationModalOpen, setConfigurationModalOpen] = useState(false);
    const [subAccountPickerOpen, setSubAccountPickerOpen] = useState(false);
    const [mobileSubPickerOpen, setMobileSubPickerOpen] = useState(false);
    const [subAccountSwitching, setSubAccountSwitching] = useState(false);
    const [processing, setProcessing] = useState(false);
    const userMenuRef = useRef(null);

    const activeSubAccount = enabley?.activeSubAccount ?? '';
    const envSubAccount = String(subContasSettings?.envSubAccount ?? '').trim();
    const subAccountItems = Array.isArray(subContasSettings?.items) ? subContasSettings.items : [];

    const selectableSubAccountNames = useMemo(() => {
        const set = new Set(subAccountItems.map((r) => String(r.name ?? '').trim()).filter(Boolean));
        if (envSubAccount !== '') {
            set.add(envSubAccount);
        }
        const active = String(activeSubAccount ?? '').trim();
        if (active !== '') {
            set.add(active);
        }
        return [...set].sort((a, b) => a.localeCompare(b));
    }, [subAccountItems, envSubAccount, activeSubAccount]);

    const switchSubAccount = useCallback(
        (name) => {
            const n = String(name ?? '').trim();
            if (!n || n === activeSubAccount) {
                return;
            }
            setSubAccountSwitching(true);
            router.post(
                '/configuracoes/subconta-ativa',
                { name: n },
                {
                    preserveScroll: true,
                    onFinish: () => setSubAccountSwitching(false),
                    onSuccess: () => router.reload({ preserveScroll: true }),
                },
            );
        },
        [activeSubAccount],
    );

    const resetSubAccountToEnv = useCallback(() => {
        if (!envSubAccount) {
            return;
        }
        setSubAccountSwitching(true);
        router.delete('/configuracoes/subconta-ativa', {
            preserveScroll: true,
            onFinish: () => setSubAccountSwitching(false),
            onSuccess: () => router.reload({ preserveScroll: true }),
        });
    }, [envSubAccount]);

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
        if (!userMenuOpen) {
            setSubAccountPickerOpen(false);
        }
    }, [userMenuOpen]);

    useEffect(() => {
        if (!menuOpen) {
            setMobileSubPickerOpen(false);
        }
    }, [menuOpen]);

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
                                        <p className="px-3 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                                            Subconta Enabley
                                        </p>
                                        <div className="px-3 pb-2">
                                            <p className="text-sm font-mono text-slate-800">{activeSubAccount || '—'}</p>
                                            <div className="relative mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSubAccountPickerOpen((o) => !o)}
                                                    aria-expanded={subAccountPickerOpen}
                                                    aria-haspopup="listbox"
                                                    disabled={subAccountSwitching}
                                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-[#04385D]/20 bg-[#04385D]/[0.06] px-3 py-2 text-sm font-medium text-[#04385D] transition hover:bg-[#04385D]/10 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04385D]"
                                                    role="menuitem"
                                                >
                                                    <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden />
                                                    <span className="min-w-0 flex-1 truncate text-left">Mudar subconta</span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 shrink-0 transition ${subAccountPickerOpen ? 'rotate-180' : ''}`}
                                                        aria-hidden
                                                    />
                                                </button>
                                                {subAccountPickerOpen ? (
                                                    <div
                                                        className="absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-200/40 ring-1 ring-slate-900/5"
                                                        role="listbox"
                                                        aria-label="Selecionar subconta Enabley"
                                                    >
                                                        <div className="max-h-52 overflow-y-auto">
                                                            {selectableSubAccountNames.length === 0 ? (
                                                                <p className="px-3 py-2 text-xs leading-snug text-slate-500">
                                                                    Nenhuma subconta registada. Use Configurações para
                                                                    adicionar.
                                                                </p>
                                                            ) : (
                                                                selectableSubAccountNames.map((name) => {
                                                                    const isActive = name === activeSubAccount;
                                                                    return (
                                                                        <button
                                                                            key={name}
                                                                            type="button"
                                                                            role="option"
                                                                            aria-selected={isActive}
                                                                            disabled={subAccountSwitching}
                                                                            onClick={() => {
                                                                                if (isActive) {
                                                                                    setSubAccountPickerOpen(false);
                                                                                    return;
                                                                                }
                                                                                switchSubAccount(name);
                                                                                setSubAccountPickerOpen(false);
                                                                                closeUserMenu();
                                                                            }}
                                                                            className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-mono text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                                isActive ? 'bg-emerald-50/90' : ''
                                                                            }`}
                                                                        >
                                                                            <span className="min-w-0 flex-1 truncate">
                                                                                {name}
                                                                            </span>
                                                                            {isActive ? (
                                                                                <Check
                                                                                    className="h-4 w-4 shrink-0 text-emerald-600"
                                                                                    aria-hidden
                                                                                />
                                                                            ) : null}
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                        {envSubAccount ? (
                                                            <div className="border-t border-slate-100 px-1 pt-1 pb-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={subAccountSwitching}
                                                                    onClick={() => {
                                                                        resetSubAccountToEnv();
                                                                        setSubAccountPickerOpen(false);
                                                                        closeUserMenu();
                                                                    }}
                                                                    className="w-full cursor-pointer rounded-md px-2 py-2 text-left text-xs font-medium text-[#0d7c78] underline decoration-[#0d7c78]/35 underline-offset-2 hover:bg-slate-50 hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Repor para padrão ({envSubAccount})
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
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
                                    isGrupos ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#0d7c78]'
                                }`}
                            >
                                Grupos
                            </Link>
                            <Link
                                href="/usuarios"
                                onClick={closeMenu}
                                className={`cursor-pointer rounded-lg px-3 py-3.5 text-lg font-semibold transition hover:bg-black/[0.04] hover:text-[#EF6F6C] ${
                                    isUsuarios ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#0d7c78]'
                                }`}
                            >
                                Usuários
                            </Link>
                            <Link
                                href="/importacao"
                                onClick={closeMenu}
                                className={`cursor-pointer rounded-lg px-3 py-3.5 text-lg font-semibold transition hover:bg-black/[0.04] hover:text-[#EF6F6C] ${
                                    isImportacao ? 'bg-black/[0.06] text-[#EF6F6C]' : 'text-[#0d7c78]'
                                }`}
                            >
                                Importação
                            </Link>
                            <p className="px-3 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                                Subconta Enabley
                            </p>
                            <p className="px-3 pb-1 font-mono text-sm text-slate-800">
                                {activeSubAccount || '—'}
                            </p>
                            <div className="px-3 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setMobileSubPickerOpen((o) => !o)}
                                    aria-expanded={mobileSubPickerOpen}
                                    aria-haspopup="listbox"
                                    disabled={subAccountSwitching}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-[#04385D]/25 bg-[#04385D]/[0.07] px-3 py-2.5 text-sm font-medium text-[#04385D] hover:bg-[#04385D]/12 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden />
                                    <span className="min-w-0 flex-1 truncate text-left">Mudar subconta</span>
                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition ${mobileSubPickerOpen ? 'rotate-180' : ''}`}
                                        aria-hidden
                                    />
                                </button>
                                {mobileSubPickerOpen ? (
                                    <div
                                        className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                        role="listbox"
                                        aria-label="Selecionar subconta Enabley"
                                    >
                                        <div className="max-h-48 overflow-y-auto py-1">
                                            {selectableSubAccountNames.length === 0 ? (
                                                <p className="px-3 py-2 text-xs leading-snug text-slate-500">
                                                    Nenhuma subconta registada. Use Configurações para adicionar.
                                                </p>
                                            ) : (
                                                selectableSubAccountNames.map((name) => {
                                                    const isActive = name === activeSubAccount;
                                                    return (
                                                        <button
                                                            key={name}
                                                            type="button"
                                                            role="option"
                                                            aria-selected={isActive}
                                                            disabled={subAccountSwitching}
                                                            onClick={() => {
                                                                if (isActive) {
                                                                    setMobileSubPickerOpen(false);
                                                                    return;
                                                                }
                                                                switchSubAccount(name);
                                                                setMobileSubPickerOpen(false);
                                                                closeMenu();
                                                            }}
                                                            className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-mono text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                isActive ? 'bg-emerald-50/90' : ''
                                                            }`}
                                                        >
                                                            <span className="min-w-0 flex-1 truncate">{name}</span>
                                                            {isActive ? (
                                                                <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                                                            ) : null}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                        {envSubAccount ? (
                                            <div className="border-t border-slate-100 px-2 py-2">
                                                <button
                                                    type="button"
                                                    disabled={subAccountSwitching}
                                                    onClick={() => {
                                                        resetSubAccountToEnv();
                                                        setMobileSubPickerOpen(false);
                                                        closeMenu();
                                                    }}
                                                    className="w-full cursor-pointer text-left text-xs font-medium text-[#0d7c78] underline decoration-[#0d7c78]/35 underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Repor para padrão ({envSubAccount})
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
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
                items={subContasSettings?.items ?? []}
                activeSubAccount={activeSubAccount}
                envSubAccount={subContasSettings?.envSubAccount ?? ''}
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
