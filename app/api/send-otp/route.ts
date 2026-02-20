import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (Note: resets on Vercel cold starts)
const rateLimitMap = new Map<string, { count: number, lastSent: number }>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(req: NextRequest) {
    try {
        const { mobile } = await req.json();

        // Rate limiting check
        // Get IP. Fallback to a default if running locally without proxies
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const key = `${ip}-${mobile}`;

        const now = Date.now();
        const record = rateLimitMap.get(key) || { count: 0, lastSent: now };

        // Reset count if window has passed
        if (now - record.lastSent > WINDOW_MS) {
            record.count = 1;
        } else {
            record.count += 1;
        }

        record.lastSent = now;
        rateLimitMap.set(key, record);

        if (record.count > MAX_ATTEMPTS) {
            return NextResponse.json(
                { error: "Too many requests. Please try again in a minute." },
                { status: 429 }
            );
        }

        // Validate: exactly 10 digits
        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return NextResponse.json(
                { error: "Please enter a valid 10-digit mobile number." },
                { status: 400 },
            );
        }

        const authKey = process.env.MSG91_AUTHKEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;
        const countryCode = process.env.MSG91_COUNTRY_CODE || "91";

        if (!authKey || !templateId) {
            console.error("MSG91 env vars missing");
            return NextResponse.json(
                { error: "OTP service is not configured." },
                { status: 500 },
            );
        }

        const res = await fetch(
            `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${countryCode}${mobile}&authkey=${authKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
        );

        const data = await res.json();

        if (data.type === "success" || data.type === "SUCCESS") {
            return NextResponse.json({ success: true, message: "OTP sent successfully." });
        }

        return NextResponse.json(
            { error: data.message || "Failed to send OTP." },
            { status: 400 },
        );
    } catch (err) {
        console.error("send-otp error:", err);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 },
        );
    }
}
