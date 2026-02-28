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
        // ── Read raw body for signature verification ───────────────────────────
        const rawBody = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // ── Verify webhook signature ──────────────────────────────────────────
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (expectedSignature !== signature) {
            console.warn('[webhook] Invalid signature — possible spoofing attempt');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(rawBody);
        const eventName: string = event.event;
        const paymentEntity = event.payload?.payment?.entity;

        console.log(`[webhook] Received event: ${eventName}`);

        // ── Handle payment.captured (fallback for missed verify calls) ────────
        if (eventName === 'payment.captured' && paymentEntity) {
            const userId = paymentEntity.notes?.user_id;
            const paymentId = paymentEntity.id;

            if (!userId) {
                console.warn('[webhook] payment.captured missing user_id in notes');
                return NextResponse.json({ received: true });
            }

            // Check if already premium (idempotency)
            const { data: existing } = await supabaseAdmin
                .from('profiles')
                .select('is_premium')
                .eq('user_id', userId)
                .maybeSingle();

            if (!existing?.is_premium) {
                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update({
                        is_premium: true,
                        payment_id: paymentId,
                        paid_at: new Date().toISOString(),
                    })
                    .eq('user_id', userId);

                if (error) {
                    console.error('[webhook] DB update failed:', error.message);
                } else {
                    console.log(`[webhook] User ${userId} marked premium via webhook`);
                }
            }
        }

        // ── Handle payment.failed (logging only) ──────────────────────────────
        if (eventName === 'payment.failed') {
            const userId = paymentEntity?.notes?.user_id;
            console.warn(`[webhook] payment.failed for user: ${userId}, reason: ${paymentEntity?.error_description}`);
        }

        // Always return 200 to Razorpay to acknowledge receipt
        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('[webhook] error:', err);
        // Return 200 anyway — Razorpay retries on non-200
        return NextResponse.json({ received: true });
    }
}
