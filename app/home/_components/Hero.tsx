'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Menu, X, CheckCircle, TrendingUp } from 'lucide-react';

const TYPEWRITER_PHRASES = [
    "that can close a deal.",
    "to share with your partner.",
    "as a powerful introduction.",
    "as your executive header.",
    "for investor outreach."
];

export default function Hero() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [heroVisible, setHeroVisible] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);

    // Typewriter State
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        // Hero visibility
        const visibilityTimeout = setTimeout(() => setHeroVisible(true), 10);

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(visibilityTimeout);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Typewriter Effect Logic
    useEffect(() => {
        const typeSpeed = isDeleting ? 30 : 60;
        const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];

        const timer = setTimeout(() => {
            if (!isDeleting && currentText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), 2500); // pause at end of phrase
            } else if (isDeleting && currentText === "") {
                setIsDeleting(false);
                setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
            } else {
                setCurrentText(currentPhrase.substring(0, currentText.length + (isDeleting ? -1 : 1)));
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [currentText, isDeleting, phraseIndex]);

    return (
        <div ref={heroRef} className="relative overflow-hidden bg-[#050505] text-white selection:bg-red-600 selection:text-white min-h-screen flex flex-col justify-center">

            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Premium Red Glows */}
                <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-red-600/[0.15] to-transparent blur-[120px] m-float" />
                <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-red-800/[0.1] to-transparent blur-[100px] m-float-delayed" />

                {/* Grid pattern (Dark Mode) */}
                <div
                    className="absolute inset-0 opacity-[0.2]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* ── Navbar ───────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                ? 'bg-[#050505]/90 backdrop-blur-md shadow-[0_4px_30px_-10px_rgba(0,0,0,0.8)] border-b border-white/10'
                : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[76px]">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image src="/logo.png" alt="ProfileBuilder Logo" width={140} height={40} className="h-8 w-auto object-contain" unoptimized priority />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-2">
                        {[
                            { label: 'Use Cases', href: '#use-cases' },
                            { label: 'Features', href: '#features' },
                            { label: 'Testimonials', href: '#testimonials' },
                            { label: 'Enterprise', href: '#enterprise' },
                        ].map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="px-4 py-2 text-[14px] font-semibold text-gray-300 hover:text-white transition-all relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-red-500 hover:after:w-1/2 after:transition-all after:duration-300"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/chat"
                            className="text-[14px] font-semibold text-gray-300 hover:text-white transition-colors"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/chat"
                            className="px-6 py-2.5 rounded-xl text-[14px] font-bold bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Start Building <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 shadow-2xl absolute w-full left-0">
                        <div className="px-6 py-6 space-y-2">
                            {['Use Cases', 'Features', 'Testimonials', 'Enterprise'].map((label) => (
                                <a
                                    key={label}
                                    href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="block px-4 py-3 text-base font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {label}
                                </a>
                            ))}
                            <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-3">
                                <Link href="/chat" className="px-4 py-3 text-base font-semibold text-center text-white bg-white/5 rounded-xl hover:bg-white/10">Log In</Link>
                                <Link href="/chat" className="px-4 py-3 text-base font-bold bg-red-600 text-white rounded-xl text-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">Start Building Free</Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── Hero Content ──────────────────────────────────────────── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 lg:pt-40 lg:pb-32 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center flex-1">

                {/* Left Column - Copy */}
                <div className="space-y-8" style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        <TrendingUp className="w-4 h-4" />
                        <span>For Diversified Business Owners</span>
                    </div>

                    {/* Headline with Typewriter */}
                    <div className="min-h-[160px] sm:min-h-[200px] lg:min-h-[220px]">
                        <h1 className="text-[2.75rem] sm:text-[4rem] lg:text-[4.5rem] font-black leading-[1.1] tracking-tight text-white mb-2">
                            Build your personal profile
                        </h1>
                        <h2 className="text-[2rem] sm:text-[3rem] font-bold text-red-500 h-[60px] sm:h-[80px] flex items-center">
                            <span className="border-r-4 border-red-500 pr-2 animate-pulse">
                                {currentText}
                            </span>
                        </h2>
                    </div>

                    {/* Subheading */}
                    <div className="space-y-4">
                        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                            Stop wasting hours formatting PDFs that get ignored. We translate your varied expertise into a stunning, high-impact executive 1-pager in seconds. Give yourself the premium edge before you even walk in the room.
                        </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link
                            href="/chat"
                            className="group px-8 py-4 rounded-xl text-[16px] font-bold bg-white text-black hover:bg-gray-200 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            Build My Professional Profile
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#use-cases"
                            className="px-8 py-4 rounded-xl text-[16px] font-bold text-white bg-transparent border border-white/20 hover:border-white/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            View Examples
                        </a>
                    </div>

                    <p className="text-sm font-semibold text-gray-500 mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-red-500" /> No design skills required. Free to try.
                    </p>
                </div>

                {/* Right Column — Target Image */}
                <div className="relative h-full flex items-center justify-center mt-10 lg:mt-0" style={{
                    opacity: heroVisible ? 1 : 0,
                    transform: heroVisible ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                }}>
                    <div className="relative w-full max-w-lg aspect-square lg:aspect-[4/3] flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-600/10 blur-[60px] rounded-full z-0" />

                        <Image
                            src="/hero-image.png"
                            alt="ProfileBuilder Impact"
                            fill
                            className="object-contain drop-shadow-[0_0_40px_rgba(239,68,68,0.3)] z-10 
                                     mix-blend-screen"
                            priority
                            unoptimized
                        />
                    </div>
                </div>
            </div>

            {/* ── Social Proof Bar ──────────────────────────────────────────── */}
            <div className="relative z-10 border-t border-white/10 bg-[#0A0A0A]" style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
            }}>
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <p className="text-center text-sm font-bold tracking-widest text-gray-500 uppercase mb-8">
                        Trusted by elite professionals across networks
                    </p>
                    <div className="overflow-hidden whitespace-nowrap relative w-full opacity-40 grayscale hover:grayscale-0 transition-all duration-500 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes marquee {
                                0% { transform: translateX(0); }
                                100% { transform: translateX(-50%); }
                            }
                        `}} />
                        <div className="flex w-max gap-8 md:gap-16 items-center hover:[animation-play-state:paused]" style={{ animation: 'marquee 40s linear infinite' }}>
                            {/* Original */}
                            <div className="text-xl font-black tracking-tighter text-white">Microsoft</div>
                            <div className="text-xl font-serif font-bold text-white">McKinsey</div>
                            <div className="text-lg font-bold tracking-widest uppercase text-white">Amazon</div>
                            <div className="text-xl font-extrabold text-[#00a1e0]">Salesforce</div>
                            <div className="text-lg font-black tracking-tight italic text-white">Deloitte</div>
                            {/* New Companies */}
                            <div className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Google</div>
                            <div className="text-xl font-semibold tracking-wide text-white">Apple</div>
                            <div className="text-xl font-bold text-blue-500">Meta</div>
                            <div className="text-xl font-black tracking-widest text-[#E50914]">Netflix</div>
                            <div className="text-lg font-bold text-[#0f62fe]">IBM</div>
                            <div className="text-xl font-serif text-[#7396c8]">Goldman Sachs</div>
                            <div className="text-xl font-serif font-bold text-white">J.P. Morgan</div>
                            <div className="text-xl font-bold text-[#eb8c00]">PwC</div>
                            <div className="text-xl font-black italic text-[#ffe600]">EY</div>
                            <div className="text-xl font-bold tracking-widest text-[#00338d]">KPMG</div>
                            
                            {/* Duplicate for seamless infinite scrolling */}
                            <div className="text-xl font-black tracking-tighter text-white">Microsoft</div>
                            <div className="text-xl font-serif font-bold text-white">McKinsey</div>
                            <div className="text-lg font-bold tracking-widest uppercase text-white">Amazon</div>
                            <div className="text-xl font-extrabold text-[#00a1e0]">Salesforce</div>
                            <div className="text-lg font-black tracking-tight italic text-white">Deloitte</div>
                            <div className="text-xl font-bold tracking-tight text-white drop-shadow-sm">Google</div>
                            <div className="text-xl font-semibold tracking-wide text-white">Apple</div>
                            <div className="text-xl font-bold text-blue-500">Meta</div>
                            <div className="text-xl font-black tracking-widest text-[#E50914]">Netflix</div>
                            <div className="text-lg font-bold text-[#0f62fe]">IBM</div>
                            <div className="text-xl font-serif text-[#7396c8]">Goldman Sachs</div>
                            <div className="text-xl font-serif font-bold text-white">J.P. Morgan</div>
                            <div className="text-xl font-bold text-[#eb8c00]">PwC</div>
                            <div className="text-xl font-black italic text-[#ffe600]">EY</div>
                            <div className="text-xl font-bold tracking-widest text-[#00338d]">KPMG</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
