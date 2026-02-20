'use client';

import { useAuthProtection } from '@/app/hooks/useAuthProtection';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthorized, isAdmin } = useAuthProtection('/', true); // Require Admin

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-[#01334c] border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Admin Access...</span>
                </div>
            </div>
        );
    }

    if (!isAuthorized || !isAdmin) {
        return null; // Hook handles redirect
    }

    return (
        <section className="min-h-screen bg-slate-50">
            {children}
        </section>
    );
}
