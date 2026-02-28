'use client';

import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function CtaSection() {
    return (
        <section id="cta-final" className="py-32 bg-[url('/bg-grid.svg')] relative border-t border-white/5 text-center px-6">
            {/* Radial Gradient overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,25,44,0.18)_0%,transparent_70%)] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full py-1.5 px-4 font-mono text-[12px] text-red-500 tracking-wide uppercase mb-6">
                    <Zap className="w-3 h-3" /> Your profile is 2 minutes away
                </div>

                <h2 className="text-5xl md:text-7xl font-bold font-bebas leading-[1.1] mb-6 text-white tracking-tight">
                    Stop Losing Deals<br />Because Your Profile<br />Isn't Ready.
                </h2>

                <p className="text-[18px] text-gray-400 mb-10 leading-[1.6] max-w-2xl mx-auto">
                    1,500+ business owners across India are already closing deals with their OnEasy profiles.<br className="hidden md:block" />For ₹99, your profile will work harder than your competition's entire pitch deck.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="#how"
                        className="bg-red-600 hover:bg-red-500 text-white py-4 px-10 rounded-lg font-bold text-[18px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(232,25,44,0.4)] w-full sm:w-auto text-center pointer-events-auto"
                    >
                        Build My Profile Now — ₹99 →
                    </Link>
                    <Link
                        href="#how"
                        className="bg-transparent border border-white/20 hover:border-red-500/30 hover:text-red-500 text-white py-4 px-10 rounded-lg font-semibold text-[18px] transition-all duration-300 w-full sm:w-auto text-center"
                    >
                        Try Free First
                    </Link>
                </div>

                <p className="mt-6 text-[13px] text-gray-500">
                    No subscription · Pay only when you export · Takes 2 minutes
                </p>
            </div>
        </section>
    );
}
