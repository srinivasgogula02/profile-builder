import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        // Validate admin session
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const templateId = formData.get('templateId') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }
        if (!templateId) {
            return NextResponse.json({ error: 'No templateId provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        // Validate file size (10MB for template thumbnails)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
        }

        // Create deterministic file path using template slug so re-uploads replace
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `template-thumbnails/${templateId}.${ext}`;

        // Convert to buffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to existing `user_images` bucket under template-thumbnails/ folder
        const { error: uploadError } = await supabaseAdmin.storage
            .from('user_images')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '86400',
                upsert: true,
            });

        if (uploadError) {
            console.error('Thumbnail upload error:', uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('user_images')
            .getPublicUrl(fileName);

        // Update the templates table with the thumbnail URL
        const { error: updateError } = await supabaseAdmin
            .from('templates')
            .update({ thumbnail: urlData.publicUrl })
            .eq('id', templateId);

        if (updateError) {
            console.error('DB update error:', updateError);
            return NextResponse.json({ error: 'Uploaded but failed to update DB: ' + updateError.message }, { status: 500 });
        }

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (err) {
        console.error('Template thumbnail upload failed:', err);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
