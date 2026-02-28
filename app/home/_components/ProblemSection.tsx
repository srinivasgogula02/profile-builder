'use client';

import React from 'react';
import { Handshake, Plane, Globe, Bot, Mail, Smartphone } from 'lucide-react';

const problems = [
    {
        id: 1,
        icon: Handshake,
        title: 'Heading to Close a Deal?',
        desc: "Send your polished profile before you walk in. Decision-makers are 80% more likely to convert when they've reviewed your credibility upfront.",
        stat: '↑ 80% deal-close probability'
    },
    {
        id: 2,
        icon: Plane,
        title: 'Approaching a Global Client?',
        desc: "US, UK, UAE — executives in these markets make decisions in minutes. Your executive profile needs to speak their language, instantly.",
        stat: 'Trusted by 150+ MNCs'
    },
    {
        id: 3,
        icon: Globe,
        title: 'New Networking Event?',
        desc: "Walking into a BNI meeting, investor pitch, or industry summit? Share your profile link before the event. Arrive already introduced.",
        stat: 'QR code & PDF ready'
    },
    {
        id: 4,
        icon: Bot,
        title: 'Partnership Conversations?',
        desc: "When a potential co-founder or strategic partner asks \"tell me about yourself\" — give them something they can share with their board.",
        stat: 'Board-room ready format'
    },
    {
        id: 5,
        icon: Mail,
        title: 'Sending a Proposal?',
        desc: "Attach your profile to every email proposal. Companies that include a founder bio in proposals see 3× higher response rates.",
        stat: '↑ 3× response rate'
    },
    {
        id: 6,
        icon: Smartphone,
        title: 'Social Introduction?',
        desc: "Use it as your WhatsApp bio link, LinkedIn cover, or email signature attachment. Your profile works 24/7 even when you're not in the room.",
        stat: 'Shareable in one tap'
    }
];

export default function ProblemSection() {
    return (
        <section id="problem" className="py-20 bg-[#050505]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-[12px] font-mono text-red-500 tracking-[2px] uppercase mb-4">
                    The Business Owner's Reality
                </div>
                <h2 className="text-4xl md:text-6xl font-bold font-bebas leading-[1.05] tracking-tight mb-5 text-white">
                    You Are Closing Deals.<br />Your Profile Should Help.
                </h2>
                <p className="text-lg text-gray-400 max-w-2xl leading-[1.7]">
                    Whether you're walking into a partnership meeting, pitching a US client, or being introduced at a BNI chapter — your profile is your handshake before you shake hands.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
                    {problems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.id} className="bg-[#111] border border-white/10 rounded-xl p-7 transition-all duration-300 hover:border-red-500/30 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(232,25,44,0.1)] group">
                                <Icon className="w-8 h-8 text-white mb-4 group-hover:text-red-500 transition-colors" />
                                <h3 className="font-semibold text-[17px] text-white mb-2">{item.title}</h3>
                                <p className="text-[14px] text-gray-400 leading-[1.6]">
                                    {item.desc}
                                </p>
                                <div className="mt-4 font-mono text-[13px] text-red-400 bg-red-500/10 px-3 py-1.5 rounded-md inline-block">
                                    {item.stat}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
