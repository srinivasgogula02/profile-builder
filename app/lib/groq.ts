'use server';

import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGatewayProvider } from '@ai-sdk/gateway';
import { ProfileData } from './schema';
import { buildSystemPrompt, detectCurrentSection, computeSectionProgress } from './ai-prompt';

// Configuration from environment variables
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_MODEL = process.env.AI_MODEL || ''; // Leave empty to use provider specific defaults

// Provider-specific names/models
const VERCEL_MODEL = (process.env.vercel_AI_MODEL || 'gemini-1.5-flash').trim();
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Provider-specific API keys
const groqKey = (process.env.NEXT_PUBLIC_GROQ_API_KEY || '').trim();
const googleKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();
const vercelKey = (process.env.vercel_AI_API_KEY || '').trim();
const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

// Initialize providers
const groq = createGroq({ apiKey: groqKey });
const google = createGoogleGenerativeAI({ apiKey: googleKey });
const openai = createOpenAI({ apiKey: openaiKey });
const vercelGateway = createGatewayProvider({
    apiKey: vercelKey,
});

/**
 * Get the appropriate model based on AI_PROVIDER and AI_MODEL env vars
 */
const getModel = () => {
    const provider = AI_PROVIDER.toLowerCase();
    const modelPreference = AI_MODEL || '';

    if (provider === 'vercel') {
        const baseModel = modelPreference || VERCEL_MODEL;
        // If the model already specifies a provider (e.g. 'anthropic/claude'), use it directly
        if (baseModel.includes('/')) {
            console.log(`[AI] Vercel Gateway | Using specified model: ${baseModel}`);
            return vercelGateway(baseModel);
        }

        // Otherwise, guess provider prefix
        let fullModelId = '';
        if (baseModel.includes('gemini')) {
            fullModelId = `google-generative-ai/${baseModel}`;
        } else if (baseModel.includes('claude')) {
            fullModelId = `anthropic/${baseModel}`;
        } else if (baseModel.includes('llama')) {
            fullModelId = `groq/${baseModel}`;
        } else {
            fullModelId = `openai/${baseModel}`;
        }

        console.log(`[AI] Vercel Gateway | Guessed ID: ${fullModelId} for model: ${baseModel}`);
        return vercelGateway(fullModelId);
    }

    // Direct provider fallback
    switch (provider) {
        case 'google':
            console.log(`[AI] Google Direct | Model: ${modelPreference || 'gemini-1.5-flash'}`);
            return google(modelPreference || 'gemini-1.5-flash');
        case 'openai':
            console.log(`[AI] OpenAI Direct | Model: ${modelPreference || 'gpt-4o'}`);
            return openai(modelPreference || 'gpt-4o');
        case 'groq':
        default:
            console.log(`[AI] Groq Direct | Model: ${modelPreference || GROQ_MODEL}`);
            return groq(modelPreference || GROQ_MODEL);
    }
};

// ─── LinkedIn Profile Extraction ──────────────────────────────────────────────
export const extractProfileFromLinkedIn = async (linkedInJson: unknown): Promise<Partial<ProfileData>> => {
    const prompt = `You are an expert profile builder. Extract information from the following LinkedIn JSON data and map it to a professional profile structure.

Structure to fill (JSON only):
- fullName: Display name (MAX 30 characters)
- tagline: LinkedIn headline (MAX 70 characters)
- profilePhoto: pictureUrl if available
- aboutMe: summary field content (keep it to 3-4 powerful sentences)
- expertiseAreas: up to 5, each MAX 3 words
- topHighlights: exactly 3 key achievement lines (MAX 50 characters per line). Be extremely concise.
- professionalTitle: Professional qualifications (MAX 35 characters)
- positions: [{ title (MAX 40 chars), company (MAX 25 chars), location, duration, description (MAX 100 chars), logo }]
- education: [{ schoolName (MAX 40 chars), degreeName, fieldOfStudy, duration }]
- skills: array of short skill strings
- socialLinks: { linkedin, website }
- brands: [{ name (MAX 25 chars), role, duration }] — from positions/companies

JSON Data:
${JSON.stringify(linkedInJson)}

Return ONLY a valid JSON object matching the profile structure. Include only fields you can extract.`;

    try {
        const result = streamText({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
        });

        const fullText = await result.text;
        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '');
            return JSON.parse(cleanText);
        }
    } catch (error) {
        console.error('Error extracting LinkedIn profile:', error);
    }
    return {};
};

// ─── Profile Data Polishing ──────────────────────────────────────────────────
export const polishProfileData = async (data: Partial<ProfileData>): Promise<Partial<ProfileData>> => {
    const prompt = `You are an expert personal branding coach and professional copywriter.
Review the following professional profile data and "polish" it to make it more impactful, professional, and cohesive.

Guidelines:
1. Enhance the "About Me" section to be more engaging and professionally toned.
2. Refine the job descriptions in "positions" to focus on results and impact using action verbs.
3. Ensure the "tagline" is catchy and professional.
4. Clean up any grammatical errors or awkward phrasing.
5. LENGTH CONSTRAINT: 
   - "topHighlights": MAX 50 characters each line.
   - "tagline": MAX 70 characters.
   - "professionalTitle": MAX 35 characters.
   - "fullName": MAX 30 characters.
   - "expertiseAreas": MAX 3 words per area.
   - Positions "title": MAX 40 chars, "company": MAX 25 chars.
6. Maintain the original core information — do not invent new facts, just improve the presentation.
7. Return ONLY a valid JSON object matching the input structure.

Input Data:
${JSON.stringify(data, null, 2)}

Return ONLY the polished JSON object.`;

    try {
        const result = await streamText({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
        });

        const fullText = await result.text;
        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '');
            return JSON.parse(cleanText);
        }
    } catch (error) {
        console.error('Error polishing profile data:', error);
    }
    return data; // Return original data if polishing fails
};

// ─── Chat Response Types ──────────────────────────────────────────────────────
export interface AiChatResult {
    text: string;
    updatedData?: Partial<ProfileData>;
    suggestedReplies?: string[];
    sectionProgress?: Record<string, number>;
}

// ─── Interactive AI Chat ──────────────────────────────────────────────────────
export const getAiChatResponse = async (
    messages: { text: string; sender: 'user' | 'bot' }[],
    currentProfileData: Partial<ProfileData>
): Promise<AiChatResult> => {
    const currentSection = detectCurrentSection(currentProfileData);
    const systemPrompt = buildSystemPrompt(currentProfileData, currentSection);

    const chatHistory: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
    ];

    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
        chatHistory.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
        });
    }

    try {
        const result = streamText({
            model: getModel(),
            messages: chatHistory as any,
            temperature: 0.7,
        });

        const fullText = await result.text;

        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '');
            let parsed;
            try {
                parsed = JSON.parse(cleanText);
            } catch (e) {
                return { text: fullText };
            }

            const progress = computeSectionProgress({
                ...currentProfileData,
                ...(parsed.updatedData || {}),
            });

            return {
                text: parsed.text || "I didn't quite catch that. Could you try rephrasing?",
                updatedData: parsed.updatedData || undefined,
                suggestedReplies: parsed.suggestedReplies || [],
                sectionProgress: progress,
            };
        }
    } catch (error) {
        console.error('Error getting AI chat response:', error);
    }

    return {
        text: "I'm having a moment — could you try that again?",
        suggestedReplies: ["Let's continue", "Start over"],
    };
};
