
import { generateText } from 'ai';
import { createGatewayProvider } from '@ai-sdk/gateway';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { systemPrompt } from '@/app/lib/html-generator-prompt';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

// Reusing configuration from app/lib/groq.ts pattern
const vercelKey = (process.env.vercel_AI_API_KEY || '').trim();
const googleKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();

const vercelGateway = createGatewayProvider({
    apiKey: vercelKey,
});
const google = createGoogleGenerativeAI({ apiKey: googleKey });

function getModel(modelName: string) {
    if (vercelKey) {
        // Use Vercel Gateway if key exists
        return vercelGateway(`google/${modelName}`);
    } else {
        // Fallback to direct Google
        return google(modelName);
    }
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const { message, currentHtml } = await req.json();

        // Target model - favoring a stronger model for code generation
        const modelName = 'gemini-1.5-flash'; // or gemini-1.5-pro if available/needed

        console.log('[API] Generating design with message:', message);

        const constructedPrompt = `
            [CONTEXT: CURRENT HTML]
            ${currentHtml ? currentHtml : "None (New Profile)"}

            [USER INSTRUCTION]
            "${message}"

            [TASK]
            Based on the [USER INSTRUCTION] and [CONTEXT: CURRENT HTML], generate (or rewrite) the HTML profile.
            - If "CURRENT HTML" is provided, UPDATE it according to instructions. Retain content unless asked to change.
            - If "CURRENT HTML" is "None", create a brand new profile template.
            - Ensure all text is wrapped in tags with class="editable".
        `;

        const result = await generateText({
            model: getModel(modelName),
            system: systemPrompt,
            prompt: constructedPrompt,
            temperature: 0.7,
        });

        return new Response(JSON.stringify({ content: result.text }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('[API] Error generating design:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
