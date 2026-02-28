import { supabase } from './supabase';
import { ProfileData } from './schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileRow {
    id: string;
    user_id: string;
    profile_data: Partial<ProfileData>;
    preview_html: string | null;
    linkedin_imported: boolean;
    messages: any[]; // Store chat history
    created_at: string;
    updated_at: string;
}

// ─── CRUD Helpers ─────────────────────────────────────────────────────────────

/**
 * Load all saved profiles for the user from the database.
 * Ordered by most recently updated first.
 */
export async function loadProfiles(userId: string): Promise<ProfileRow[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error loading profiles:', error.message);
        return [];
    }

    return data || [];
}

/**
 * Save (insert or update) the user's profile and chat history.
 * If profileId is provided, it updates that profile.
 * If no profileId is provided, it creates a new profile.
 * Returns the saved profile data (including its ID).
 */
export async function saveProfile(
    userId: string,
    profileData: Partial<ProfileData>,
    messages: any[] = [],
    previewHtml: string | null = null,
    profileId?: string
): Promise<ProfileRow | null> {

    let query;

    if (profileId) {
        // Update existing profile
        query = supabase
            .from('profiles')
            .update({
                profile_data: profileData,
                preview_html: previewHtml,
                messages: messages,
                updated_at: new Date().toISOString()
            })
            .eq('id', profileId)
            .eq('user_id', userId)
            .select()
            .single();
    } else {
        // Insert new profile
        query = supabase
            .from('profiles')
            .insert({
                user_id: userId,
                profile_data: profileData,
                preview_html: previewHtml,
                messages: messages
            })
            .select()
            .single();
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error saving profile:', error.message);
        return null;
    }

    return data;
}

/**
 * Mark that the user has completed the LinkedIn import flow for a specific profile.
 */
export async function markLinkedinImported(profileId: string): Promise<boolean> {
    if (!profileId) return false;

    const { error } = await supabase
        .from('profiles')
        .update({
            linkedin_imported: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

    if (error) {
        console.error('Error marking LinkedIn imported:', error.message);
        return false;
    }

    return true;
}

/**
 * Delete a specific profile/chat.
 */
export async function deleteProfile(profileId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting profile:', error.message);
        return false;
    }

    return true;
}
