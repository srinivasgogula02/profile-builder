'use client';

import React, { useEffect, useState } from 'react';
import TemplateForm from '@/app/components/admin/TemplateForm';
import { supabase } from '@/app/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
            const { data, error } = await supabase
                .from('templates')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching template:', error);
            } else {
                setTemplate(data);
            }
            setLoading(false);
        };

        fetchTemplate();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!template) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
                Template not found.
            </div>
        );
    }

    return <TemplateForm initialData={template} isEdit={true} />;
}
