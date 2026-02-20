import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase with Service Role Key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { userId, phone } = await request.json();
        const SUPER_ADMIN_PHONE = '9347502455';

        if (!userId || !phone) {
            return NextResponse.json({ error: 'Missing userId or phone' }, { status: 400 });
        }

        // Verify phone matches Super Admin
        if (!phone.includes(SUPER_ADMIN_PHONE)) {
            return NextResponse.json({ error: 'Unauthorized: Not a super admin phone' }, { status: 403 });
        }

        console.log(`Bootstrapping admin for user ${userId} (${phone})...`);

        // Update profile with is_admin = true
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_admin: true })
            .eq('user_id', userId);

        if (error) {
            console.error('Bootstrap error:', error);
            // Check if error is due to missing column
            if (error.message.includes('column "is_admin" does not exist')) {
                return NextResponse.json({ error: 'Database schema missing "is_admin" column. Please run the migration script.' }, { status: 500 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Admin privileges granted' });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
