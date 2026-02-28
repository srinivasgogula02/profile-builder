"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    X, Star, Download, LayoutTemplate, Zap, Shield, CheckCircle2,
    Loader2, Lock, Sparkles, Trophy, ArrowRight,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { useProfileStore } from "@/app/lib/store";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BENEFITS = [
    { icon: LayoutTemplate, label: "15+ Premium Templates", sub: "Designer-crafted, ATS-friendly" },
    { icon: Download, label: "Unlimited PDF Downloads", sub: "High-quality, shareable files" },
    { icon: Zap, label: "Instant Access — Forever", sub: "One-time payment, no subscriptions" },
    { icon: Star, label: "Priority AI Enhancements", sub: "Smarter suggestions for your profile" },
];

function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
    const { user, setIsPremium } = useProfileStore();
    const [step, setStep] = useState<"offer" | "processing" | "success" | "error">("offer");
    const [errorMsg, setErrorMsg] = useState("");

    // Reset on open
    useEffect(() => {
        if (isOpen) setStep("offer");
    }, [isOpen]);

    const handlePay = useCallback(async () => {
        if (!user) return;

        setStep("processing");
        setErrorMsg("");

        try {
            // ── 1. Load the Razorpay script ──────────────────────────────────
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error("Failed to load payment gateway. Please check your internet connection.");

            // ── 2. Get session token ─────────────────────────────────────────
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Please log in to continue.");

            // ── 3. Create order on backend ───────────────────────────────────
            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) throw new Error(orderData.error || "Could not create payment order.");

            // Already paid (race condition safeguard)
            if (orderData.already_paid) {
                setIsPremium(true);
                setStep("success");
                return;
            }

            // ── 4. Open Razorpay checkout ────────────────────────────────────
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "ProfileArchitect AI",
                description: "Unlock All Templates & Downloads",
                image: "/favicon.ico",
                order_id: orderData.order_id,
                theme: { color: "#01334c" },
                prefill: {
                    email: user.email || "",
                    contact: (user.user_metadata?.phone || ""),
                },
                modal: {
                    ondismiss: () => {
                        // User closed Razorpay window without paying
                        setStep("offer");
                    },
                    confirm_close: true,
                },
                handler: async (response: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) => {
                    // ── 5. Verify signature on backend ───────────────────────
                    setStep("processing");
                    try {
                        const verifyRes = await fetch("/api/payment/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });
                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok || !verifyData.success) {
                            throw new Error(verifyData.error || "Payment verification failed.");
                        }

                        setIsPremium(true);
                        setStep("success");
                        setTimeout(onSuccess, 2000);
                    } catch (verifyErr: any) {
                        setErrorMsg(verifyErr.message);
                        setStep("error");
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (res: any) => {
                setErrorMsg(res.error?.description || "Payment failed. Please try again.");
                setStep("error");
            });
            rzp.open();
            setStep("offer"); // Reset to offer while Razorpay modal is open
        } catch (err: any) {
            setErrorMsg(err.message || "Something went wrong. Please try again.");
            setStep("error");
        }
    }, [user, setIsPremium, onSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                onClick={step === "success" ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 animate-scale-in">
                {/* Close */}
                {step !== "success" && step !== "processing" && (
                    <button
                        onClick={onClose}
                        className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/40">
                    {/* ── Success State ── */}
                    {step === "success" && (
                        <div className="flex flex-col items-center gap-4 py-14 px-8 text-center bg-gradient-to-b from-white to-emerald-50/40">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-300 animate-ping" style={{ animationDuration: "2s" }} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-1">You're Premium! ✨</h2>
                                <p className="text-sm text-slate-500 font-medium">All templates and downloads are now unlocked.</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                <Trophy className="w-4 h-4" />
                                <span>Welcome to the premium club</span>
                            </div>
                        </div>
                    )}

                    {/* ── Processing State ── */}
                    {step === "processing" && (
                        <div className="flex flex-col items-center gap-4 py-14 px-8 text-center">
                            <Loader2 className="w-10 h-10 text-[#01334c] animate-spin" />
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Verifying Payment...</h3>
                                <p className="text-sm text-slate-500 mt-1">Please don't close this window</p>
                            </div>
                        </div>
                    )}

                    {/* ── Error State ── */}
                    {step === "error" && (
                        <div className="flex flex-col items-center gap-5 py-10 px-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <X className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Payment Issue</h3>
                                <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
                            </div>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setStep("offer")}
                                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Offer State ── */}
                    {step === "offer" && (
                        <>
                            {/* Header gradient */}
                            <div className="bg-gradient-to-br from-[#01334c] via-[#024466] to-[#0a5c8a] px-7 pt-8 pb-6 text-center relative overflow-hidden">
                                {/* Decorative orb */}
                                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
                                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />

                                <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 px-3 py-1 rounded-full mb-4">
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    <span className="text-xs font-bold text-amber-200 tracking-wide">ONE-TIME UNLOCK</span>
                                </div>

                                <h2 className="text-2xl font-black text-white mb-1.5 leading-tight">
                                    Unlock Your Professional<br />Profile Forever
                                </h2>
                                <p className="text-sm text-white/60 font-medium">
                                    Everything you need to land your dream job
                                </p>

                                {/* Pricing */}
                                <div className="flex items-center justify-center gap-3 mt-5">
                                    <span className="text-white/40 line-through text-lg font-bold">₹499</span>
                                    <div className="flex items-end gap-1">
                                        <span className="text-5xl font-black text-white leading-none">₹99</span>
                                        <span className="text-white/50 text-sm pb-1">one-time</span>
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 mt-1.5">Save 80% — Limited time offer</p>
                            </div>

                            {/* Benefits */}
                            <div className="px-7 py-5 space-y-3">
                                {BENEFITS.map(({ icon: Icon, label, sub }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-[#01334c]/8 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-[#01334c]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 leading-tight">{label}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="px-7 pb-7 space-y-3">
                                <button
                                    onClick={handlePay}
                                    className="w-full py-4 rounded-2xl bg-[#01334c] text-white text-base font-black tracking-wide shadow-xl shadow-[#01334c]/30 hover:bg-[#024466] hover:shadow-[#01334c]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 group"
                                >
                                    <Lock className="w-4 h-4 group-hover:hidden" />
                                    <Sparkles className="w-4 h-4 hidden group-hover:block" />
                                    Pay ₹99 & Unlock Everything
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                {/* Trust row */}
                                <div className="flex items-center justify-center gap-4 pt-1">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                        <Shield className="w-3 h-3 text-emerald-500" />
                                        <span>Secure Payment</span>
                                    </div>
                                    <div className="w-px h-3 bg-slate-200" />
                                    <span className="text-[10px] text-slate-400 font-medium">Powered by Razorpay</span>
                                    <div className="w-px h-3 bg-slate-200" />
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        <span>No Subscription</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
