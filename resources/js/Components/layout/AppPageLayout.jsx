export default function AppPageLayout({ children }) {
    const year = new Date().getFullYear();

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#04385D] text-slate-800">
            <div
                className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-[#20A39E]/40 via-[#205E8A]/15 to-[#04385D]"
                aria-hidden
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
            <footer
                className="relative z-10 shrink-0 py-4 text-center text-sm text-white/80"
                role="contentinfo"
            >
                © Grupo ASAS {year}
            </footer>
        </div>
    );
}
