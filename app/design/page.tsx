
'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DesignPage() {
    const [prompt, setPrompt] = useState('');
    const [html, setHtml] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/generate-design', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: prompt,
                    currentHtml: html
                }),
            });

            const data = await res.json();
            if (data.content) {
                // Strip markdown code blocks if present (common issue even with system prompt)
                const cleanHtml = data.content.replace(/```html|```/g, '');
                setHtml(cleanHtml);
                setPrompt(''); // Clear prompt after success
            } else if (data.error) {
                alert('Error: ' + data.error);
            }
        } catch (e: any) {
            alert('Failed to generate: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar - Controls */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-slate-900 text-white p-6 flex flex-col z-10 shadow-xl">
                <h1 className="text-xl font-bold mb-6 text-indigo-400">AI Design Architect</h1>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-400">Instructions</label>
                        <textarea
                            className="w-full h-32 p-3 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            placeholder="e.g., 'Create a clean minimalist profile for a UX Designer named Sarah'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleGenerate();
                                }
                            }}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className={`py-3 px-4 rounded-lg font-medium transition-all ${loading || !prompt
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Generating...
                            </span>
                        ) : 'Generate Design'}
                    </button>

                    <div className="mt-8 text-xs text-slate-500">
                        <p className="mb-2 uppercase tracking-wider font-semibold">Tips</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Describe the vibe (e.g., "Bold", "Corporate", "Creative")</li>
                            <li>Mention specific colors ("Dark mode with gold accents")</li>
                            <li>Iterate! "Make the header bigger" works on existing design.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Side - Preview */}
            <div className="flex-1 bg-slate-100 p-8 overflow-y-auto flex justify-center items-start">
                {html ? (
                    <div className="w-full max-w-[794px] min-h-[1123px] bg-white shadow-2xl relative animate-fade-in origin-top">
                        {/* Embed the HTML in an iframe to isolate styles and scripts safely, 
                             or render directly if trusted. Since we are generating full HTML including 
                             head/body/scripts for Tailwind, an iframe is safest and most correct. */}
                        <iframe
                            srcDoc={html}
                            className="w-full h-[1123px] border-none"
                            title="Design Preview"
                            sandbox="allow-scripts"
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-200 mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                            </div>
                            <p>Enter a prompt to start designing</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
