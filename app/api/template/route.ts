import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !/^temp-\d+$/.test(id)) {
        return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "app", "templates", id, "index.html");

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const html = fs.readFileSync(filePath, "utf-8");

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Frame-Options": "SAMEORIGIN",
        },
    });
}
