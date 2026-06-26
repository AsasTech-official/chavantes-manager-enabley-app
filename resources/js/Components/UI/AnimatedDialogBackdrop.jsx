import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Scrim a combinar com AnimatedContent: entrada em suave (GSAP), alinhada ao clima do login.
 */
export default function AnimatedDialogBackdrop({ onClose, ariaLabel = 'Fechar', closeDisabled = false, className = '' }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    }, []);

    return (
        <button
            ref={ref}
            type="button"
            className={`absolute inset-0 z-0 bg-slate-900/50 backdrop-blur-[1px] ${className}`.trim()}
            style={{ opacity: 0 }}
            aria-label={ariaLabel}
            onClick={() => {
                if (!closeDisabled) {
                    onClose();
                }
            }}
        />
    );
}
