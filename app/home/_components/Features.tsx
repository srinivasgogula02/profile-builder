'use client';

import React from 'react';
import { Bot, Check, Download, Palette, Zap, Linkedin } from 'lucide-react';

const featuresData = [
    {
        id: 'ai-value',
        icon: Bot,
        title: 'AI Value Translation',
        desc: 'Translates raw experience into business value. Applies the "So What?" test instantly.',
        color: 'from-red-500 to-rose-600',
        colSpan: 'lg:col-span-2',
        content: (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                <div className="flex-1 w-full text-center sm:text-left">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Raw Input</span>
                    <p className="text-gray-400 text-sm line-through">Designed a new marketing strategy for 2023</p>
                </div>
                <div className="w-8 h-8 shrink-0 rounded-full bg-red-600/20 flex items-center justify-center border border-red-500/30">
                    <Zap className="w-4 h-4 text-red-500 animate-pulse" />
                </div>
                <div className="flex-1 w-full text-center sm:text-left">
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1 block">Polished Output</span>
                    <p className="text-white font-medium text-sm">Spearheaded a go-to-market strategy that generated $2M in pipeline within Q1</p>
                </div>
            </div>
        )
    },
    {
        id: 'instant-extraction',
        icon: Linkedin,
        title: 'Instant Extraction',
        desc: "Pull all your career and business data directly from LinkedIn in one click.",
        color: 'from-blue-500 to-indigo-600',
        colSpan: 'lg:col-span-1',
        content: (
            <div className="mt-6 h-24 bg-[#0A0A0A] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-blue-500/30 transition-colors">
                <div className="w-12 h-12 bg-[#0A66C2] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Linkedin className="w-6 h-6 text-white" />
                </div>
            </div>
        )
    },
    {
        id: 'client-ready',
        icon: Check,
        title: 'Client-Ready Format',
        desc: 'Clean, executive structure ensures decision-makers can parse your value.',
        color: 'from-emerald-500 to-teal-600',
        colSpan: 'lg:col-span-1',
        content: (
            <div className="mt-6 space-y-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-full h-8 bg-[#0A0A0A] rounded-lg border border-white/5 flex items-center px-3 gap-3">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <div className="h-1.5 bg-gray-700 rounded-full w-full" />
                    </div>
                ))}
            </div>
        )
    },
    {
        id: 'premium-export',
        icon: Download,
        title: 'Premium PDF Export',
        desc: 'Export high-resolution, pixel-perfect A4 PDFs that command respect in print.',
        color: 'from-purple-500 to-pink-600',
        colSpan: 'lg:col-span-1',
        content: (
            <div className="mt-6 h-28 relative flex items-center justify-center">
                <div className="w-20 h-28 bg-white rounded-sm shadow-xl rotate-[-5deg] group-hover:rotate-0 transition-transform flex flex-col p-2">
                    <div className="w-1/2 h-2 bg-gray-200 rounded mb-2" />
                    <div className="w-full h-1 bg-gray-200 rounded mb-1" />
                    <div className="w-4/5 h-1 bg-gray-200 rounded" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#111]">
                    <Download className="w-4 h-4 text-white" />
                </div>
            </div>
        )
    },
    {
        id: 'executive-design',
        icon: Palette,
        title: 'Executive Design',
        desc: 'Professionally crafted templates that elevate your brand to "premium industry expert."',
        color: 'from-amber-400 to-orange-500',
        colSpan: 'lg:col-span-1',
        content: (
            <div className="mt-6 h-24 grid grid-cols-2 gap-2">
                <div className="bg-[#0A0A0A] rounded-lg border border-white/5 p-2 flex flex-col gap-1.5">
                    <div className="w-full h-8 bg-[#1A1A1A] rounded" />
                    <div className="w-2/3 h-1 bg-gray-700 rounded" />
                    <div className="w-1/2 h-1 bg-gray-800 rounded" />
                </div>
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-lg border border-amber-500/20 p-2 flex flex-col gap-1.5 focus">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-1" />
                    <div className="w-full h-1 bg-gray-600 rounded" />
                    <div className="w-3/4 h-1 bg-gray-700 rounded" />
                </div>
            </div>
        )
    }
];

export default function Features() {
    return (
        <section id="features" className="py-20 bg-[#050505] relative border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        Designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Executive Impact.</span>
                    </h2>
                    <p className="text-gray-400 text-lg sm:text-xl font-medium">
                        We don't just format text. We elevate your entire professional identity.
                    </p>
                </div>

                {/* Compact Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
                    {featuresData.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                className={`group relative bg-[#111] border border-white/10 hover:border-red-500/30 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feature.colSpan}`}
                            >
                                {/* Glow Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${feature.color} shadow-lg shrink-0`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{feature.title}</h3>
                                    </div>

                                    <p className="text-sm text-gray-400 font-medium leading-relaxed flex-grow">
                                        {feature.desc}
                                    </p>

                                    {/* Component Content (Mini previews) */}
                                    <div className="mt-auto">
                                        {feature.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
