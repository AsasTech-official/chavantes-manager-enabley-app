import React, { useId } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE_ALL = 'ALL';
export const PAGE_SIZES = [10, 25, 50, 100];

export default function DataTableLayout({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    pageSize,
    onPageSizeChange,
    page,
    onPageChange,
    totalItems,
    filteredItemsCount,
    emptyMessage = 'Nenhum resultado.',
    children,
    variant = 'page', // 'page' or 'modal'
}) {
    const baseId = useId();
    const searchId = `${baseId}-search`;
    const pageSizeId = `${baseId}-page-size`;

    const effectivePageSize = pageSize === PAGE_SIZE_ALL ? Math.max(filteredItemsCount, 1) : pageSize;
    const totalPages = Math.max(1, Math.ceil(filteredItemsCount / effectivePageSize) || 1);
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * effectivePageSize;
    const rangeEnd = filteredItemsCount === 0 ? 0 : Math.min(startIdx + effectivePageSize, filteredItemsCount);

    const rootClass = variant === 'modal' ? 'flex min-h-0 flex-1 flex-col gap-3' : 'mt-4 flex flex-col gap-3';
    const scrollClass = variant === 'modal' 
        ? 'min-h-0 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm'
        : 'max-h-[min(70vh,960px)] overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm';
    const navBtnClass = 'inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-[#04385D]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

    return (
        <div className={rootClass}>
            {/* Top Bar */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={searchId} className="relative block min-w-0 flex-1 sm:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#04385D]/60" strokeWidth={2} aria-hidden />
                    <input
                        id={searchId}
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 shadow-sm outline-none ring-[#04385D]/20 transition placeholder:text-slate-400 focus:border-[#04385D]/40 focus:ring-2"
                        autoComplete="off"
                    />
                </label>
                <div className="flex shrink-0 items-center gap-2">
                    <label htmlFor={pageSizeId} className="text-xs font-medium text-slate-600">Por página</label>
                    <select
                        id={pageSizeId}
                        value={pageSize === PAGE_SIZE_ALL ? PAGE_SIZE_ALL : String(pageSize)}
                        onChange={(e) => {
                            const v = e.target.value;
                            onPageSizeChange(v === PAGE_SIZE_ALL ? PAGE_SIZE_ALL : Number(v));
                        }}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none ring-[#04385D]/20 focus:ring-2"
                    >
                        {PAGE_SIZES.map((n) => <option key={n} value={String(n)}>{n}</option>)}
                        <option value={PAGE_SIZE_ALL}>Todos</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            {filteredItemsCount === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">
                    {searchQuery.trim() ? `Nenhum resultado para "${searchQuery.trim()}".` : emptyMessage}
                </p>
            ) : (
                <>
                    <div className={scrollClass}>
                        {children}
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-600">
                            {`${startIdx + 1}–${rangeEnd} de ${filteredItemsCount}`}
                            <span className="text-slate-400"> · Página {safePage} de {totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onPageChange(Math.max(1, safePage - 1))}
                                disabled={safePage <= 1}
                                className={navBtnClass}
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
                            </button>
                            <button
                                type="button"
                                onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
                                disabled={safePage >= totalPages}
                                className={navBtnClass}
                                aria-label="Página seguinte"
                            >
                                Seguinte <ChevronRight className="h-4 w-4" aria-hidden />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
