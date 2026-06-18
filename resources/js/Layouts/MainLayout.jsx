import { ToastContainer } from 'react-toastify';
import { FlashToasts } from '@/Components/layout';

export default function MainLayout({ children }) {
    return (
        <>
            <FlashToasts />
            {children}
            <ToastContainer
                position="bottom-right"
                autoClose={4500}
                closeOnClick
                pauseOnHover
                draggable
                theme="colored"
                className="font-sans !z-[99999]"
                style={{ zIndex: 99999 }}
            />
        </>
    );
}
