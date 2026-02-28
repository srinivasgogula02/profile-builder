import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const AMOUNT_PAISE = 9900; // ₹99 in paise
const CURRENCY = 'INR';

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

        // ── Idempotency: already paid? ────────────────────────────────────────
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_premium, payment_id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profile?.is_premium) {
            return NextResponse.json({ already_paid: true });
        }

        // ── Create Razorpay order ─────────────────────────────────────────────
        const order = await razorpay.orders.create({
            amount: AMOUNT_PAISE,
            currency: CURRENCY,
            receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
            notes: { user_id: user.id },
        });

        return NextResponse.json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });
    } catch (err: any) {
        console.error('[create-order] error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
