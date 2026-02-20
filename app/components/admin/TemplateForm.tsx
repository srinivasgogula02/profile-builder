'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Image as ImageIcon, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import EditorPreview from '@/app/components/editor/EditorPreview';
import { useProfileStore } from '@/app/lib/store';

interface TemplateFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function TemplateForm({ initialData, isEdit = false }: TemplateFormProps) {
    const router = useRouter();
    const { profileData } = useProfileStore();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        category: 'Simple',
        thumbnail: '',
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; padding: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>{{fullName}}</h1>
    <p>{{tagline}}</p>
</body>
</html>`,
        width: 794,
        height: 1123,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                name: initialData.name,
                description: initialData.description || '',
                category: initialData.category || 'Simple',
                thumbnail: initialData.thumbnail || '',
                html: initialData.html || '',
                width: initialData.dimensions?.width || 794,
                height: initialData.dimensions?.height || 1123,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto-generate ID from name if creating new
    useEffect(() => {
        if (!isEdit && formData.name && !formData.id) {
            const generatedId = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            setFormData(prev => ({ ...prev, id: generatedId }));
        }
    }, [formData.name, isEdit, formData.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const payload = {
            id: formData.id,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            thumbnail: formData.thumbnail,
            html: formData.html,
            dimensions: {
                width: Number(formData.width),
                height: Number(formData.height),
            },
            updated_at: new Date().toISOString(),
        };

        let error;

        if (isEdit) {
            const { error: updateError } = await supabase
                .from('templates')
                .update(payload)
                .eq('id', formData.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('templates')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            console.error('Error saving template:', JSON.stringify(error, null, 2));
            setMessage({ type: 'error', text: `Failed to save: ${error.message || JSON.stringify(error)}` });
        } else {
            setMessage({ type: 'success', text: 'Template saved successfully!' });
            setTimeout(() => {
                router.push('/admin/templates');
                router.refresh();
            }, 1000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
            {/* Sidebar / Form Area */}
            <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col h-screen overflow-y-auto">
                <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/templates" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-[#01334c]">
                            {isEdit ? 'Edit Template' : 'New Template'}
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {isEdit ? 'Modify template structure & style.' : 'Create a new HTML template.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#01334c] outline-none"
                                placeholder="e.g. Modern Resume"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ID (Slug)</label>
                            <input
                                type="text"
                                name="id"
                                required
                                disabled={isEdit}
                                value={formData.id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm disabled:text-slate-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            >
                                <option value="Simple">Simple</option>
                                <option value="Professional">Professional</option>
                                <option value="Creative">Creative</option>
                                <option value="Modern">Modern</option>
                                <option value="Academic">Academic</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg h-20 resize-none text-sm"
                                placeholder="Short description..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Width (px)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={formData.width}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (px)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Thumbnail URL</label>
                            <input
                                type="text"
                                name="thumbnail"
                                value={formData.thumbnail}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">HTML Content</label>
                            </div>

                            <textarea
                                name="html"
                                value={formData.html}
                                onChange={handleChange}
                                className="w-full h-64 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-900 text-slate-100 focus:ring-2 focus:ring-[#01334c] outline-none"
                                spellCheck={false}
                                placeholder="<html>...</html>"
                            />
                            <p className="text-xs text-slate-500 mt-1">Use Handlebars syntax: {`{{fullName}}`}</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 flex gap-3 sticky bottom-0 bg-white pb-6">
                        <Link href="/admin/templates" className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-center transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-[#01334c] text-white rounded-lg font-medium hover:bg-[#024466] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Saving...' : 'Save Template'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Live Preview Area */}
            <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-slate-500 border border-slate-200 shadow-sm">
                    Live Preview ({formData.width} x {formData.height})
                </div>
                {/* We need to pass data to preview. We can use profileData from store + defaults */}
                <EditorPreview
                    html={formData.html}
                    data={{
                        fullName: 'John Doe',
                        tagline: 'Software Engineer',
                        email: 'john@example.com',
                        phone: '+1 234 567 890',
                        summary: 'Passionate developer with experience in React and Node.js.',
                        // Add dummy data for other fields as needed for preview
                        experience: [
                            { company: 'Tech Corp', role: 'Senior Dev', startDate: '2020', endDate: 'Present', description: 'Building awesome apps.' }
                        ],
                        education: [
                            { school: 'University of Tech', degree: 'B.Sc. CS', startDate: '2016', endDate: '2020' }
                        ],
                        skills: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
                        ...profileData // Override with actual data if available
                    }}
                    onHtmlChange={(newHtml) => setFormData(prev => ({ ...prev, html: newHtml }))}
                    width={Number(formData.width)}
                    height={Number(formData.height)}
                />
            </div>
        </div>
    );
}
