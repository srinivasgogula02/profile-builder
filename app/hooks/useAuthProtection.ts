'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfileStore } from '@/app/lib/store';
import { supabase } from '@/app/lib/supabase';

export function useAuthProtection(redirectPath = '/', requireAdmin = false) {
    const router = useRouter();
    const { user, profileLoaded, showAuthModal, setShowAuthModal } = useProfileStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const SUPER_ADMIN_PHONE = '9347502455';

    useEffect(() => {
        const checkAuth = async () => {
            let currentUser = user;

            // 1. Get User Session if not in store
            if (!currentUser) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    currentUser = session.user;
                } else {
                    // Not authenticated
                    setIsAuthorized(false);
                    setIsAdmin(false);
                    router.replace(redirectPath);
                    if (redirectPath === '/') setTimeout(() => setShowAuthModal(true), 500);
                    setIsLoading(false);
                    return;
                }
            }

            // 2. User is authenticated
            setIsAuthorized(true);

            // 3. Admin Check
            try {
                // Fetch profile to check is_admin column
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin, user_id')
                    .eq('user_id', currentUser.id)
                    .single();

                let adminStatus = profile?.is_admin || false;

                // 4. Admin Bootstrap (Auto-promote Super Admin)
                // Check if phone matches (Supabase auth user phone)
                const userPhone = currentUser.phone || currentUser.user_metadata?.phone;
                if (userPhone && userPhone.includes(SUPER_ADMIN_PHONE) && !adminStatus) {
                    console.log('Bootstrapping Super Admin via API...');
                    // Call API to bypass RLS
                    try {
                        const res = await fetch('/api/auth/bootstrap-admin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: currentUser.id, phone: userPhone })
                        });

                        if (res.ok) {
                            adminStatus = true;
                            // Refresh profile to confirm?
                        } else {
                            const errData = await res.json();
                            console.error('Bootstrap failed:', errData.error);
                        }
                    } catch (apiErr) {
                        console.error('Bootstrap API error:', apiErr);
                    }
                }

                setIsAdmin(adminStatus);

                // 5. Redirect if Admin required but not Admin
                if (requireAdmin && !adminStatus) {
                    router.replace('/'); // Redirect non-admins to home
                }

            } catch (err) {
                console.error('Error checking admin status:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [user, router, redirectPath, setShowAuthModal, requireAdmin]);

    return { isLoading, isAuthorized, isAdmin };
}
