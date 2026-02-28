import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProfileData } from './schema';
import type { User } from '@supabase/supabase-js';

export interface Message {
    text: string;
    sender: 'user' | 'bot';
    suggestedReplies?: string[];
    type?: 'text' | 'guided_step';
    sectionId?: string;
    stepData?: any; // To hold specific data for the step if needed
}

type ConversationPhase = 'greeting' | 'gathering' | 'refining' | 'complete';

interface ProfileState {
    profileData: Partial<ProfileData>;
    messages: Message[];
    isTyping: boolean;

    // Conversation intelligence
    currentSection: string;
    sectionProgress: Record<string, number>;
    conversationPhase: ConversationPhase;
    detectedProfession: string | null;

    // Auth
    user: User | null;
    showAuthModal: boolean;
    pendingAction: (() => void) | null;

    // Persistence
    hasCompletedLinkedIn: boolean;
    isSaving: boolean;
    profileLoaded: boolean;

    // Guided Review
    showGuidedReview: boolean;
    guidedReviewActive: boolean;
    currentGuidedStepIndex: number;
    guidedReviewStep: number;

    // Actions
    setProfileData: (data: Partial<ProfileData>) => void;
    mergeProfileData: (data: Partial<ProfileData>) => void;
    updateProfileField: (field: keyof ProfileData, value: unknown) => void;
    addMessage: (message: Message) => void;
    setIsTyping: (isTyping: boolean) => void;
    setCurrentSection: (section: string) => void;
    setSectionProgress: (progress: Record<string, number>) => void;
    setConversationPhase: (phase: ConversationPhase) => void;
    setDetectedProfession: (profession: string | null) => void;
    resetChat: () => void;
    setUser: (user: User | null) => void;
    setShowAuthModal: (show: boolean) => void;
    setPendingAction: (action: (() => void) | null) => void;
    setHasCompletedLinkedIn: (v: boolean) => void;
    setIsSaving: (v: boolean) => void;
    setProfileLoaded: (v: boolean) => void;
    setShowGuidedReview: (v: boolean) => void;
    setGuidedReviewActive: (v: boolean) => void;
    setCurrentGuidedStepIndex: (index: number) => void;
    setGuidedReviewStep: (step: number) => void;

    // Multi-profile state
    activeProfileId: string | null;
    profilesList: any[]; // we use any to avoid importing db.ts and causing circular deps
    setActiveProfileId: (id: string | null) => void;
    setProfilesList: (profiles: any[]) => void;
    loadChat: (profile: any) => void;
}

const INITIAL_PROFILE: Partial<ProfileData> = {
    fullName: '',
    expertiseAreas: [],
    expertiseDescriptions: [],
    topHighlights: [],
    achievements: [],
    socialLinks: {
        linkedin: '',
    },
    workExperienceType: 'Multiple',
    brands: [],
    contact: {
        emailPrimary: '',
        emailShow: true,
        phoneShow: true,
        whatsappShow: true,
        addressShow: true,
    },
};

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            profileData: { ...INITIAL_PROFILE },
            messages: [
                {
                    text: "Welcome! I'm here to help you build a profile that truly represents who you are and what you bring to the table. Let's start simple — what's your name and what do you do?",
                    sender: 'bot',
                    suggestedReplies: [
                        "I'm a business owner",
                        "I'm a working professional",
                        "I run my own practice",
                    ],
                },
            ],
            isTyping: false,

            // Conversation intelligence
            currentSection: 'section_1a',
            sectionProgress: {},
            conversationPhase: 'greeting',
            detectedProfession: null,

            // Auth
            user: null,
            showAuthModal: false,
            pendingAction: null,

            // Persistence
            hasCompletedLinkedIn: false,
            isSaving: false,
            profileLoaded: false,

            // Guided Review
            showGuidedReview: false,
            guidedReviewActive: false,
            currentGuidedStepIndex: 0,
            guidedReviewStep: 0, // Deprecated but kept for now

            // Actions
            setProfileData: (data) =>
                set(() => ({
                    profileData: { ...INITIAL_PROFILE, ...data },
                })),

            mergeProfileData: (data) =>
                set((state) => {
                    const merged = { ...state.profileData };

                    for (const [key, value] of Object.entries(data)) {
                        if (value === undefined || value === null) continue;

                        const existing = merged[key as keyof ProfileData];

                        // Deep merge objects (socialLinks, contact, focusBrand, etc.)
                        if (
                            typeof value === 'object' &&
                            !Array.isArray(value) &&
                            typeof existing === 'object' &&
                            !Array.isArray(existing) &&
                            existing !== null
                        ) {
                            (merged as Record<string, unknown>)[key] = { ...existing, ...value };
                        } else {
                            (merged as Record<string, unknown>)[key] = value;
                        }
                    }

                    return { profileData: merged };
                }),

            updateProfileField: (field, value) =>
                set((state) => ({
                    profileData: { ...state.profileData, [field]: value },
                })),

            addMessage: (message) =>
                set((state) => ({
                    messages: [...state.messages, message],
                })),

            setIsTyping: (isTyping) => set({ isTyping }),

            setCurrentSection: (section) => set({ currentSection: section }),

            setSectionProgress: (progress) => set({ sectionProgress: progress }),

            setConversationPhase: (phase) => set({ conversationPhase: phase }),

            setDetectedProfession: (profession) => set({ detectedProfession: profession }),

            resetChat: () => set({
                messages: [],
                profileData: { ...INITIAL_PROFILE },
                isTyping: false,
                currentSection: 'section_1a',
                sectionProgress: {},
                conversationPhase: 'greeting',
                detectedProfession: null,
                activeProfileId: null,
                hasCompletedLinkedIn: false,
            }),

            setUser: (user) => set({ user }),
            setShowAuthModal: (show) => set({ showAuthModal: show }),
            setPendingAction: (action) => set({ pendingAction: action }),
            setHasCompletedLinkedIn: (v) => set({ hasCompletedLinkedIn: v }),
            setIsSaving: (v) => set({ isSaving: v }),
            setProfileLoaded: (v) => set({ profileLoaded: v }),
            setShowGuidedReview: (v) => set({ showGuidedReview: v }),
            setGuidedReviewActive: (v) => set({ guidedReviewActive: v }),
            setCurrentGuidedStepIndex: (index) => set({ currentGuidedStepIndex: index }),
            setGuidedReviewStep: (step) => set({ guidedReviewStep: step }),

            // Multi-profile state
            activeProfileId: null,
            profilesList: [],
            setActiveProfileId: (id) => set({ activeProfileId: id }),
            setProfilesList: (profiles) => set({ profilesList: profiles }),
            loadChat: (profile) => {
                // Find existing messages or fallback to initial message if undefined/empty
                let loadedMessages = (profile.messages && profile.messages.length > 0)
                    ? profile.messages
                    : [
                        {
                            text: "Welcome! I'm here to help you build a profile that truly represents who you are and what you bring to the table. Let's start simple — what's your name and what do you do?",
                            sender: 'bot',
                            suggestedReplies: [
                                "I'm a business owner",
                                "I'm a working professional",
                                "I run my own practice",
                            ],
                        },
                    ];

                set({
                    activeProfileId: profile.id,
                    profileData: { ...INITIAL_PROFILE, ...profile.profile_data },
                    messages: loadedMessages,
                    hasCompletedLinkedIn: profile.linkedin_imported,
                    profileLoaded: true
                });
            }
        }),
        {
            name: 'profile-architect-storage',
            partialize: (state) => ({
                profileData: state.profileData,
                messages: state.messages,
                currentSection: state.currentSection,
                sectionProgress: state.sectionProgress,
                conversationPhase: state.conversationPhase,
                hasCompletedLinkedIn: state.hasCompletedLinkedIn,
                activeProfileId: state.activeProfileId,
            }),
        }
    )
);
