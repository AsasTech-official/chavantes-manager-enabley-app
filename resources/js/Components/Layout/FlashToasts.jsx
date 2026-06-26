import { useEffect, useLayoutEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';

/**
 * Laravel expõe mensagens em `props.flash` (middleware); o objeto página Inertia
 * pode também ter `flash` ao nível raiz. Em redirecionamentos POST→mesmo URL o Inertia
 * usa replace na história e não dispara `inertia:navigate`, pelo que é preciso reagir a
 * `inertia:success` para mostrar toasts após criar recurso na mesma rota.
 */
function mergeFlash(pageLike) {
    if (!pageLike) {
        return null;
    }
    const pf = pageLike.props?.flash;
    const tf = pageLike.flash;
    const merged = {
        success: pf?.success ?? tf?.success,
        error: pf?.error ?? tf?.error,
    };
    const hasSuccess = merged.success != null && merged.success !== '';
    const hasError = merged.error != null && merged.error !== '';
    if (!hasSuccess && !hasError) {
        return null;
    }
    return merged;
}

function applyFlash(flash) {
    if (!flash) {
        return;
    }
    if (flash.success != null && flash.success !== '') {
        toast.dismiss('flash-success');
        toast.success(String(flash.success), { toastId: 'flash-success' });
    }
    if (flash.error != null && flash.error !== '') {
        toast.dismiss('flash-error');
        toast.error(String(flash.error), { toastId: 'flash-error' });
    }
}

export default function FlashToasts() {
    const page = usePage();

    useLayoutEffect(() => {
        const merged = mergeFlash(page);
        if (merged) {
            applyFlash(merged);
        }
    }, []);

    useEffect(() => {
        const onSuccess = (event) => {
            const merged = mergeFlash(event.detail?.page);
            if (merged) {
                applyFlash(merged);
            }
        };

        const onInertiaFlash = (event) => {
            const raw = event.detail?.flash;
            if (raw && typeof raw === 'object') {
                applyFlash(raw);
            }
        };

        document.addEventListener('inertia:success', onSuccess);
        document.addEventListener('inertia:flash', onInertiaFlash);

        return () => {
            document.removeEventListener('inertia:success', onSuccess);
            document.removeEventListener('inertia:flash', onInertiaFlash);
        };
    }, []);

    return null;
}
