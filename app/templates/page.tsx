"use client";

import React, { useState } from "react";
import {
    ArrowLeft,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    LayoutGrid,
} from "lucide-react";
import Link from "next/link";

// Template metadata — ordered by ID
const TEMPLATES = Array.from({ length: 17 }, (_, i) => {
    const id = `temp-${i + 1}`;
    return { id, index: i + 1 };
});

export default function TemplatesPage() {
    const [previewId, setPreviewId] = useState<string | null>(null);

    const currentIndex = TEMPLATES.findIndex((t) => t.id === previewId);

    const goNext = () => {
        if (currentIndex < TEMPLATES.length - 1) {
            setPreviewId(TEMPLATES[currentIndex + 1].id);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setPreviewId(TEMPLATES[currentIndex - 1].id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-[family-name:var(--font-inter)]">
            {/* ─── Header ────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-500 hover:text-[#01334c] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#01334c] flex items-center justify-center shadow-md shadow-[#01334c]/20">
                                <LayoutGrid className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-[#01334c] tracking-tight leading-none">
                                    Template Gallery
                                </h1>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                                    {TEMPLATES.length} designs
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/chat"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#01334c] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#024466] transition-all duration-300 shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 active:scale-95"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Build Profile</span>
                    </Link>
                </div>
            </header>

            {/* ─── Gallery Grid ──────────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-[#01334c] tracking-tight">
                        Choose a Template
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Browse our collection of professionally designed profile templates.
                        Click to preview any design.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {TEMPLATES.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => setPreviewId(template.id)}
                            className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/80 hover:border-[#01334c]/20 transition-all duration-300 hover:-translate-y-1 text-left"
                        >
                            {/* Iframe thumbnail */}
                            <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
                                <iframe
                                    src={`/api/template?id=${template.id}`}
                                    className="w-[800px] h-[1100px] border-none origin-top-left pointer-events-none"
                                    style={{ transform: "scale(0.3)", transformOrigin: "top left" }}
                                    title={`Template ${template.index}`}
                                    loading="lazy"
                                    sandbox="allow-scripts"
                                />
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-[#01334c]/0 group-hover:bg-[#01334c]/60 transition-all duration-300 flex items-center justify-center">
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#01334c] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl transform scale-90 group-hover:scale-100">
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Preview</span>
                                    </div>
                                </div>
                            </div>

                            {/* Label */}
                            <div className="px-4 py-3 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Template {template.index}
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                                        {template.id}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </main>

            {/* ─── Full-Screen Preview Modal ─────────────────────────────── */}
            {previewId && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in flex items-center justify-center">
                    {/* Close */}
                    <button
                        onClick={() => setPreviewId(null)}
                        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Nav: Prev */}
                    <button
                        onClick={goPrev}
                        disabled={currentIndex <= 0}
                        className="absolute left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Nav: Next */}
                    <button
                        onClick={goNext}
                        disabled={currentIndex >= TEMPLATES.length - 1}
                        className="absolute right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Template label */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-white text-sm font-bold tracking-wide">
                        Template {currentIndex + 1} of {TEMPLATES.length}
                    </div>

                    {/* Iframe preview */}
                    <div className="w-[90vw] max-w-[850px] h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
                        <iframe
                            key={previewId}
                            src={`/api/template?id=${previewId}`}
                            className="w-full h-full border-none"
                            title={`Preview ${previewId}`}
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
