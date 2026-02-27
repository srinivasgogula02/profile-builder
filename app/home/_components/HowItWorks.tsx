'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Link2, Sparkles, Download } from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        num: '01',
        icon: Link2,
        title: 'Connect Experience',
        desc: 'Paste your LinkedIn profile URL. We securely extract your professional experience, skills, and business achievements in seconds.',
        color: '#E5E7EB', // gray-200
        bgColor: 'rgba(255, 255, 255, 0.05)',
    },
    {
        num: '02',
        icon: Sparkles,
        title: 'AI Enhancement',
        desc: 'Review the extracted data. Our AI suggests powerful framing to translate your capabilities into clear business value for partners.',
        color: '#EF4444', // red-500
        bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
        num: '03',
        icon: Download,
        title: 'Download & Share',
        desc: 'Export your perfectly formatted executive profile as a premium PDF. Ready to attach to pitches, intros, or network meetings.',
        color: '#E5E7EB', // gray-200
        bgColor: 'rgba(255, 255, 255, 0.05)',
    },
];

export default function HowItWorks() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <section id="how-it-works" ref={sectionRef} className="py-24 bg-[#050505] text-white relative overflow-hidden border-t border-white/10">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.2]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #333 1.5px, transparent 1.5px)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div
                    className="text-center mb-24 space-y-5"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold tracking-wider text-red-500 uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        <span>Frictionless Onboarding</span>
                    </div>
                    <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-white">
                        How it works
                    </h2>
                    <p className="text-gray-400 font-medium text-lg max-w-lg mx-auto">
                        Three simple steps to an executive-grade professional profile.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector line (desktop) */}
                    <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] z-0">
                        <div className="h-[2px] bg-[#111] relative">
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-gray-700 via-red-500 to-gray-700 rounded-full"
                                style={{
                                    width: visible ? '100%' : '0%',
                                    transition: 'width 1.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                                }}
                            />
                        </div>
                    </div>

                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const delay = 0.15 + idx * 0.15;

                        return (
                            <div
                                key={idx}
                                className="relative z-10 flex flex-col items-center text-center group"
                                style={{
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                                    transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                                }}
                            >
                                {/* Step circle */}
                                <div className="relative mb-8">
                                    <div
                                        className="w-[104px] h-[104px] rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] group-hover:scale-105 border border-white/10 group-hover:border-red-500/30 bg-[#0A0A0A] shadow-md relative z-10"
                                    >
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm border border-white/5"
                                            style={{ backgroundColor: step.bgColor }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: step.color }} />
                                        </div>
                                    </div>
                                    {/* Step number badge */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-600 border border-red-400 text-white text-xs font-bold flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] z-20">
                                        {step.num}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-xs">{step.desc}</p>
                            </div>
                        );
                    })}
                </div>

                {/* CTA */}
                <div
                    className="mt-20 text-center"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
                    }}
                >
                    <Link
                        href="/chat"
                        className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-bold bg-white text-black hover:bg-gray-200 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-transparent"
                    >
                        Start Building Now
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
