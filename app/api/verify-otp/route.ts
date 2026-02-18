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
        const password = shadowPassword(mobile);

        // Try sign in first
        const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({ email, password });

        if (signInData?.session) {
            return NextResponse.json({
                success: true,
                session: signInData.session,
            });
        }

        // Sign-in failed → sign up (new user)
        const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `Mobile User ${mobile}`,
                        phone: mobile,
                        is_mobile_user: true,
                    },
                },
            });

        if (signUpError) {
            console.error("Shadow signup error:", signUpError);
            return NextResponse.json(
                { error: "Could not create your account. Please try again." },
                { status: 500 },
            );
        }

        // With email confirmation disabled, signUp returns a session directly
        if (signUpData?.session) {
            return NextResponse.json({
                success: true,
                session: signUpData.session,
            });
        }

        // Edge case: signup succeeded but no session (shouldn't happen with
        // email confirmation off). Try signing in immediately.
        const { data: retryData, error: retryError } =
            await supabase.auth.signInWithPassword({ email, password });

        if (retryError || !retryData?.session) {
            console.error("Shadow retry login error:", retryError);
            return NextResponse.json(
                { error: "Account created but login failed. Please try again." },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            session: retryData.session,
        });
    } catch (err) {
        console.error("verify-otp error:", err);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 },
        );
    }
}
