import { NextRequest, NextResponse } from 'next/server';
import { modifyTemplateWithAI } from '@/app/lib/ai-edit';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { html, prompt, userData } = body;

        if (!html || !prompt) {
            return NextResponse.json(
                { error: 'Missing html or prompt' },
                { status: 400 }
            );
        }

        const modifiedHtml = await modifyTemplateWithAI({ html, prompt, userData });
        return NextResponse.json({ html: modifiedHtml });

    } catch (error) {
        console.error('Error processing AI edit:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
