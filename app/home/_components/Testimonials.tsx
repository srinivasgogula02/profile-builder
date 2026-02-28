'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Star, Quote, Briefcase, FileText, Compass, TrendingUp, Presentation, Coffee } from 'lucide-react';

const useCases = [
    {
        name: 'Sarah J.',
        role: 'Software Agency Owner',
        initials: 'SJ',
        icon: <Briefcase className="w-5 h-5 text-white" />,
        gradient: 'from-red-600 to-red-800',
        rating: 5,
        text: '"I needed to send a partnership proposal to a US tech company. This tool built my agency profile in 2 minutes. We won the $50k contract because our presentation looked so polished."',
    },
    {
        name: 'Michael T.',
        role: 'Management Consultant',
        initials: 'MT',
        icon: <Compass className="w-5 h-5 text-white" />,
        gradient: 'from-gray-700 to-black',
        rating: 5,
        text: '"Heading to a critical meeting? I generated my profile in the Uber, sent it ahead as an introduction, and the room was won over before I even walked in."',
    },
    {
        name: 'Elena R.',
        role: 'Freelance Designer',
        initials: 'ER',
        icon: <FileText className="w-5 h-5 text-white" />,
        gradient: 'from-red-500 to-rose-700',
        rating: 5,
        text: '"My work is highly visual, but I needed a professional summary to match. ProfileBuilder gave me the polished, executive edge I needed to land enterprise clients."',
    },
    {
        name: 'David W.',
        role: 'Real Estate Broker',
        initials: 'DW',
        icon: <TrendingUp className="w-5 h-5 text-white" />,
        gradient: 'from-gray-600 to-gray-800',
        rating: 5,
        text: '"Instant credibility when dealing with high-net-worth clients. I attach this 1-pager to every initial introductory email now and the response rate has doubled."',
    },
    {
        name: 'Alex K.',
        role: 'Startup Founder',
        initials: 'AK',
        icon: <Presentation className="w-5 h-5 text-white" />,
        gradient: 'from-red-400 to-red-600',
        rating: 5,
        text: '"Used my generated profile for investor updates and partner outreach. Saved me hours of formatting in Word, and it looks 10x better than what I had before."',
    },
    {
        name: 'James L.',
        role: 'B2B Service Provider',
        initials: 'JL',
        icon: <Coffee className="w-5 h-5 text-white" />,
        gradient: 'from-[#111] to-[#222]',
        rating: 5,
        text: '"A professional in a blazer needs a professional profile. This is my secret weapon for networking. It shows I take my business—and theirs—seriously."',
    },
];

export default function Testimonials() {
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
        <section id="use-cases" ref={sectionRef} className="py-24 bg-[#0A0A0A] text-white relative overflow-hidden border-t border-white/10">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] bg-red-600/[0.05] rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div
                    className="text-center max-w-3xl mx-auto mb-16 space-y-5"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold tracking-wider text-red-500 uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                        <span>Proven Use Cases</span>
                    </div>
                    <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-tight text-white">
                        Built for leaders who <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-500">command respect.</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                        See how business owners across industries are using instant, high-impact profiles to build partnerships, win clients, and scale their networks.
                    </p>
                </div>

                {/* Testimonial Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase, idx) => {
                        const delay = idx * 0.1;

                        return (
                            <div
                                key={idx}
                                className="group relative bg-[#111] rounded-2xl p-8 border border-white/10 hover:border-red-500/50 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
                                style={{
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'translateY(0)' : 'translateY(30px)',
                                    transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                                }}
                            >
                                {/* Quote icon */}
                                <div className="absolute top-6 right-6 text-white/5 group-hover:text-red-500/20 transition-colors">
                                    <Quote className="w-10 h-10" />
                                </div>

                                {/* Icon / Initials */}
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center shadow-md border border-white/10`}>
                                        {useCase.icon}
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-white">{useCase.role}</div>
                                        <div className="text-sm font-medium text-gray-400">{useCase.name}</div>
                                    </div>
                                </div>

                                {/* Quote text */}
                                <p className="text-gray-300 leading-relaxed font-medium relative z-10 flex-grow">
                                    {useCase.text}
                                </p>

                                {/* Bottom Stars */}
                                <div className="flex items-center gap-1 mt-6 pt-6 border-t border-white/10">
                                    <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider">Verified Profile</span>
                                    {Array.from({ length: useCase.rating }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-red-500 text-red-500" />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
