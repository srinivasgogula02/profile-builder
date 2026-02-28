'use client';

import React from 'react';

const benefits = [
    {
        num: '01',
        title: 'Free to Start — Unlimited Tries',
        desc: "Create, preview, and refine your profile as many times as you want. Pay only when you're 100% happy and ready to export. No credit card needed to get started."
    },
    {
        num: '02',
        title: 'Under 2 Minutes — Guaranteed',
        desc: "We've timed it with 1,500+ users across industries. From first message to shareable PDF — it's always under 2 minutes. Not 2 hours. Not 2 days. 2 minutes."
    },
    {
        num: '03',
        title: 'LinkedIn Import — One Click',
        desc: "Paste your LinkedIn URL and we extract your entire professional story automatically. No re-typing. No copy-pasting. Just instant, structured data pulled straight from your existing profile."
    },
    {
        num: '04',
        title: 'Close Deals Faster',
        desc: "Business owners who share their OnEasy profile before a meeting report 80% higher first-meeting conversion. Your profile works before you even say hello."
    },
    {
        num: '05',
        title: 'Works for Every Industry',
        desc: "Manufacturer in Pune. Tech founder in Bengaluru. CA in Hyderabad. Retailer in Delhi. Our AI adapts the language and structure to your specific industry and audience."
    },
    {
        num: '06',
        title: 'Always Up-to-Date',
        desc: "Landed a new client? Expanded to a new city? Update your profile in 30 seconds flat. Your profile is a living document — always current, always impressive."
    }
];

export default function BenefitsSection() {
    return (
        <section id="free-benefits" className="py-20 bg-[#111]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-[12px] font-mono text-red-500 tracking-[2px] uppercase mb-4 text-center">
                    Why Business Owners Choose OnEasy
                </div>
                <h2 className="text-4xl md:text-5xl font-bold font-bebas leading-[1.1] tracking-tight mb-14 text-center text-white">
                    Everything You Need.<br />Nothing You Don't.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {benefits.map((b, idx) => (
                        <div key={idx} className="bg-[#050505] border border-white/10 rounded-xl p-8 flex gap-6 items-start transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_16px_40px_rgba(232,25,44,0.08)]">
                            <div className="font-bebas text-5xl text-red-500/25 leading-none shrink-0">
                                {b.num}
                            </div>
                            <div>
                                <h3 className="text-[18px] font-semibold mb-2.5 text-white">{b.title}</h3>
                                <p className="text-[14px] text-gray-400 leading-[1.65]">
                                    {b.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
