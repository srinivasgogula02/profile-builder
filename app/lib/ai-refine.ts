import { generateText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGatewayProvider } from '@ai-sdk/gateway';

// Configuration from environment variables
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_MODEL = process.env.AI_MODEL || ''; // Default handled in getModel

const groqKey = (process.env.GROQ_API_KEY || '').trim();
const googleKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();
const vercelKey = (process.env.vercel_AI_API_KEY || '').trim();
const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

const groq = createGroq({ apiKey: groqKey });
const google = createGoogleGenerativeAI({ apiKey: googleKey });
const openai = createOpenAI({ apiKey: openaiKey });
const vercelGateway = createGatewayProvider({ apiKey: vercelKey });

const getModel = () => {
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

const SYSTEM_PROMPT = `You are a Senior Frontend Developer expert in HTML, CSS (Tailwind), and Handlebars.
Your task is to REFINE the code quality of raw HTML templates provided by an admin.

CRITICAL DIRECTIVE:
You must NOT change the visual design, colors, or fonts unless explicitly requested.
Your goal is to make the EXISTING design work better technically, not to redesign it.

OBJECTIVES:
1. **Fix Structure**: Ensure valid semantic HTML5.
2. **Robustness & Sizing**:
    - Ensure content fits within the container / standard A4 dimensions.
    - Fix overflow issues.
    - Add \`box-sizing: border-box\` where needed.
3. **Responsiveness**: Ensure the template scales correctly without breaking layout.
4. **Handlebars Preservation**: You MUST preserve all existing Handlebars {{placeholders}} (e.g., {{fullName}}, {{email}}). Do NOT remove them.
5. **Tailwind Conversion**: If the user asks for "modern styling" or "Tailwind", ONLY THEN should you convert CSS to Tailwind. Otherwise, preserve existing styles if they work.

RULES:
- Return ONLY the raw HTML code. Do NOT output markdown code blocks (no \`\`\`html).
- Do NOT add any conversational text.
- If the user provides specific "Instructions", prioritize them over these defaults.
`;

export async function refineTemplateWithAI(inputs: {
    html: string;
    instructions?: string;
}) {
    const { html, instructions } = inputs;

    const userMessage = `
    RAW HTML TEMPLATE:
    ${html}

    SPECIFIC REFINEMENT INSTRUCTIONS (Optional):
    ${instructions || "Fix sizing, overflow, and HTML structure only. Keep the design exactly as is."}

    Please refine the code now.
    `;

    try {
        const result = await generateText({
            model: getModel(),
            system: SYSTEM_PROMPT,
            prompt: userMessage,
        });

        let refinedHtml = result.text;
        // Clean up markdown if present
        refinedHtml = refinedHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');
        return refinedHtml;

    } catch (error) {
        console.error("Error in refineTemplateWithAI:", error);
        throw error;
    }
}
