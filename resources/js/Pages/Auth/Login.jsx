import { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Head } from '@inertiajs/react';
import AnimatedContent from '@/Components/ui/AnimatedContent';
import { DIALOG_MOTION } from '@/Components/ui/dialogMotion';

function LoginFullScreenSpinner() {
    return (
        <div
            className="flex min-h-[min(60vh,420px)] w-full flex-col items-center justify-center gap-4 px-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <Loader2 className="h-12 w-12 animate-spin text-[#F2F2E9]" strokeWidth={2} aria-hidden />
            <span className="text-sm font-medium text-white/90">Acessando…</span>
        </div>
    );
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        setProcessing(true);
        try {
            const { data } = await axios.post('/login', {
                username,
                password,
                remember,
            });
            if (data.redirect) {
                window.location.href = data.redirect;
                return;
            }
            setProcessing(false);
        } catch (err) {
            if (err.response?.status === 422 && err.response.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ username: [err.response.data.message] });
            }
            setProcessing(false);
        }
    };

    const firstError = (key) => (Array.isArray(errors[key]) ? errors[key][0] : errors[key]);

    return (
        <>
            <Head title="login" />
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#04385D] text-slate-800">
                <div
                    className="pointer-events-none fixed inset-0 z-0 bg-[#1F3860]"
                    aria-hidden
                />
                <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center overflow-visible px-6 py-12">
                    {processing ? (
                        <LoginFullScreenSpinner />
                    ) : (
                        <AnimatedContent {...DIALOG_MOTION} className="w-full">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
                                <div className="mb-8 flex justify-center">
                                    <img
                                        src="/logo/chavantes-blue.png"
                                        alt="Grupo Chavantes"
                                        className="h-14 w-auto max-w-[min(100%,16rem)] object-contain sm:h-16"
                                    />
                                </div>
                                <form onSubmit={submit} className="mt-6 space-y-5">
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-slate-600">
                                                Nome de usuário
                                            </label>
                                            <input
                                                id="username"
                                                name="username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value.replace(/\D/g, ""))}
                                                placeholder="Digite o seu usuário"
                                                className="mt-1.5 w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#3757A1] focus:outline-none focus:ring-1 focus:ring-[#3757A1]"
                                                autoComplete="username"
                                            />
                                            {firstError('username') && (
                                                <p className="mt-1.5 text-sm text-red-600">{firstError('username')}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-slate-600">
                                                Senha
                                            </label>
                                            <div className="relative mt-1.5">
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Digite a sua senha"
                                                    className="w-full rounded-lg border border-slate-400 bg-white py-2 pl-3 pr-11 text-slate-900 shadow-sm focus:border-[#3757A1] focus:outline-none focus:ring-1 focus:ring-[#3757A1]"
                                                    autoComplete="current-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="cursor-pointer absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-r-lg"
                                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                                                    ) : (
                                                        <Eye className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                                                    )}
                                                </button>
                                            </div>
                                            {firstError('password') && (
                                                <p className="mt-1.5 text-sm text-red-600">{firstError('password')}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="cursor-pointer hover:scale-105 transition-all duration-300 w-full rounded-lg bg-[#1F3860] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#3757A1] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Acessar
                                        </button>
                                    </form>
                            </div>
                        </AnimatedContent>
                    )}
                </div>
                <p className="relative z-10 py-4 text-center text-sm text-white/80">© Grupo ASAS 2026</p>
            </div>
        </>
    );
}
