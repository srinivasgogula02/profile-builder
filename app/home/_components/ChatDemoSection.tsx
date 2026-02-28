'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Check } from 'lucide-react';

const messagesList = [
    { type: 'user', text: "Hey! I have a client meeting in 30 mins and they just asked for my profile. I have nothing ready 😰" },
    { type: 'agent', text: "Don't worry at all! 😊 We'll have your complete executive profile ready in under <strong class='text-red-400 font-medium'>2 minutes</strong>. No hours. No stress. Let's go." },
    { type: 'agent', text: "Quick — do you have your LinkedIn URL? Or shall I ask you a few fast questions?" },
    { type: 'user', text: "I'll paste my LinkedIn. linkedin.com/in/rajesh-nair-business" },
    { type: 'agent', text: "✦ Extracting your profile... Done! I've pulled your 14 years of experience, 3 companies, key achievements and skills." },
    { type: 'agent', text: "Your executive profile is being built right now. I'm applying our AI value translation — turning your experience into the language your client understands. 🚀" },
    { type: 'user', text: "This is insane. How much does this cost?" },
    { type: 'agent', text: "Just <strong class='text-red-400 font-medium'>₹99 — one-time</strong>. No subscription. No hidden fees. And your profile is yours to keep, update, and share forever." },
    { type: 'agent', text: "✅ Your profile is ready! Export as PDF, share via link, or scan QR code. Send it to your client now — you've got 27 minutes to spare. 🎉" },
];

export default function ChatDemoSection() {
    const [messages, setMessages] = useState<any[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasStarted) {
                setHasStarted(true);
            }
        }, { threshold: 0.3 });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        let msgIdx = 0;
        let isCancelled = false;
        let timerId: NodeJS.Timeout;

        const showNextMessage = () => {
            if (isCancelled) return;
            if (msgIdx >= messagesList.length) {
                timerId = setTimeout(() => {
                    if (isCancelled) return;
                    setMessages([]);
                    msgIdx = 0;
                    timerId = setTimeout(showNextMessage, 1200);
                }, 5000);
                return;
            }

            const m = messagesList[msgIdx];
            if (m.type === 'agent') {
                setIsTyping(true);
            }

            const delay = m.type === 'agent' ? 1400 : 600;

            timerId = setTimeout(() => {
                if (isCancelled) return;
                setIsTyping(false);
                setMessages(prev => [...prev, m]);
                msgIdx++;

                const nextDelay = m.type === 'user' ? 1000 : 2200;
                timerId = setTimeout(showNextMessage, nextDelay);
            }, delay);
        };

        showNextMessage();

        return () => {
            isCancelled = true;
            clearTimeout(timerId);
        };
    }, [hasStarted]);

    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    return (
        <section id="chat-demo" className="py-20 bg-[#050505]" ref={containerRef}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

                    <div className="flex flex-col justify-center">
                        <div className="text-[12px] font-mono text-red-500 tracking-[2px] uppercase mb-4">
                            Live AI Chat
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold font-bebas leading-[1.1] mb-5 text-white">
                            Talk to It.<br />Your Profile<br />Appears in Real Time.
                        </h2>
                        <p className="text-[16px] text-gray-400 leading-[1.7] mb-8">
                            No forms to fill. No templates to wrestle with. Just a conversation — and your executive profile builds itself as you talk.
                        </p>

                        <div className="flex flex-col gap-3">
                            {[
                                "Understands plain, unstructured language",
                                "Asks smart follow-up questions to fill gaps",
                                "Builds your profile in the background as you chat",
                                "Shows live preview — edit anything, anytime",
                                "Export ready in under 2 minutes from first message"
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3 text-[15px] text-white">
                                    <div className="w-5 h-5 shrink-0 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-red-500" />
                                    </div>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center mt-10 lg:mt-0">
                        <div className="w-[280px] sm:w-[300px] bg-[#0E0E0E] rounded-[40px] border-[2px] border-white/10 p-4 shadow-[0_40px_100px_rgba(0,0,0,0.7),inset_0_0_30px_rgba(0,0,0,0.5)] relative animate-[float_4.5s_ease-in-out_infinite]">
                            {/* Notch */}
                            <div className="w-[100px] h-[22px] bg-[#0E0E0E] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-[16px] border border-white/5 z-10 hidden sm:block"></div>

                            {/* Header */}
                            <div className="text-center pb-4 border-b border-white/5 mb-4 mt-2 sm:mt-4">
                                <div className="text-[13px] font-semibold text-white">OnEasy Profile AI ✦</div>
                                <div className="text-[11px] text-[#6bff9e] flex items-center justify-center gap-1 mt-0.5">
                                    <span className="text-[7px]">●</span> Online — Ready to build
                                </div>
                            </div>

                            {/* Chat Window */}
                            <div ref={chatWindowRef} className="h-[360px] overflow-y-auto flex flex-col gap-2.5 pb-2 pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {messages.map((m, i) => (
                                    <div
                                        key={i}
                                        className={`max-w-[85%] p-2.5 px-3.5 rounded-[14px] text-[13px] leading-[1.5] animate-fade-in-up ${m.type === 'user' ? 'bg-red-600 text-white rounded-br-[4px] self-end' : 'bg-[#181818] border border-white/5 text-white rounded-bl-[4px] self-start'}`}
                                        dangerouslySetInnerHTML={{ __html: m.text }}
                                    />
                                ))}
                                {isTyping && (
                                    <div className="flex gap-1 items-center p-2.5 px-3.5 bg-[#181818] border border-white/5 rounded-[14px] rounded-bl-[4px] self-start w-[52px]">
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[typing_1.2s_infinite]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[typing_1.2s_infinite_0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-[typing_1.2s_infinite_0.4s]"></div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 text-center bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/30 rounded-xl p-3.5">
                                <div className="font-bebas text-3xl md:text-4xl text-red-500 leading-none mb-1">₹99</div>
                                <div className="text-[11px] md:text-[12px] text-gray-400">One-time · No subscription · Yours forever</div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Inject custom animation keyframes for chat */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes typing {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s ease forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </section>
    );
}
