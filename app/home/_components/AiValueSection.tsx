'use client';

import React, { useState } from 'react';
import { Target, BarChart3, Globe2, Handshake, ChevronRight } from 'lucide-react';

const examples = [
    {
        label: 'Marketing Strategy',
        raw: 'Designed a new marketing strategy for 2023 that helped our company grow.',
        polished: 'Spearheaded a go-to-market strategy that generated ₹1.5 Cr in pipeline within Q1 2023, expanding the client base by 38% YoY.',
    },
    {
        label: 'Logistics Operations',
        raw: 'Ran operations of my logistics company for 5 years.',
        polished: 'Led end-to-end operations of a 50-vehicle logistics network across 4 states, driving 22% cost reduction while maintaining 98.5% on-time delivery.',
    },
];

const aiPoints = [
    { icon: Target, title: 'The "So What?" Test', desc: 'AI adds the context, numbers, and business impact humans typically undersell.' },
    { icon: BarChart3, title: 'Quantified Achievements', desc: 'Vague claims become measurable outcomes decision-makers instantly trust.' },
    { icon: Globe2, title: 'Industry-Aware Language', desc: 'Fintech, manufacturing, healthcare — AI speaks your sector\'s vocabulary.' },
    { icon: Handshake, title: 'Partner & Investor Framing', desc: 'Tailored for the right audience: investor, co-founder, or enterprise buyer.' },
];

export default function AiValueSection() {
    const [active, setActive] = useState(0);
    const ex = examples[active];

    return (
        <section id="ai-value" className="py-20 bg-[#111] border-y border-white/5">
            <div className="max-w-6xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-14">
                    <div className="text-[12px] font-mono text-red-500 tracking-[2px] uppercase mb-3">
                        AI Transformation
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold font-bebas leading-tight text-white">
                        From Raw Input to Boardroom Language
                    </h2>
                    <p className="text-gray-400 mt-3 text-[16px] max-w-xl mx-auto leading-relaxed">
                        See exactly how our AI transforms plain, unstructured descriptions into executive-grade business language.
                    </p>
                </div>

                {/* Example Tabs */}
                <div className="flex gap-3 justify-center mb-8">
                    {examples.map((e, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`px-5 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200 ${active === i
                                    ? 'bg-red-600 border-red-600 text-white shadow-[0_4px_20px_rgba(232,25,44,0.3)]'
                                    : 'bg-transparent border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                                }`}
                        >
                            {e.label}
                        </button>
                    ))}
                </div>

                {/* Before / After Card */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-16">
                    {/* Before */}
                    <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                            <span className="font-mono text-[11px] tracking-[2px] uppercase text-gray-500">Before — Raw Input</span>
                        </div>
                        <p className="text-gray-400 text-[15px] leading-[1.7] italic">
                            &ldquo;{ex.raw}&rdquo;
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1 px-2 shrink-0">
                        <ChevronRight className="w-7 h-7 text-red-500 hidden md:block" />
                        <div className="text-red-500 text-xl md:hidden">↓</div>
                        <span className="text-[10px] font-mono text-red-400 tracking-wider uppercase hidden md:block">AI</span>
                    </div>

                    {/* After */}
                    <div className="bg-[#0D0D0D] border border-red-500/25 rounded-2xl p-6 relative shadow-[0_0_40px_rgba(232,25,44,0.06)]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="font-mono text-[11px] tracking-[2px] uppercase text-red-400">After — Boardroom Ready</span>
                        </div>
                        <p className="text-white text-[15px] leading-[1.7]">
                            &ldquo;{ex.polished}&rdquo;
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 mb-14"></div>

                {/* 4 Feature Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {aiPoints.map((point, idx) => {
                        const Icon = point.icon;
                        return (
                            <div key={idx} className="text-center px-2">
                                <div className="w-10 h-10 mx-auto mb-4 bg-red-500/10 border border-red-500/25 rounded-xl flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-red-500" />
                                </div>
                                <h4 className="text-[15px] font-semibold text-white mb-2">{point.title}</h4>
                                <p className="text-[13px] text-gray-400 leading-[1.6]">{point.desc}</p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}
