'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Sparkles, Shield, Zap, FileCheck, Menu, X } from 'lucide-react';

export default function Hero() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHeroVisible(true);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div ref={heroRef} className="relative overflow-hidden bg-white text-[#03334c] selection:bg-[#03334c] selection:text-white">

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Gradient orbs */}
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#03334c]/[0.04] to-blue-400/[0.06] blur-[100px] m-float" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-blue-100/40 to-indigo-100/30 blur-[80px] m-float-delayed" />
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-sky-100/30 to-transparent blur-[60px]" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #03334c 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* ── Navbar ───────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                ? 'm-glass shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-white/20'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image src="/logo.png" alt="OnEasy" width={120} height={40} className="h-9 w-auto" priority />
                        <span className="text-xl font-bold tracking-tight text-[#03334c]">
                            ProfileBuilder
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {[
                            { label: 'Features', href: '#features' },
                            { label: 'How it Works', href: '#how-it-works' },
                            { label: 'Testimonials', href: '#testimonials' },
                            { label: 'FAQ', href: '#faq' },
                        ].map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-4 py-2 text-[13px] font-medium text-slate-500 hover:text-[#03334c] hover:bg-slate-50/80 rounded-lg transition-all"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/chat"
                            className="px-5 py-2 text-[13px] font-semibold text-slate-500 hover:text-[#03334c] transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/chat"
                            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-[#03334c] text-white hover:bg-[#02283b] shadow-lg shadow-[#03334c]/15 hover:shadow-[#03334c]/25 transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2"
                        >
                            Build Profile <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 text-[#03334c]"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden m-glass border-t border-white/20 shadow-lg">
                        <div className="px-6 py-4 space-y-1">
                            {['Features', 'How it Works', 'Testimonials', 'FAQ'].map((label) => (
                                <a
                                    key={label}
                                    href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="block px-4 py-3 text-sm font-medium text-slate-600 hover:text-[#03334c] hover:bg-slate-50 rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {label}
                                </a>
                            ))}
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                <Link href="/chat" className="px-4 py-3 text-sm font-semibold text-slate-600 hover:text-[#03334c]">Sign In</Link>
                                <Link href="/chat" className="px-4 py-3 text-sm font-semibold bg-[#03334c] text-white rounded-xl text-center">Build Profile</Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── Hero Content ──────────────────────────────────────────── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 lg:pt-40 lg:pb-32 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

                {/* Left Column */}
                <div className="space-y-8" style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#03334c]/[0.06] to-blue-500/[0.06] border border-[#03334c]/10 text-[#03334c] text-xs font-bold tracking-wider uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI-Powered Profile Generator</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.08] tracking-tight text-[#03334c]">
                        Your Professional Story,{' '}
                        <span className="relative inline-block">
                            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#03334c] via-blue-600 to-[#03334c] m-gradient-shift">
                                Reimagined by AI.
                            </span>
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
                        Transform your LinkedIn profile into a stunning, print-ready professional one-pager in seconds. No design skills needed — our AI does the heavy lifting.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Link
                            href="/chat"
                            className="group px-8 py-4 rounded-2xl text-[15px] font-bold bg-[#03334c] text-white hover:bg-[#02283b] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-[#03334c]/15 hover:shadow-[#03334c]/25 flex items-center justify-center gap-2.5"
                        >
                            Start for Free
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <a
                            href="#how-it-works"
                            className="px-8 py-4 rounded-2xl text-[15px] font-bold text-[#03334c] border border-slate-200 hover:border-[#03334c]/20 hover:bg-slate-50/80 transition-all hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center"
                        >
                            See How It Works
                        </a>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center gap-6 pt-6">
                        <div className="flex -space-x-2.5">
                            {['A', 'S', 'M', 'R'].map((initial, i) => (
                                <div
                                    key={i}
                                    className="w-10 h-10 rounded-full border-[2.5px] border-white shadow-sm flex items-center justify-center text-xs font-bold"
                                    style={{
                                        background: [
                                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                        ][i],
                                        color: 'white'
                                    }}
                                >
                                    {initial}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-[2.5px] border-white bg-[#03334c] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                +2k
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                                <span className="ml-1.5 text-sm font-semibold text-[#03334c]">4.9</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Trusted by 2,000+ professionals</p>
                        </div>
                    </div>
                </div>

                {/* Right Column — Profile Mockup */}
                <div className="relative" style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                }}>
                    {/* Glow behind card */}
                    <div className="absolute -inset-8 bg-gradient-to-br from-[#03334c]/[0.04] to-blue-500/[0.06] rounded-[40px] blur-[40px]" />

                    {/* Main Card */}
                    <div className="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] border border-slate-100/80 overflow-hidden m-pulse-glow">
                        {/* Browser chrome */}
                        <div className="h-10 bg-slate-50/80 border-b border-slate-100 flex items-center px-4 gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-300/60" />
                                <div className="w-3 h-3 rounded-full bg-amber-300/60" />
                                <div className="w-3 h-3 rounded-full bg-green-300/60" />
                            </div>
                            <div className="flex-1 mx-4">
                                <div className="h-5 bg-white rounded-md border border-slate-100 flex items-center px-3">
                                    <span className="text-[10px] text-slate-300 font-medium">profilebuilder.com/preview</span>
                                </div>
                            </div>
                        </div>

                        {/* Document Preview */}
                        <div className="p-6 bg-gradient-to-b from-slate-50/50 to-white">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 aspect-[1/1.2] flex flex-col gap-5 relative overflow-hidden">
                                {/* Profile Header */}
                                <div className="flex items-start gap-4 pb-4 border-b border-slate-50">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#03334c] to-blue-600 shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        JD
                                    </div>
                                    <div className="space-y-2 flex-1 pt-0.5">
                                        <div className="h-4 bg-[#03334c] rounded-md w-3/4" />
                                        <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                                        <div className="flex gap-1.5 mt-1">
                                            <div className="px-2 py-0.5 bg-blue-50 rounded text-[8px] text-blue-600 font-medium">Product</div>
                                            <div className="px-2 py-0.5 bg-green-50 rounded text-[8px] text-green-600 font-medium">Strategy</div>
                                            <div className="px-2 py-0.5 bg-purple-50 rounded text-[8px] text-purple-600 font-medium">AI/ML</div>
                                        </div>
                                    </div>
                                </div>

                                {/* About */}
                                <div className="space-y-2">
                                    <div className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">About</div>
                                    <div className="space-y-1.5">
                                        <div className="h-2 bg-slate-100 rounded-full w-full" />
                                        <div className="h-2 bg-slate-100 rounded-full w-full" />
                                        <div className="h-2 bg-slate-100 rounded-full w-4/5" />
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="space-y-3">
                                    <div className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">Experience</div>
                                    {[
                                        { color: 'from-blue-500 to-indigo-500', w1: '60%', w2: '45%' },
                                        { color: 'from-emerald-500 to-teal-500', w1: '55%', w2: '40%' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} shrink-0 opacity-20`} />
                                            <div className="flex-1 space-y-1">
                                                <div className="h-2.5 bg-slate-200 rounded" style={{ width: item.w1 }} />
                                                <div className="h-2 bg-slate-100 rounded" style={{ width: item.w2 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Skills */}
                                <div className="space-y-2">
                                    <div className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">Skills</div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[45, 55, 40, 50, 35].map((w, i) => (
                                            <div key={i} className="h-5 bg-slate-50 border border-slate-100 rounded-md" style={{ width: `${w}px` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Floating Badges ── */}
                    {/* Top-right badge */}
                    <div className="absolute -top-3 -right-3 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100 p-3 flex items-center gap-2.5 m-float">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileCheck className="w-4.5 h-4.5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#03334c]">ATS Ready</div>
                            <div className="text-[9px] text-slate-400 font-medium">Score: 98%</div>
                        </div>
                    </div>

                    {/* Bottom-left badge */}
                    <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100 p-3 flex items-center gap-2.5 m-float-delayed">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Zap className="w-4.5 h-4.5 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-[#03334c]">AI Enhanced</div>
                            <div className="text-[9px] text-slate-400 font-medium">15 improvements</div>
                        </div>
                    </div>

                    {/* Security badge */}
                    <div className="absolute top-1/2 -left-6 -translate-y-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-100 p-2.5 m-bounce-subtle hidden lg:flex">
                        <div className="w-8 h-8 rounded-lg bg-[#03334c]/5 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-[#03334c]" />
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#03334c]/[0.03] rounded-3xl rotate-12 -z-10" />
                    <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-50/50 rounded-full -z-10" />
                </div>
            </div>

            {/* ── Metrics Bar ──────────────────────────────────────────── */}
            <div className="relative z-10 border-t border-slate-100 bg-slate-50/50" style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
            }}>
                <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { value: '2,000+', label: 'Profiles Created' },
                        { value: '< 30s', label: 'Average Build Time' },
                        { value: '98%', label: 'ATS Pass Rate' },
                        { value: '4.9★', label: 'User Rating' },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl lg:text-3xl font-bold text-[#03334c] tracking-tight">{stat.value}</div>
                            <div className="text-xs text-slate-400 font-medium mt-1 tracking-wide uppercase">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
