import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { mobile } = await req.json();

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
