import Groq from 'groq-sdk';
import { ProfileData } from './schema';

const groq = new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || '',
    dangerouslyAllowBrowser: true, // Only for demo/prototype, should ideally be backend
});

export const extractProfileFromLinkedIn = async (linkedInJson: unknown): Promise<Partial<ProfileData>> => {
    const prompt = `
    You are an expert profile builder. Extract information from the following LinkedIn JSON data 
    and map it to the person's profile structure. 
    
    Structure:
    - fullName
    - tagline
    - profilePhoto (use pictureUrl if available)
    - aboutMe (use the 'summary' field if available)
    - expertiseAreas (up to 5, derive from content or skills)
    - topHighlights (3 key achievements from the headline or bio)
    - professionalTitle
    - children: [{ name, role, duration }] -> Map this to 'brands' or 'positions'
    - positions: [{ title, company, location, duration, description, logo }]
    - education: [{ schoolName, degreeName, fieldOfStudy, duration }]
    - skills: [string]
    - socialLinks: { linkedin, website }
    
    JSON Data:
    ${JSON.stringify(linkedInJson)}
    
    Return ONLY a valid JSON object matching the ProfileData structure (Partial).
  `;

    try {
        const response = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error extracting LinkedIn profile:', error);
    }
    return {};
};

export const getAiChatResponse = async (
    messages: { text: string; sender: 'user' | 'bot' }[],
    currentProfileData: Partial<ProfileData>
): Promise<{ text: string; updatedData?: Partial<ProfileData> }> => {
    const prompt = `
    You are "ProfileArchitect", an interactive AI personal profile creator. 
    We are building a professional profile based on specific sections:
    1. Basic Information (Name, About, Tagline)
    2. Personal Story & Strengths (Personal story line, Story type, Expertise)
    3. Social Media & Online Presence
    4. Brands & Work Experience
    5. Impact Created
    6. Awards & Recognition
    
    Current gathered data:
    ${JSON.stringify(currentProfileData)}
    
    Recent Chat History:
    ${JSON.stringify(messages.slice(-5))}
    
    Rules:
    - Don't be robotic. Be interactive and conversational.
    - Analyze the current data to see what is missing or needs refinement.
    - Ask for missing fields one or two at a time.
    - If the user provides info, acknowledge it and update the profile data.
    - You MUST return a JSON object with two fields:
      1. "text": Your message to the user.
      2. "updatedData": Any new profile fields you extracted from the user's latest message (optional).
    
    Return ONLY a valid JSON object.
  `;

    try {
        const response = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error getting AI chat response:', error);
    }
    return { text: "I'm sorry, I'm having trouble processing that right now." };
};
