import { usePage } from '@inertiajs/react';
import { ToastContainer } from 'react-toastify';
import { FlashToasts } from '@/Components/Layout';
import ForceChangePasswordModal from '@/Components/Auth/ForceChangePasswordModal';

export default function MainLayout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <>
            <FlashToasts />
            {user?.must_change_password && <ForceChangePasswordModal isOpen={true} />}
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
