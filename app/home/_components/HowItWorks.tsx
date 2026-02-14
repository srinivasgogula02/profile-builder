'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Link2, Sparkles, Download } from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        num: '01',
        icon: Link2,
        title: 'Connect LinkedIn',
        desc: 'Paste your LinkedIn profile URL. We securely extract your experience, skills, and education in seconds.',
        color: '#0077b5',
        bgColor: 'rgba(0, 119, 181, 0.08)',
    },
    {
        num: '02',
        icon: Sparkles,
        title: 'AI Enhancement',
        desc: 'Review the extracted data. Our AI suggests powerful improvements to make your achievements more impactful.',
        color: '#7c3aed',
        bgColor: 'rgba(124, 58, 237, 0.08)',
    },
    {
        num: '03',
        icon: Download,
        title: 'Download & Share',
        desc: 'Export your perfectly formatted profile as a beautiful PDF. Ready to apply, pitch, or share.',
        color: '#059669',
        bgColor: 'rgba(5, 150, 105, 0.08)',
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
        <section id="how-it-works" ref={sectionRef} className="py-28 bg-white text-[#03334c] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #03334c 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative">
                {/* Section Header */}
                <div
                    className="text-center mb-20 space-y-5"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#03334c]/[0.05] border border-[#03334c]/10 text-xs font-bold tracking-wider text-[#03334c] uppercase">
                        <span>Simple Process</span>
                    </div>
                    <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight text-[#03334c]">
                        How it works
                    </h2>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto">
                        Three simple steps to a world-class professional profile.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector line (desktop) */}
                    <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] z-0">
                        <div className="h-[2px] bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200 relative">
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-[#0077b5] via-[#7c3aed] to-[#059669] rounded-full"
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
                                        className="w-[104px] h-[104px] rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:shadow-xl group-hover:scale-105 border border-slate-100 group-hover:border-transparent bg-white shadow-lg"
                                        style={{
                                            boxShadow: `0 8px 30px ${step.bgColor}`,
                                        }}
                                    >
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                            style={{ backgroundColor: step.bgColor }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: step.color }} />
                                        </div>
                                    </div>
                                    {/* Step number badge */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#03334c] text-white text-xs font-bold flex items-center justify-center shadow-md">
                                        {step.num}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-[#03334c] mb-3">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
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
                        className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold bg-[#03334c] text-white hover:bg-[#02283b] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-[#03334c]/15 hover:shadow-[#03334c]/25"
                    >
                        Start Building Now
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
