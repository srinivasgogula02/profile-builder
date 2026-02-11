import { supabase } from './supabase';
import { ProfileData } from './schema';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileRow {
    id: string;
    user_id: string;
    profile_data: Partial<ProfileData>;
    preview_html: string | null;
    linkedin_imported: boolean;
    created_at: string;
    updated_at: string;
}

// ─── CRUD Helpers ─────────────────────────────────────────────────────────────

/**
 * Load the user's saved profile from the database.
 * Returns null if no profile exists yet.
 */
export async function loadProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error loading profile:', error.message);
        return null;
    }

    return data;
}

/**
 * Save (upsert) the user's profile data and preview HTML.
 * Creates a new row on first save, updates on subsequent saves.
 */
export async function saveProfile(
    userId: string,
    profileData: Partial<ProfileData>,
    previewHtml: string | null = null
): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .upsert(
            {
                user_id: userId,
                profile_data: profileData,
                preview_html: previewHtml,
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Error saving profile:', error.message);
        return false;
    }

    return true;
}

/**
 * Mark that the user has completed the LinkedIn import flow
 * (either by importing or by skipping).
 */
export async function markLinkedinImported(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .upsert(
            {
                user_id: userId,
                linkedin_imported: true,
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        console.error('Error marking LinkedIn imported:', error.message);
        return false;
    }

    return true;
}
