import { NextRequest, NextResponse } from 'next/server';
import { refineTemplateWithAI } from '@/app/lib/ai-refine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { html, instructions } = body;

        if (!html) {
            return NextResponse.json(
                { error: 'Missing html content' },
                { status: 400 }
            );
        }

        const refinedHtml = await refineTemplateWithAI({ html, instructions });
        return NextResponse.json({ html: refinedHtml });

    } catch (error) {
        console.error('Error processing AI refinement:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
