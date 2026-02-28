'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Twitter, Linkedin, Github, CheckCircle2 } from 'lucide-react';

export default function Footer() {
    const ctaRef = useRef<HTMLDivElement>(null);
    const [ctaVisible, setCtaVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setCtaVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        if (ctaRef.current) observer.observe(ctaRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            {/* ── CTA Section ──────────────────────────────────────────── */}
            <section ref={ctaRef} className="py-24 bg-[#0A0A0A] relative overflow-hidden border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div
                        className="relative bg-[#111] rounded-3xl p-12 md:p-16 text-center overflow-hidden border border-white/10"
                        style={{
                            opacity: ctaVisible ? 1 : 0,
                            transform: ctaVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-[50%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/10 rounded-full blur-[100px]" />
                            <div
                                className="absolute inset-0 opacity-[0.2]"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                }}
                            />
                        </div>

                        <div className="relative z-10 space-y-8 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold tracking-wider text-red-500 uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                <span>Rs 99 Per Profile</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                                Close your next big deal with an <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Executive Edge.</span>
                            </h2>

                            <p className="text-gray-400 text-xl font-medium leading-relaxed max-w-2xl mx-auto">
                                Don't let a generic introduction cost you a premium client. Generate an instant, high-impact profile in 2 minutes. Free unlimited drafts.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Link
                                    href="/build"
                                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-[16px] font-bold bg-gradient-to-b from-red-500 to-red-700 text-white hover:to-red-600 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_8px_30px_rgba(220,38,38,0.3)] border border-red-500/50"
                                >
                                    Build Profile Instantly
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-[16px] font-bold text-white bg-[#1A1A1A] border border-white/10 hover:bg-[#222] transition-all hover:border-white/20"
                                >
                                    View Pricing
                                </a>
                            </div>

                            <div className="flex justify-center items-center gap-6 pt-6 flex-wrap text-sm text-gray-500 font-medium">
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free Unlimited Drafts</span>
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> LinkedIn Auto-Sync</span>
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Rs 99 Final Export</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="bg-[#050505] text-gray-400 relative overflow-hidden">
                {/* Top gradient border */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-5 space-y-6 lg:pr-12">
                            <div className="flex items-center">
                                <Image src="/logo.png" alt="ProfileBuilder Logo" width={140} height={40} className="h-8 w-auto object-contain" unoptimized />
                            </div>
                            <p className="text-base font-medium text-gray-500 leading-relaxed">
                                Engineered specifically for business owners, consultants, and leaders who need to command respect instantly. Turn your raw experience into a deal-closing asset.
                            </p>
                        </div>

                        {/* Navigation Columns */}
                        <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
                            {/* Product */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white">Product</h4>
                                <div className="flex flex-col gap-3">
                                    <a href="#features" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Executive Design</a>
                                    <a href="#process" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">2-Minute Process</a>
                                    <a href="#value" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Pricing (Rs 99)</a>
                                    <a href="#testimonials" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Proven Results</a>
                                </div>
                            </div>

                            {/* Resources */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white">Resources</h4>
                                <div className="flex flex-col gap-3">
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Agency Owners</a>
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Consultants</a>
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Freelancers</a>
                                    <a href="#faq" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">FAQ</a>
                                </div>
                            </div>

                            {/* Legal */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white">Legal</h4>
                                <div className="flex flex-col gap-3">
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Privacy Policy</a>
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Terms of Service</a>
                                    <a href="#" className="text-sm font-medium text-gray-500 hover:text-red-400 transition-colors">Bank-Level Security</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm font-medium text-gray-600">
                            © {new Date().getFullYear()} ProfileBuilder. All rights reserved.
                        </p>
                        <div className="flex gap-3">
                            {[
                                { icon: Twitter, label: 'Twitter' },
                                { icon: Linkedin, label: 'LinkedIn' },
                                { icon: Github, label: 'GitHub' },
                            ].map((social) => (
                                <a
                                    key={social.label}
                                    href="#"
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-full bg-[#111] hover:bg-red-600/10 flex items-center justify-center text-gray-500 hover:text-red-500 border border-white/5 hover:border-red-500/30 transition-all"
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
