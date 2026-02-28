'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
    {
        q: 'Is this free to use?',
        a: 'Yes! You can build and download your custom executive profile completely for free during our beta period. No credit card required.',
    },
    {
        q: 'Does it work with any LinkedIn profile?',
        a: 'Yes, as long as the profile is public, our engine can extract all the details. You can also edit and fine-tune your business metrics manually if you prefer.',
    },
    {
        q: 'Is my data secure?',
        a: 'Absolutely. We apply bank-level encryption to all data. We do not sell or share your personal information, partnership details, or business metrics with third parties.',
    },
    {
        q: 'Can I customize the content for different audiences?',
        a: 'Yes, you have full control over every section. You can tailor your profile for specific clients, potential partners, or investors using our AI and direct editing.',
    },
    {
        q: 'What format will my profile be in?',
        a: 'Your profile is generated as a beautifully designed executive one-pager. You can download it as a high-resolution PDF that looks commanding on screen and in print.',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
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
        <section id="faq" ref={sectionRef} className="py-24 bg-[#0A0A0A] text-white border-t border-white/10 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 lg:gap-20 items-start">
                    {/* Left — Header */}
                    <div
                        className="lg:sticky lg:top-32 space-y-5"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(30px)',
                            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold tracking-wider text-red-500 uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                            <HelpCircle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                            <span>FAQ</span>
                        </div>
                        <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-tight text-white">
                            Answers to your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-500">
                                questions
                            </span>
                        </h2>
                        <p className="text-gray-400 font-medium text-lg leading-relaxed">
                            Everything you need to know about ProfileBuilder. Can&apos;t find what you&apos;re looking for? Reach out to our team.
                        </p>
                    </div>

                    {/* Right — Accordion */}
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => {
                            const isOpen = openIndex === idx;
                            const delay = idx * 0.08;

                            return (
                                <div
                                    key={idx}
                                    className={`bg-[#111] rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
                                        ? 'border-red-500 shadow-[0_8px_30px_rgba(239,68,68,0.15)]'
                                        : 'border-white/10 hover:border-white/20 shadow-sm'
                                        }`}
                                    style={{
                                        opacity: visible ? 1 : 0,
                                        transform: visible ? 'translateY(0)' : 'translateY(20px)',
                                        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, border-color 0.3s, box-shadow 0.3s`,
                                    }}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                                        className="w-full flex items-center justify-between p-6 text-left group"
                                    >
                                        <span className={`font-bold transition-colors ${isOpen ? 'text-white' : 'text-gray-300'}`}>
                                            {faq.q}
                                        </span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-4 transition-all duration-300 ${isOpen
                                            ? 'bg-red-600 border border-red-500 text-white rotate-180 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                            : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white border border-white/5'
                                            }`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    <div
                                        style={{
                                            maxHeight: isOpen ? '200px' : '0px',
                                            opacity: isOpen ? 1 : 0,
                                            transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-gray-400 font-medium leading-relaxed text-[15px]">
                                            {faq.a}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
