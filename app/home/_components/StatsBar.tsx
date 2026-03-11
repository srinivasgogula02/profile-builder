'use client';

import React from 'react';

const stats = [
    { num: '1500+', desc: 'Business owners served' },
    { num: '2 MIN', desc: 'Average build time' },
    { num: '₹99', desc: 'Per profile — just once' },
    { num: '80%', desc: 'Higher deal-close probability' }
];

export default function StatsBar() {
    return (
        <section className="py-10 px-6 bg-[#111] border-y border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-10 lg:gap-0">
                    {stats.map((stat, i) => (
                        <div key={i} className="w-1/2 md:w-auto text-center px-4 md:px-12 relative md:after:block after:hidden after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-12 after:w-[1px] after:bg-white/5 last:after:hidden">
                            <div className="text-4xl md:text-5xl font-bold text-red-500 mb-2 font-bebas tracking-wide">
                                {stat.num}
                            </div>
                            <div className="text-sm md:text-sm text-gray-400 font-medium tracking-wide">
                                {stat.desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
