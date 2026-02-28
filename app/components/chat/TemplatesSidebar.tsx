"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, LayoutTemplate, Loader2, AlertCircle, ArrowRight, Sparkles, Lock, Star } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

interface TemplatesSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isPremium?: boolean;
    onShowPayment?: () => void;
}

interface Template {
    id: string;
    name: string;
    description?: string;
    thumbnail?: string;
    category?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    Simple: "bg-slate-100 text-slate-700",
    Professional: "bg-blue-50 text-blue-700",
    Creative: "bg-purple-50 text-purple-700",
    Modern: "bg-emerald-50 text-emerald-700",
    Academic: "bg-amber-50 text-amber-700",
};

export default function TemplatesSidebar({ isOpen, onClose, isPremium = false, onShowPayment }: TemplatesSidebarProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (templates.length > 0) return;

        const fetchTemplates = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const { data, error: fetchError } = await supabase
                    .from("templates")
                    .select("id, name, description, thumbnail, category")
                    .order("created_at", { ascending: false });

                if (fetchError) throw fetchError;
                setTemplates(data || []);
            } catch (err) {
                console.error("Error fetching templates:", err);
                setError("Could not load templates.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTemplates();
    }, [isOpen, templates.length]);

    const handleTemplateClick = (e: React.MouseEvent) => {
        if (!isPremium) {
            e.preventDefault();
            onShowPayment?.();
        } else {
            onClose();
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#01334c] to-[#024466] text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
                            <LayoutTemplate className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-base">Choose a Theme</h2>
                                {isPremium && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full">
                                        <Star className="w-2.5 h-2.5" /> PREMIUM
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-white/60">
                                {isPremium ? "Click any to apply it" : "Unlock all templates for \u20b999"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Premium upsell banner (non-premium users) */}
                {!isPremium && !isLoading && templates.length > 0 && (
                    <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#01334c]/5 to-[#01334c]/10 border border-[#01334c]/15 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#01334c] flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#01334c]">Unlock all templates</p>
                            <p className="text-[10px] text-slate-500">One-time payment &middot; No subscription</p>
                        </div>
                        <button
                            onClick={onShowPayment}
                            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#01334c] text-white text-[10px] font-black hover:bg-[#024466] transition-colors"
                        >
                            \u20b999
                        </button>
                    </div>
                )}

                {/* Template Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-3">
                            <Loader2 className="w-6 h-6 animate-spin text-[#01334c]" />
                            <span className="text-sm font-medium">Loading templates...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-red-500 space-y-3 bg-red-50 rounded-xl border border-red-100 p-4 text-center">
                            <AlertCircle className="w-6 h-6" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 p-6 text-center">
                            <LayoutTemplate className="w-8 h-8 mb-2 text-slate-300" />
                            <span className="text-sm font-medium">No templates yet</span>
                            <span className="text-xs text-slate-400 mt-1">Add templates from the admin panel</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {templates.map((template) => (
                                <Link
                                    key={template.id}
                                    href={isPremium ? `/design/${template.id}` : "#"}
                                    onClick={handleTemplateClick}
                                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#01334c]/40 hover:shadow-lg hover:shadow-[#01334c]/10 transition-all duration-300 active:scale-[0.98] relative"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden">
                                        {template.thumbnail ? (
                                            <img
                                                src={template.thumbnail}
                                                alt={template.name}
                                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isPremium ? "opacity-80" : ""}`}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 gap-2">
                                                <LayoutTemplate className="w-8 h-8 text-slate-300" />
                                                <span className="text-[10px] text-slate-400 font-medium">No preview</span>
                                            </div>
                                        )}
                                        {/* Hover overlay */}
                                        {isPremium ? (
                                            <div className="absolute inset-0 bg-[#01334c]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-[#01334c] text-xs font-bold shadow-lg">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    Use This
                                                    <ArrowRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 rounded-full text-amber-900 text-xs font-bold shadow-lg">
                                                    <Lock className="w-3 h-3" />
                                                    Unlock \u2014 \u20b999
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-2.5">
                                        <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">{template.name}</p>
                                        {template.category && (
                                            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[template.category] || "bg-slate-100 text-slate-600"}`}>
                                                {template.category}
                                            </span>
                                        )}
                                    </div>

                                    {/* Lock badge */}
                                    {!isPremium && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                                            <Lock className="w-3 h-3 text-amber-900" />
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/80">
                    <p className="text-[11px] text-slate-400 text-center">
                        {templates.length} template{templates.length !== 1 ? "s" : ""} available
                    </p>
                </div>
            </div>
        </>
    );
}
