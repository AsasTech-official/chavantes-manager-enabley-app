import React from 'react';
import { X } from 'lucide-react';

export default function BaseModal({ isOpen, onClose, title, children, footer, maxWidthClass = "max-w-md" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose ? onClose : undefined}></div>
            <div className={`relative w-full ${maxWidthClass} transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all`}>
                {title && (
                    <div className="border-b border-slate-200 bg-[#1F3860] px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">
                                {title}
                            </h3>
                            {onClose && (
                                <button type="button" onClick={onClose} className="text-white hover:text-white/80 transition cursor-pointer">
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
                
                {footer && (
                    <div className="flex justify-end gap-3 border-t border-slate-200/90 bg-white/95 px-6 py-4 backdrop-blur-sm">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
