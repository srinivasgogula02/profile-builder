'use server';

import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createGatewayProvider } from '@ai-sdk/gateway';
import { ProfileData, ProfileSchema } from './schema';
import { buildSystemPrompt, detectCurrentSection, computeSectionProgress } from './ai-prompt';

// Configuration from environment variables
const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_MODEL = process.env.AI_MODEL || ''; // Leave empty to use provider specific defaults

// Provider-specific names/models
const VERCEL_MODEL = (process.env.vercel_AI_MODEL || 'gemini-1.5-flash').trim();
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Provider-specific API keys
const groqKey = (process.env.GROQ_API_KEY || '').trim();
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
    const prompt = `You are an elite personal branding strategist extracting LinkedIn profile data into a professional one-pager profile.

CRITICAL RULES — follow these EXACTLY:

═══ SECTION 1A: IDENTITY (first impression — must hook instantly) ═══
- "fullName": Display name. MAX 30 characters. Use the name as-is, do NOT modify.
- "tagline": LinkedIn headline. MAX 70 characters. Make it magnetic — should make someone stop scrolling.
  If headline is generic (e.g., "Open to opportunities"), rewrite using their actual role + impact.
- "profilePhoto": Extract the primary profile picture URL. 
  EXTRACTION LOGIC — **EXTREMELY AGGRESSIVE**: Scan the ENTIRE source JSON for any field containing a URL. Prioritize URLs found in keys like "profile_pic_url", "pictureUrl", "profile_pic", "image_url", "photo_url", "profile_image", "avatar", or "landscape_photo". 
  If multiple URLs exist, pick the highest resolution one. If missing, leave empty — never invent a URL.
  NOTE: LinkedIn URLs are often very long and contain many parameters — extract the FULL URL.
- "topHighlights": EXACTLY 3 key achievement lines. MAX 35 characters each. These are HOOKS.
  EXTRACTION LOGIC — scan the entire profile for:
    • Numbers and metrics (10,000+, 500+, 15 years, ₹50Cr)
    • Titles and roles (Trainer, Speaker, Consultant, CFO)
    • Keywords (Award-winning, Certified, Expert, Published)
  If LinkedIn data has fewer than 3 clear achievements, synthesize from positions/summary.
  Examples: "Trained 15,000+ Professionals", "Virtual CFO | Growth Strategist", "Built 0 to ₹50Cr Revenue"
- "professionalTitle": Professional qualifications (CA, CS, MBA, CFA). MAX 35 characters.
  Extract from headline, certifications, or education. If none found, derive from job titles.

═══ SECTION 1B: PERSONAL STORY & STRENGTHS ═══
- "aboutMe": 3-4 powerful sentences from the LinkedIn summary/about section.
  Apply the "SO WHAT?" test — every sentence must answer "Why should someone care?"
  If summary is too long, condense. If too short or missing, synthesize from positions + skills.
  Cover: past experience, present role, key companies, what they're known for.
- "personalStory30": One powerful line (max 30 words) about their journey. This is an elevator pitch.
  RECOVERY LOGIC: If not explicitly found, you MUST craft a compelling narrative based on their career trajectory (e.g., "From [early role] to [current achievement] — dedicated to [core mission]").
- "expertiseAreas": Up to 5 core areas. MAX 3 words each (e.g., "Finance Strategy", "Business Training").
  Extract from LinkedIn skills, headline, and summary. Prefer specific over generic.
  "Business Consulting" is weak → "Growth Strategy Consulting" is better.
- "expertiseDescriptions": Array of strings corresponding to expertiseAreas. MAX 35 chars each.
  Briefly explain what they do or solve in that area. Example: "Scaling startups to 10x revenue" or "Optimizing tax compliance".
- "certifications": Extract any certifications listed.
- "technicalSkills": Extract technical tools/software (Excel, SAP, Tally, etc.).
- "achievements": Up to 5 key milestones. Extract from summary, honors, or position descriptions.

═══ SECTION 2: SOCIAL MEDIA & LINKS ═══
- "socialLinks": { linkedin (REQUIRED), website, instagram, twitter, facebook, youtube, companyWebsite }
  Extract ALL URLs found in the profile (contact info, websites section, bio links).
  LinkedIn URL is mandatory — construct from username if needed.
  NEVER invent URLs — only extract what exists in the data.

═══ SECTION 3: BRANDS & WORK EXPERIENCE ═══
- "positions": Array of { title (MAX 40 chars), company (MAX 25 chars), location, duration, description (MAX 100 chars), logo }
  Include ALL positions from LinkedIn. Order by recency (newest first).
  If description is too long, condense to the most impactful 1-2 sentences.
  If a position has no description, leave it empty — don't fabricate.
- "brands": [{ name (MAX 25 chars), role, duration }] — derive from positions/companies.
- "education": [{ schoolName (MAX 40 chars), degreeName, fieldOfStudy, duration }]
- "skills": Array of short skill strings from LinkedIn skills section.

═══ SECTION 4: IMPACT ═══
- "impactHeadline": One-line impact statement (MAX 50 chars). Derive from summary/headline.
- "impactStory": A brief narrative of their professional impact (MAX 100 words).

═══ SECTION 5: AWARDS ═══
- "awards": [{ title, organization, year }] — from LinkedIn honors & awards section.
  If no awards section exists, leave as empty array.

═══ SECTION 6: CONTACT ═══
- "contact": { emailPrimary, phonePrimary } — ONLY if present in LinkedIn data.
  NEVER invent contact details.

═══ EDGE CASES ═══
- If a field is completely missing from LinkedIn data, omit it from the output.
- If the summary/about is empty, synthesize "aboutMe" from position descriptions.
- If headline is generic, rewrite it to be impactful based on actual experience.
- If no profile photo URL exists, omit "profilePhoto" entirely.
- If positions have company logos, include the logo URL.
- Handle non-English characters correctly (names, companies).
- If LinkedIn data is minimal (e.g., only name + 1 position), still produce the best possible output.
- Always use POWER VERBS: Led, Built, Launched, Transformed, Scaled, Pioneered.
- QUANTIFY IMPACT wherever the data supports it.

JSON Data:
${JSON.stringify(linkedInJson)}

Return ONLY a valid JSON object. No markdown wrapping, no explanations.`;

    // ── Deterministic extraction of critical fields from raw scraper JSON ──
    // These fields are too important to leave to AI interpretation (long URLs get truncated)
    const deterministic: Partial<ProfileData> = {};
    try {
        const raw = linkedInJson as Record<string, unknown>;
        // The scraper wraps data in { success, data: [ profile ] }
        const profile = Array.isArray(raw.data) ? (raw.data[0] as Record<string, unknown>) : raw;

        // Profile photo — extract the highest-res version
        const pictureUrl = (profile.pictureUrl || profile.profile_pic_url || profile.profilePicUrl || '') as string;
        if (pictureUrl && typeof pictureUrl === 'string' && pictureUrl.startsWith('http')) {
            // Try to get a higher-res version by adjusting the LinkedIn URL
            const highRes = pictureUrl
                .replace(/scale_100_100/, 'scale_400_400')
                .replace(/scale_200_200/, 'scale_400_400');
            deterministic.profilePhoto = highRes;
        }

        // LinkedIn URL — construct from publicIdentifier if available
        const publicId = (profile.publicIdentifier || profile.public_id || '') as string;
        if (publicId) {
            deterministic.socialLinks = {
                ...(deterministic.socialLinks || {}),
                linkedin: `https://www.linkedin.com/in/${publicId}/`,
            };
        }

        // YouTube — extract from creatorInfo if available
        const creatorInfo = profile.creatorInfo as Record<string, unknown> | undefined;
        if (creatorInfo?.website) {
            const website = creatorInfo.website as Record<string, unknown>;
            const attrs = website.attributesV2 as Array<Record<string, unknown>> | undefined;
            if (attrs) {
                for (const attr of attrs) {
                    const detail = attr.detailData as Record<string, unknown> | undefined;
                    if (detail?.hyperlink && typeof detail.hyperlink === 'string') {
                        if (detail.hyperlink.includes('youtube.com')) {
                            deterministic.socialLinks = {
                                ...(deterministic.socialLinks || {}),
                                youtube: detail.hyperlink,
                            };
                        } else if (!detail.hyperlink.includes('linkedin.com')) {
                            deterministic.socialLinks = {
                                ...(deterministic.socialLinks || {}),
                                website: detail.hyperlink,
                            };
                        }
                    }
                }
            }
        }

        // Company website from current company
        const companyUrl = (profile.companyLinkedinUrl || '') as string;
        if (companyUrl) {
            deterministic.socialLinks = {
                ...(deterministic.socialLinks || {}),
                companyWebsite: companyUrl,
            };
        }
    } catch (e) {
        console.warn('Deterministic field extraction had an issue:', e);
    }

    try {
        const result = streamText({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
        });

        const fullText = await result.text;
        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '').trim();
            let parsed: unknown;
            try {
                parsed = JSON.parse(cleanText);
            } catch {
                console.error('AI returned invalid JSON for LinkedIn extraction');
                return deterministic; // At least return deterministic fields
            }
            // Validate against schema — strip unknown fields, coerce types
            const validated = ProfileSchema.partial().safeParse(parsed);
            let aiData: Partial<ProfileData> = {};
            if (validated.success) {
                aiData = validated.data;
            } else {
                console.warn('AI LinkedIn data failed schema validation:', validated.error.issues);
                // Fallback: return raw parse but strip __proto__ for safety
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    delete (parsed as Record<string, unknown>)['__proto__'];
                    delete (parsed as Record<string, unknown>)['constructor'];
                    aiData = parsed as Partial<ProfileData>;
                }
            }

            // Merge: AI data first, then deterministic fields override where they exist
            // This ensures the AI's creative work is kept, but critical URLs are guaranteed
            const merged = { ...aiData };

            // Profile photo: prefer deterministic extraction (AI often truncates long URLs)
            if (deterministic.profilePhoto) {
                merged.profilePhoto = deterministic.profilePhoto;
            }

            // Social links: merge deterministic into AI's, preserving AI-found links
            if (deterministic.socialLinks) {
                merged.socialLinks = {
                    ...(aiData.socialLinks || {}),
                    ...deterministic.socialLinks,
                };
            }

            return merged;
        }
    } catch (error) {
        console.error('Error extracting LinkedIn profile:', error);
    }
    return deterministic; // Return at least deterministic fields if AI fails entirely
};

// ─── Profile Data Polishing ──────────────────────────────────────────────────
export const polishProfileData = async (data: Partial<ProfileData>): Promise<Partial<ProfileData>> => {
    const prompt = `You are an elite personal branding strategist and professional copywriter. Polish this profile data for a single A4 page.

POLISHING PRINCIPLES:
1. "SO WHAT?" TEST: Every sentence must answer "Why should someone care?" If it doesn't, rewrite it.
2. POWER VERBS: Replace passive language with action verbs (Led, Built, Launched, Transformed, Scaled, Pioneered).
3. QUANTIFY IMPACT: "Helped businesses grow" → "Helped 200+ businesses achieve 3x growth."
4. MIRROR TONE: Formal for CAs/lawyers. Bold for entrepreneurs. Creative for designers.
5. PRESERVE FACTS: Enhance presentation, never invent new information.

STRICT CHARACTER LIMITS (NEVER exceed):
- "fullName": MAX 30 characters
- "tagline": MAX 70 characters. Must be magnetic — should make someone stop scrolling.
- "topHighlights": EXACTLY 3 lines, MAX 30 characters each. These are HOOKS — first thing people see.
  Must include numbers/metrics where possible. Weak: "Business Expert" → Strong: "Scaled 3 Companies to ₹50Cr+"
- "professionalTitle": MAX 35 characters
- "expertiseAreas": MAX 3 words per area, up to 5 areas. Be specific, not generic.
- "expertiseDescriptions": MAX 35 characters per description. Explains the value/impact of the expertise.
- "aboutMe": 3-4 powerful sentences. Apply "So What?" test to every line.
- "personalStory30": One powerful sentence, max 30 words. The elevator pitch.
- Positions "title": MAX 40 chars, "company": MAX 25 chars, "description": MAX 100 chars
- "impactHeadline": MAX 50 characters

EDGE CASES:
- If topHighlights are weak or generic, strengthen them with numbers and power verbs from the profile data.
- If aboutMe is too long, condense to the 3-4 most impactful sentences.
- If aboutMe is too short, expand using data from positions and achievements.
- If tagline is generic ("Entrepreneur"), make it specific ("Serial Entrepreneur | Built 3 Companies to ₹50Cr+").
- If expertise areas are generic, make them industry-specific.
- NEVER modify contact details, social links, or profile photo URLs.
- NEVER invent new facts, awards, or metrics not present in the data.
- If a field is empty/missing, leave it as-is — don't fill it with generic content.
- Handle positions with missing descriptions gracefully — polish only what exists.
- Ensure all arrays maintain their original length (don't add or remove items).
- **STRICT REQUIREMENT**: Return ALL fields present in the input JSON, even if they were not modified or polished. NEVER drop fields like "profilePhoto", "socialLinks", or "contact". If "profilePhoto" is a URL, preserve it EXACTLY as-is.

Input Data:
${JSON.stringify(data, null, 2)}

Return ONLY the polished JSON object. No markdown, no explanations.`;

    try {
        const result = await streamText({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
        });

        const fullText = await result.text;
        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '').trim();
            let parsed: unknown;
            try {
                parsed = JSON.parse(cleanText);
            } catch {
                console.error('AI returned invalid JSON for polishing');
                return data;
            }
            const validated = ProfileSchema.partial().safeParse(parsed);
            if (validated.success) {
                return validated.data;
            }
            console.warn('AI polished data failed schema validation:', validated.error.issues);
            // Fallback to original data
        }
    } catch (error) {
        console.error('Error polishing profile data:', error);
    }
    return data; // Return original data if polishing fails
};

// ── Section-specific guidance from Personal Profile Builder v2 ────────────────
const SECTION_GUIDANCE: Record<string, string> = {
    identity: `This is the IDENTITY section — the first thing people see.
- "fullName": Display name, MAX 30 characters
- "professionalTitle": Qualifications like "CA, CS, MBA, CFA", MAX 35 characters
- "topHighlights": Exactly 3 key achievement lines, MAX 35 chars each. These are HOOKS — they must grab attention instantly.
  Examples: "Trained 15,000+ Business Owners", "Virtual CFO | Startup Strategist", "Helped 500+ Startups with Compliance"
  Look for: Numbers/metrics, Titles/roles, Keywords (Award-winning, Certified, Expert)
- "tagline": LinkedIn headline style, MAX 70 characters. Make it magnetic — should make someone stop scrolling.
RULE: Use POWER VERBS (Led, Built, Launched, Transformed, Scaled, Pioneered). QUANTIFY IMPACT where possible.`,

    story: `This is the STORY section — About Me + Personal Story.
- "aboutMe": 3-4 powerful sentences covering past experience, present role, companies worked with, passions, achievements, and what they want to be known for. Apply the "SO WHAT?" test — every sentence must answer "Why should someone care?"
- "personalStory30": One powerful line (30 words) about their journey. This is the elevator pitch.
  Examples:
  "From son of a farmer to the CEO of a 50-crore company — building businesses that make a difference."
  "Started with ₹10,000 savings, now helping 1000+ businesses achieve their financial goals."
  "Left a cushy corporate job to follow my passion — never looked back since 2015."
RULE: Match the user's professional tone. Formal for CAs/lawyers. Bold for entrepreneurs.`,

    expertise: `This is the EXPERTISE section — core skills and professional credentials.
- "expertiseAreas": Up to 5 core expertise areas, MAX 3 words each (e.g., "Training", "Finance Strategy", "Digital Marketing")
- "expertiseDescriptions": MAX 35 chars per description. Explains the value/impact of the expertise.
RULE: Be specific and impactful. "Business Consulting" is generic → "Growth Strategy Consulting" is better.`,

    career: `This is the CAREER & BRANDS section — focusing on work experience and brands worked with.
- "positions": Array of { title, company, location, duration, description, logo }
  This is the primary way to show "Brands Worked". If a company has a logo URL, include it.
- "brands": [{ name, role, duration }] — another way to store brand associations.
RULE: Emphasize brand association and roles. Order by recency.`,

    links: `This is the LINKS section — social media and online presence.
- "socialLinks": Object with linkedin (primary, required), website, instagram, twitter, facebook, youtube, companyWebsite
  LinkedIn is the most important professional link. A personal website adds credibility.
RULE: Only clean up URL formatting, don't invent URLs.`,

    contact: `This is the CONTACT section — how people reach the user.
- "contact": Object with emailPrimary and phonePrimary
RULE: Never modify contact details — just ensure formatting is clean. Don't edit contact info.`,

    impact: `This is the IMPACT section — showcasing professional impact and outreach.
- "impactHeadline": A punchy one-liner about the user's impact (MAX 50 characters).
- "impactStory": A brief narrative or list of achievements (MAX 1000 characters).
- "professionSpecificImpact": A record of impact metrics (e.g., { "Revenue Growth": "30%", "Team Built": "50+ people" }).
RULE: Use numbers and metrics. Quantify everything.`,

    awards: `This is the AWARDS & RECOGNITION section.
- "awards": Array of { title, organization, year, image }
- "mediaFeatures": Array of { name, url }
RULE: List honors and media coverage. Keep titles concise.`,
};

// ── Enhance a specific profile section with AI ────────────────────────────────
export const enhanceProfileSection = async (
    sectionId: string,
    profileData: Partial<ProfileData>,
    instructions?: string
): Promise<Partial<ProfileData>> => {
    const guidance = SECTION_GUIDANCE[sectionId] || '';

    const prompt = `You are an elite personal branding strategist. Enhance ONLY the fields relevant to the section below.

SECTION CONTEXT:
${guidance}

FULL PROFILE DATA (for context, do NOT modify fields outside this section):
${JSON.stringify(profileData, null, 2)}

${instructions ? `USER INSTRUCTIONS / FEEDBACK:
"${instructions}"` : ''}

RULES:
1. Return a JSON object with ONLY the fields that belong to this section, enhanced.
2. PRESERVE all facts — enhance presentation, never invent new information.
3. Use power verbs: Led, Built, Launched, Transformed, Scaled, Pioneered.
4. Quantify impact where possible: "Helped businesses" → "Helped 200+ businesses achieve 3x growth."
5. Respect ALL character limits specified above.
6. Return ONLY valid JSON, no markdown, no explanations.`;

    try {
        const result = await streamText({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
        });

        const fullText = await result.text;
        if (fullText) {
            const cleanText = fullText.replace(/```json\n?|\n?```/g, '').trim();
            let parsed: unknown;
            try {
                parsed = JSON.parse(cleanText);
            } catch {
                console.error('AI returned invalid JSON for section enhancement');
                return {};
            }
            const validated = ProfileSchema.partial().safeParse(parsed);
            if (validated.success) {
                return validated.data;
            }
            console.warn('AI section enhancement failed schema validation:', validated.error.issues);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Partial<ProfileData>;
            }
        }
    } catch (error) {
        console.error('Error enhancing profile section:', error);
    }
    return {};
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
            let parsed: Record<string, unknown>;
            try {
                parsed = JSON.parse(cleanText);
            } catch {
                return { text: fullText };
            }

            // Validate the text field
            const responseText = typeof parsed.text === 'string' ? parsed.text : "I didn't quite catch that. Could you try rephrasing?";

            // Validate updatedData against schema if present
            let validatedUpdate: Partial<ProfileData> | undefined;
            if (parsed.updatedData && typeof parsed.updatedData === 'object') {
                const result = ProfileSchema.partial().safeParse(parsed.updatedData);
                if (result.success) {
                    validatedUpdate = result.data;
                } else {
                    console.warn('AI updatedData failed validation:', result.error.issues);
                }
            }

            // Validate suggestedReplies is an array of strings
            const suggestedReplies = Array.isArray(parsed.suggestedReplies)
                ? parsed.suggestedReplies.filter((r): r is string => typeof r === 'string').slice(0, 5)
                : [];

            const progress = computeSectionProgress({
                ...currentProfileData,
                ...(validatedUpdate || {}),
            });

            return {
                text: responseText,
                updatedData: validatedUpdate,
                suggestedReplies,
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
