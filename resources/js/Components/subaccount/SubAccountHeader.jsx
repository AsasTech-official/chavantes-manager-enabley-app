export default function SubAccountHeader({ subAccountName }) {
    return (
        <header className="mb-6 text-center">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#20A39E] sm:text-xs">Subconta ativa</p>
            <h1 className="mt-2 bg-gradient-to-r from-[#F2F2E9] via-white to-[#c8ebe9] bg-clip-text text-2xl font-semibold tracking-tight text-transparent drop-shadow-sm sm:text-3xl">
                {subAccountName?.trim() ? subAccountName.trim() : '—'}
            </h1>
        </header>
    );
}
