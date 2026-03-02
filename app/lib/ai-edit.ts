import { streamText, generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGatewayProvider } from '@ai-sdk/gateway';

// Configuration from environment variables (reusing logic from groq.ts)
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_MODEL = process.env.AI_MODEL || '';

const groqKey = (process.env.GROQ_API_KEY || '').trim();
const googleKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();
const vercelKey = (process.env.vercel_AI_API_KEY || '').trim();
const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

const groq = createGroq({ apiKey: groqKey });
const google = createGoogleGenerativeAI({ apiKey: googleKey });
const openai = createOpenAI({ apiKey: openaiKey });
const vercelGateway = createGatewayProvider({ apiKey: vercelKey });

const getModel = () => {
    // Simplified model getter, similar to groq.ts but focused on what we need here
    const provider = AI_PROVIDER.toLowerCase();
    const modelPreference = AI_MODEL || '';

    if (provider === 'vercel') {
        return vercelGateway(modelPreference || 'google-generative-ai/gemini-1.5-pro');
    }
    switch (provider) {
        case 'google': return google(modelPreference || 'gemini-1.5-flash');
        case 'openai': return openai(modelPreference || 'gpt-4o');
        case 'groq': default: return groq(modelPreference || 'llama-3.3-70b-versatile');
    }
};

const SYSTEM_PROMPT = `You are an expert HTML and Handlebars developer.
Your task is to modify HTML templates based on user instructions.
The templates use Handlebars syntax (e.g., {{fullName}}) for dynamic data.

RULES:
1. Retain existing Handlebars placeholders unless explicitly asked to remove/replace them.
2. Return ONLY the valid, complete HTML. No markdown code blocks, no explanations.
3. Ensure the HTML structure remains valid.
4. If the user asks to add a section, match the existing design aesthetic (classes, inline styles).
5. Do NOT hallucinate new data if placeholders exist; reuse {{variable}} names if appropriate.
`;

export async function modifyTemplateWithAI(inputs: {
    html: string;
    prompt: string;
    userData?: any;
}) {
    const { html, prompt } = inputs;

    const userMessage = `
    CURRENT HTML:
    ${html}

    USER INSTRUCTION:
    ${prompt}

    Modify the HTML according to the instruction.
    `;

    try {
        const result = await generateText({
            model: getModel(),
            system: SYSTEM_PROMPT,
            prompt: userMessage,
        });

        let modifiedHtml = result.text;
        // Clean up markdown if present
        modifiedHtml = modifiedHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');
        return modifiedHtml;

    } catch (error) {
        console.error("Error in modifyTemplateWithAI:", error);
        throw error;
    }
}

const SYNC_SYSTEM_PROMPT = `You are an expert data parsing AI.
Your task is to compare a modified HTML string (which has been visually edited by a user) against the original JSON data object that populated it.
Identify any text that the user has changed in the HTML, and update the corresponding keys in the JSON data object perfectly.

RULES:
1. Return ONLY a valid JSON object. No markdown, no explanations, no code blocks (e.g., do NOT wrap in \`\`\`json).
2. The JSON keys MUST exactly match the keys in the provided original JSON data. Do not invent new keys.
3. If the user changed a name, update "fullName". If they changed a paragraph, update "aboutMe", etc.
4. If no meaningful text changes are detected, just return the original JSON data.
`;

export async function syncTemplateDataWithAI(inputs: {
    html: string;
    currentData: any;
}) {
    const { html, currentData } = inputs;

    const userMessage = `
    ORIGINAL JSON DATA:
    ${JSON.stringify(currentData, null, 2)}

    MODIFIED HTML:
    ${html}

    Output the updated JSON object.
    `;

    try {
        const result = await generateText({
            model: getModel(),
            system: SYNC_SYSTEM_PROMPT,
            prompt: userMessage,
        });

        let jsonText = result.text.trim();
        // Clean markdown code blocks if the LLM ignores instructions
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error in syncTemplateDataWithAI:", error);
        throw error;
    }
}

