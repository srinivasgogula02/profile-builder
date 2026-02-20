import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (uses anon key; email confirmation is disabled)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function shadowEmail(mobile: string) {
    return `${mobile}@mobile.oneasy.com`;
}

function shadowPassword(mobile: string) {
    return `ComplexSecret#${mobile}`;
}

export async function POST(req: NextRequest) {
    try {
        const { mobile, otp } = await req.json();

        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return NextResponse.json(
                { error: "Invalid mobile number." },
                { status: 400 },
            );
        }

        if (!otp || !/^\d{4,6}$/.test(otp)) {
            return NextResponse.json(
                { error: "Invalid OTP." },
                { status: 400 },
            );
        }

        // ── Step 1: Verify OTP via MSG91 ──────────────────────────────────
        const authKey = process.env.MSG91_AUTHKEY;
        const countryCode = process.env.MSG91_COUNTRY_CODE || "91";

        if (!authKey) {
            return NextResponse.json(
                { error: "OTP service is not configured." },
                { status: 500 },
            );
        }

        const verifyRes = await fetch(
            `https://control.msg91.com/api/v5/otp/verify?mobile=${countryCode}${mobile}&otp=${otp}&authkey=${authKey}`,
            { method: "POST" },
        );

        const verifyData = await verifyRes.json();

        if (verifyData.type !== "success" && verifyData.type !== "SUCCESS") {
            return NextResponse.json(
                { error: verifyData.message || "OTP verification failed." },
                { status: 400 },
            );
        }

        // ── Step 2: Shadow account login/signup in Supabase ──────────────
        const email = shadowEmail(mobile);

        // Generate a cryptographically strong random password for this session
        const randomPassword = require('crypto').randomBytes(32).toString('hex') + 'A1!';

        // Create an admin client to securely manage the user
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Try to fetch existing user
        const { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
        let user = users?.find((u) => u.email === email);

        if (user) {
            // Update their password to the new random one
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                user.id,
                { password: randomPassword }
            );

            if (updateError) {
                console.error("Failed to update shadow password:", updateError);
                return NextResponse.json(
                    { error: "Login failed during security update. Please try again." },
                    { status: 500 },
                );
            }
        } else {
            // Create the user with the random password
            const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: randomPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: `Mobile User ${mobile}`,
                    phone: mobile,
                    is_mobile_user: true,
                }
            });

            if (signUpError) {
                console.error("Shadow signup error:", signUpError);
                return NextResponse.json(
                    { error: "Could not create your account. Please try again." },
                    { status: 500 },
                );
            }
        }

        // 2. Now sign in through the client api to get a real session
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: randomPassword
        });

        if (signInError || !sessionData?.session) {
            console.error("Sign in with dynamic password failed:", signInError);
            return NextResponse.json(
                { error: "Login failed after verification. Please try again." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            session: sessionData.session,
        });
    } catch (err) {
        console.error("verify-otp error:", err);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 },
        );
    }
}
