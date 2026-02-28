"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, X, Gift } from "lucide-react";
import { TRIAL_END_MS, msToTimeLeft, TimeLeft } from "@/app/lib/trial";

interface TrialBannerProps {
    /** Called when the trial expires while the banner is mounted */
    onExpired?: () => void;
}

function Digit({ value, label }: { value: number; label: string }) {
    const str = String(value).padStart(2, "0");
    return (
        <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-0.5">
                {str.split("").map((d, i) => (
                    <div
                        key={i}
                        className="w-7 h-9 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-black text-base tabular-nums border border-white/10 shadow-inner"
                    >
                        {d}
                    </div>
                ))}
            </div>
            <span className="text-[8px] uppercase tracking-widest text-white/50 font-bold">{label}</span>
        </div>
    );
}

export default function TrialBanner({ onExpired }: TrialBannerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
        msToTimeLeft(Math.max(0, TRIAL_END_MS - Date.now()))
    );
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Don't run if already expired or dismissed
        if (timeLeft.total === 0) return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, TRIAL_END_MS - Date.now());
            setTimeLeft(msToTimeLeft(remaining));
            if (remaining === 0) {
                clearInterval(interval);
                onExpired?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [onExpired, timeLeft.total]);

    // Don't show if expired or dismissed
    if (timeLeft.total === 0 || dismissed) return null;

    const isLastHour = timeLeft.days === 0 && timeLeft.hours === 0;
    const isLastDay = timeLeft.days === 0;

    return (
        <div
            className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[9990] transition-all duration-500 ${isLastHour
                    ? "animate-pulse-slow"
                    : ""
                }`}
            role="status"
            aria-live="polite"
        >
            <div
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl select-none ${isLastHour
                        ? "bg-gradient-to-r from-rose-600 to-orange-500 border-rose-400/30 shadow-rose-500/30"
                        : isLastDay
                            ? "bg-gradient-to-r from-amber-600 to-orange-500 border-amber-400/30 shadow-amber-500/30"
                            : "bg-gradient-to-r from-[#01334c] to-[#0a6b8a] border-[#01334c]/30 shadow-[#01334c]/30"
                    }`}
            >
                {/* Icon + label */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                        {isLastHour ? (
                            <Clock className="w-4 h-4 text-white animate-spin" style={{ animationDuration: "3s" }} />
                        ) : (
                            <Gift className="w-4 h-4 text-white" />
                        )}
                    </div>
                    <div>
                        <p className="text-white font-black text-xs tracking-wide leading-tight">
                            {isLastHour ? "Ending Soon!" : "🎁 Free Access"}
                        </p>
                        <p className="text-white/60 text-[9px] font-medium leading-tight">
                            {isLastHour
                                ? "Last chance — templates & downloads free"
                                : "All premium features unlocked"}
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-white/20 flex-shrink-0" />

                {/* Countdown */}
                <div className="flex items-end gap-2">
                    {timeLeft.days > 0 && (
                        <>
                            <Digit value={timeLeft.days} label="days" />
                            <span className="text-white/50 font-black text-lg pb-3.5">:</span>
                        </>
                    )}
                    <Digit value={timeLeft.hours} label="hrs" />
                    <span className="text-white/50 font-black text-lg pb-3.5">:</span>
                    <Digit value={timeLeft.minutes} label="min" />
                    <span className="text-white/50 font-black text-lg pb-3.5">:</span>
                    <Digit value={timeLeft.seconds} label="sec" />
                </div>

                {/* Sparkle accent */}
                <div className="flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white/40" />
                </div>

                {/* Dismiss */}
                <button
                    onClick={() => setDismissed(true)}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-colors ml-1"
                    aria-label="Dismiss"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
