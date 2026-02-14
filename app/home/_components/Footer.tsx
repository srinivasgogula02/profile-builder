'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Twitter, Linkedin, Github } from 'lucide-react';

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
            <section ref={ctaRef} className="py-20 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div
                        className="relative bg-[#03334c] rounded-3xl p-12 md:p-16 text-center overflow-hidden"
                        style={{
                            opacity: ctaVisible ? 1 : 0,
                            transform: ctaVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
                            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {/* Background decoration */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-[40%] -right-[20%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-[30%] -left-[10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[80px]" />
                            <div
                                className="absolute inset-0 opacity-[0.04]"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                }}
                            />
                        </div>

                        <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                                Ready to build your professional profile?
                            </h2>
                            <p className="text-blue-100/70 text-lg leading-relaxed">
                                Join 2,000+ professionals who trust ProfileBuilder to present their best selves. It takes less than 30 seconds.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <Link
                                    href="/chat"
                                    className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold bg-white text-[#03334c] hover:bg-blue-50 transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="inline-flex items-center justify-center px-8 py-4 rounded-2xl text-[15px] font-bold text-white/80 border border-white/20 hover:bg-white/10 hover:text-white transition-all"
                                >
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <footer className="bg-[#03334c] text-slate-300 relative overflow-hidden">
                {/* Top gradient border */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 py-14">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-1 space-y-4">
                            <div className="flex items-center">
                                <Image src="/logo.png" alt="OnEasy" width={120} height={40} className="h-8 w-auto brightness-0 invert" />
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                AI-powered professional profile generator. Turn your LinkedIn into a stunning one-pager.
                            </p>
                        </div>

                        {/* Product */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Product</h4>
                            <div className="flex flex-col gap-2.5">
                                <a href="#features" className="text-sm hover:text-white transition-colors">Features</a>
                                <a href="#how-it-works" className="text-sm hover:text-white transition-colors">How it Works</a>
                                <a href="#testimonials" className="text-sm hover:text-white transition-colors">Testimonials</a>
                                <a href="#faq" className="text-sm hover:text-white transition-colors">FAQ</a>
                            </div>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Company</h4>
                            <div className="flex flex-col gap-2.5">
                                <a href="#" className="text-sm hover:text-white transition-colors">About</a>
                                <a href="#" className="text-sm hover:text-white transition-colors">Blog</a>
                                <a href="#" className="text-sm hover:text-white transition-colors">Careers</a>
                                <a href="#" className="text-sm hover:text-white transition-colors">Contact</a>
                            </div>
                        </div>

                        {/* Legal */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Legal</h4>
                            <div className="flex flex-col gap-2.5">
                                <a href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="text-sm hover:text-white transition-colors">Terms of Service</a>
                                <a href="#" className="text-sm hover:text-white transition-colors">Cookie Policy</a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © 2026 ProfileBuilder. All rights reserved.
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
                                    className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-all"
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
