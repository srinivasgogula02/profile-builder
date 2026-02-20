'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { FileText, Plus, Edit, Trash2, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import static registry for migration
import { TEMPLATES } from '@/app/lib/templates-registry';

export default function AdminTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
        } else {
            setTemplates(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSyncRegistry = async () => {
        if (!confirm('This will upload all static templates from the registry to the database. Continue?')) return;

        setSyncing(true);
        let count = 0;

        for (const tmpl of Object.values(TEMPLATES)) {
            // Check if exists
            const { data } = await supabase.from('templates').select('id').eq('id', tmpl.id).single();

            if (!data) {
                const { error } = await supabase.from('templates').insert({
                    id: tmpl.id,
                    name: tmpl.name,
                    description: tmpl.description,
                    thumbnail: tmpl.thumbnail,
                    features: tmpl.features,
                    category: tmpl.category,
                    dimensions: tmpl.dimensions,
                    html: tmpl.html, // Using the raw HTML from registry
                });

                if (error) console.error(`Failed to sync ${tmpl.id}:`, error);
                else count++;
            }
        }

        setSyncing(false);
        alert(`Synced ${count} new templates.`);
        fetchTemplates();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this template?')) return;

        const { error } = await supabase.from('templates').delete().eq('id', id);
        if (error) {
            alert('Failed to delete');
        } else {
            setTemplates(templates.filter(t => t.id !== id));
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#01334c] flex items-center gap-2">
                        <FileText className="w-8 h-8" />
                        Template Manager
                    </h1>
                    <p className="text-slate-500">Manage your Resume/CV templates</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSyncRegistry}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        Sync from Registry
                    </button>
                    <Link href="/admin/templates/new" className="flex items-center gap-2 px-4 py-2 bg-[#01334c] text-white rounded-xl hover:bg-[#024466] transition-colors shadow-lg shadow-blue-900/20">
                        <Plus className="w-4 h-4" />
                        New Template
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Template Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Dimensions</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading templates...
                                    </td>
                                </tr>
                            ) : templates.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <p className="mb-4">No templates found in database.</p>
                                            <button onClick={handleSyncRegistry} className="text-[#01334c] font-medium underline">
                                                Sync Static Templates
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                templates.map((tmpl) => (
                                    <tr key={tmpl.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#01334c]">{tmpl.name}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">{tmpl.id}</div>
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">{tmpl.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {tmpl.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {tmpl.dimensions ? (
                                                <span className="font-mono text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                                                    {tmpl.dimensions.width} x {tmpl.dimensions.height}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/design/${tmpl.id}`} target="_blank" className="p-2 text-slate-400 hover:text-[#01334c] hover:bg-slate-100 rounded-lg transition-colors" title="Preview">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <Link href={`/admin/templates/${tmpl.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={(e) => handleDelete(e, tmpl.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
