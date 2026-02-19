'use client';

import React, { useState, useEffect } from 'react';
import EditorPreview from '@/app/components/editor/EditorPreview';
import { useProfileStore } from '@/app/lib/store';
import { Save, AlertCircle, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { profileData } = useProfileStore();
    const [templateId, setTemplateId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        category: 'Simple',
        width: 794,
        height: 1123,
        html: ''
    });

    const [isRefining, setIsRefining] = useState(false);
    const [refineInstructions, setRefineInstructions] = useState('');
    const [showRefineInput, setShowRefineInput] = useState(false);

    // Unwrap params
    useEffect(() => {
        params.then(unwrappedParams => {
            setTemplateId(unwrappedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (templateId) {
            fetchTemplate(templateId);
        }
    }, [templateId]);

    const handleRefine = async () => {
        if (!formData.html.trim()) {
            setMessage({ type: 'error', text: 'Please enter some HTML first.' });
            return;
        }

        setIsRefining(true);
        setMessage(null);

        try {
            const res = await fetch('/api/admin/refine-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    html: formData.html,
                    instructions: refineInstructions
                })
            });

            if (!res.ok) throw new Error('Refinement failed');

            const data = await res.json();
            if (data.html) {
                setFormData(prev => ({ ...prev, html: data.html }));
                setMessage({ type: 'success', text: 'Template refined with AI!' });
                setShowRefineInput(false);
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Failed to refine template.' });
        } finally {
            setIsRefining(false);
        }
    };

    const fetchTemplate = async (id: string) => {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            setMessage({ type: 'error', text: 'Failed to load template' });
        } else if (data) {
            setFormData({
                id: data.id,
                name: data.name,
                description: data.description || '',
                category: data.category || 'Simple',
                width: data.dimensions?.width || 794,
                height: data.dimensions?.height || 1123,
                html: data.html
            });
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Using the same API as CREATE, which supports upsert
            const res = await fetch('/api/admin/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    dimensions: { width: Number(formData.width), height: Number(formData.height) }
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update template');
            }

            setMessage({ type: 'success', text: 'Template updated successfully!' });
            // Optional: redirect or stay 
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading template...</div>;

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
            {/* Sidebar / Form Area */}
            <div className="w-[400px] border-r border-slate-200 bg-white flex flex-col h-screen overflow-y-auto">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/admin/templates" className="text-slate-400 hover:text-slate-600">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold text-[#01334c]">Edit Template</h1>
                    </div>
                    <p className="text-sm text-slate-500 font-mono">{formData.id}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#01334c] outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            >
                                <option value="Simple">Simple</option>
                                <option value="Professional">Professional</option>
                                <option value="Creative">Creative</option>
                                <option value="Academic">Academic</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Width (px)</label>
                                <input
                                    type="number"
                                    value={formData.width}
                                    onChange={e => setFormData({ ...formData, width: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Height (px)</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-slate-700">HTML Content</label>
                                <button
                                    type="button"
                                    onClick={() => setShowRefineInput(!showRefineInput)}
                                    className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    Refine with AI
                                </button>
                            </div>

                            {showRefineInput && (
                                <div className="mb-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <label className="block text-xs font-medium text-purple-800 mb-1">Instructions (Optional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={refineInstructions}
                                            onChange={e => setRefineInstructions(e.target.value)}
                                            placeholder="e.g. Make it dark mode, fix spacing..."
                                            className="flex-1 text-xs px-2 py-1.5 rounded border border-purple-200 focus:outline-none focus:border-purple-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRefine}
                                            disabled={isRefining}
                                            className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {isRefining ? 'Refining...' : 'Go'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <textarea
                                value={formData.html}
                                onChange={e => setFormData({ ...formData, html: e.target.value })}
                                className="w-full h-64 px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-slate-900 text-slate-100 focus:ring-2 focus:ring-[#01334c] outline-none"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 flex gap-3">
                        <Link href="/admin/templates" className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 text-center">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-[#01334c] text-white rounded-lg font-medium hover:bg-[#024466] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Live Preview Area */}
            <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-slate-500 border border-slate-200">
                    Live Preview
                </div>
                <EditorPreview
                    html={formData.html}
                    data={{
                        ...profileData,
                        fullName: profileData.fullName || 'John Doe',
                        tagline: profileData.tagline || 'Software Engineer',
                    }}
                    onHtmlChange={(newHtml) => setFormData(prev => ({ ...prev, html: newHtml }))}
                    width={Number(formData.width)}
                    height={Number(formData.height)}
                />
            </div>
        </div>
    );
}
