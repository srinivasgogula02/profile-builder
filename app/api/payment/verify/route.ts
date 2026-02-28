import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Parse body ────────────────────────────────────────────────────────
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });
        }

        // ── Verify HMAC-SHA256 signature ──────────────────────────────────────
        const keySecret = process.env.RAZORPAY_KEY_SECRET!;
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn('[verify] Signature mismatch for user:', user.id);
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // ── Mark user as premium ──────────────────────────────────────────────
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                is_premium: true,
                payment_id: razorpay_payment_id,
                paid_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (updateError) {
            console.error('[verify] DB update failed:', updateError.message);
            return NextResponse.json({ error: 'Payment verified but DB update failed' }, { status: 500 });
        }

        console.log(`[verify] User ${user.id} upgraded to premium via payment ${razorpay_payment_id}`);
        return NextResponse.json({ success: true, is_premium: true });
    } catch (err: any) {
        console.error('[verify] error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
