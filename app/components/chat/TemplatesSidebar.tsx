"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, LayoutTemplate, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/app/lib/supabase";


interface TemplatesSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Template {
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
}

export default function TemplatesSidebar({ isOpen, onClose }: TemplatesSidebarProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchTemplates = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { data, error: fetchError } = await supabase
                    .from('templates')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fetchError) {
                    throw fetchError;
                }
                setTemplates(data || []);
            } catch (err) {
                console.error("Error fetching templates:", err);
                setError("Could not load templates.");
            } finally {
                setIsLoading(false);
            }
        };

        if (templates.length === 0) {
            fetchTemplates();
        }
    }, [isOpen, templates.length]);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#01334c] flex items-center justify-center shadow-lg shadow-[#01334c]/20">
                            <LayoutTemplate className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-bold text-lg text-[#01334c]">Templates</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
                            <Loader2 className="w-6 h-6 animate-spin text-[#01334c]" />
                            <span className="text-sm font-medium">Loading templates...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-red-500 space-y-3 bg-red-50 rounded-xl border border-red-100 p-4 text-center">
                            <AlertCircle className="w-6 h-6" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                            <span className="text-sm font-medium">No templates found</span>
                        </div>
                    ) : (
                        templates.map((template) => (
                            <Link
                                key={template.id}
                                href={`/design/${template.id}`}
                                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-[#01334c]/30 hover:shadow-md hover:shadow-[#01334c]/5 transition-all text-slate-700 hover:text-[#01334c] group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-[#01334c]/5 group-hover:border-[#01334c]/20 transition-colors overflow-hidden shrink-0">
                                    <LayoutTemplate className="w-4 h-4 text-slate-400 group-hover:text-[#01334c]" />
                                </div>
                                <span className="text-sm font-semibold">{template.name}</span>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
