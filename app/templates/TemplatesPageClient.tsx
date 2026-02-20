'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { useProfileStore } from '@/app/lib/store';
import { useRouter } from 'next/navigation';
import LiveTemplatePreview from '@/app/components/templates/LiveTemplatePreview';
import { supabase } from '@/app/lib/supabase';

import { useAuthProtection } from '@/app/hooks/useAuthProtection';

export default function TemplatesPageClient() {
    const { isLoading, isAuthorized } = useAuthProtection();
    const { profileData, updateProfileField } = useProfileStore();
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthorized) return; // Don't fetch if not authorized
        const fetchTemplates = async () => {
            const { data } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
            if (data) setTemplates(data);
            setLoading(false);
        };
        fetchTemplates();
    }, [isAuthorized]);

    const handleSelectTemplate = (id: string) => {
        updateProfileField('selectedTemplate', id);
        router.push(`/design/${id}`);
    };

    if (isLoading || (isAuthorized && loading)) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading gallery...</div>;
    }

    if (!isAuthorized) return null; // Should redirect

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#01334c] selection:text-white">
            {/* Header */}
            <div className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4">
                    <Link href="/home" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-[#01334c] hover:bg-slate-50 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-[#01334c] tracking-tight">Template Gallery</h1>
                        <p className="text-xs text-slate-500 font-medium">Select a foundation for your profile</p>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((template) => {
                        const isSelected = profileData.selectedTemplate === template.id;
                        return (
                            <div
                                key={template.id}
                                className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${isSelected
                                    ? 'border-[#01334c] shadow-xl shadow-[#01334c]/10 ring-2 ring-[#01334c]/20'
                                    : 'border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-[#01334c]/30'
                                    }`}
                            >
                                {/* Thumbnail / Preview */}
                                <div className="aspect-[3/2] bg-white relative overflow-hidden group-hover:opacity-100 transition-opacity">
                                    <LiveTemplatePreview templateId={template.id} />

                                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#01334c]/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8 z-20">
                                        <button
                                            onClick={() => handleSelectTemplate(template.id)}
                                            className="bg-white text-[#01334c] px-6 py-3 rounded-xl font-bold text-sm shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                        >
                                            Use This Template
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#01334c]/60 mb-1 block">
                                                {template.category}
                                            </span>
                                            <h3 className="font-bold text-lg text-[#01334c]">{template.name}</h3>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-[#01334c] text-white flex items-center justify-center shadow-md shadow-[#01334c]/20">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                                        {template.description}
                                    </p>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-2">
                                        {template.features?.slice(0, 3).map((feature: string, i: number) => (
                                            <span key={i} className="px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-[10px] font-semibold border border-slate-100">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
