'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Check,
    ChevronRight,
    ChevronLeft,
    SkipForward,
    Pencil,
    Linkedin,
    Plus,
    X,
    Trash2,
} from 'lucide-react';
import { ProfileData } from '../lib/schema';

// ────────────────────────────────────────────────────────────────────────────────
// Section configuration
// ────────────────────────────────────────────────────────────────────────────────

interface ReviewSection {
    id: string;
    label: string;
    description: string;
    emptyPrompt: string;
    selector: string;
    scrollSelector?: string;
    fields: (keyof ProfileData)[];
    hasData: (data: Partial<ProfileData>) => boolean;
}

const REVIEW_SECTIONS: ReviewSection[] = [
    {
        id: 'identity',
        label: 'Your Identity',
        description: "Here's how your name and title will appear on your profile.",
        emptyPrompt: "We didn't find your name or title on LinkedIn. Add them now?",
        selector: '.header-container',
        fields: ['fullName', 'professionalTitle', 'topHighlights'],
        hasData: (d) => !!(d.fullName || d.professionalTitle),
    },
    {
        id: 'story',
        label: 'Your Story',
        description: "This is your personal elevator pitch — your 'About Me' section.",
        emptyPrompt: "No about section found. Want to write a quick intro?",
        selector: '.prompt-box',
        fields: ['aboutMe', 'personalStory30'],
        hasData: (d) => !!(d.aboutMe && d.aboutMe.length > 20),
    },
    {
        id: 'expertise',
        label: 'Your Expertise',
        description: 'These are the key areas of expertise we identified.',
        emptyPrompt: 'No expertise areas found. Add your core skills?',
        selector: '.roles-section',
        fields: ['expertiseAreas'],
        hasData: (d) => !!(d.expertiseAreas && d.expertiseAreas.length > 0),
    },
    {
        id: 'career',
        label: 'Your Career',
        description: 'Your work history and brands you\'ve been associated with.',
        emptyPrompt: 'No work experience found. Add your positions?',
        selector: '.brands-section',
        fields: ['positions'],
        hasData: (d) => !!(d.positions && d.positions.length > 0),
    },
    {
        id: 'links',
        label: 'Your Links',
        description: 'Social profiles and websites connected to you.',
        emptyPrompt: 'No social links found. Add your profiles?',
        selector: '.social-links',
        scrollSelector: '.header-container',
        fields: ['socialLinks'],
        hasData: (d) => !!(d.socialLinks?.linkedin || d.socialLinks?.website || d.socialLinks?.instagram),
    },
    {
        id: 'contact',
        label: 'Contact Info',
        description: 'How people can reach you.',
        emptyPrompt: 'No contact details found. Add your email or phone?',
        selector: '.contact-section',
        fields: ['contact'],
        hasData: (d) => !!(d.contact?.emailPrimary || d.contact?.phonePrimary),
    },
];

// ────────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────────

interface GuidedReviewOverlayProps {
    profileData: Partial<ProfileData>;
    onUpdateField: (field: keyof ProfileData, value: unknown) => void;
    onMerge: (data: Partial<ProfileData>) => void;
    onComplete: () => void;
    previewContainerId: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────

export default function GuidedReviewOverlay({
    profileData,
    onUpdateField,
    onMerge,
    onComplete,
    previewContainerId,
}: GuidedReviewOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [highlightVisible, setHighlightVisible] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [localEdits, setLocalEdits] = useState<Partial<ProfileData>>({});
    const [mounted, setMounted] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
    const [cardKey, setCardKey] = useState(0);
    const navDebounceRef = useRef(false);
    const rafRef = useRef<number>(0);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ mouseX: number; mouseY: number; cardX: number; cardY: number } | null>(null);

    const section = REVIEW_SECTIONS[currentStep];
    const hasData = section.hasData(profileData);
    const totalSteps = REVIEW_SECTIONS.length;

    // Ensure we only render portal on client
    useEffect(() => { setMounted(true); }, []);

    // ── Compute highlight rect relative to viewport ─────────────────────────
    const computeHighlight = useCallback(() => {
        const container = document.getElementById(previewContainerId);
        if (!container) return;

        const el = container.querySelector(section.selector);
        if (!el) {
            setHighlightRect(null);
            return;
        }

        const rect = el.getBoundingClientRect();
        const padding = 8;

        setHighlightRect({
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
        });
    }, [previewContainerId, section.selector]);

    // ── Scroll preview so the target section is visible ──────────────────────
    const scrollToSection = useCallback(() => {
        const scrollArea = document.getElementById('docScrollArea');
        const container = document.getElementById(previewContainerId);
        if (!scrollArea || !container) return;

        const scrollSelector = section.scrollSelector || section.selector;
        const el = container.querySelector(scrollSelector);
        if (!el) return;

        const elRect = el.getBoundingClientRect();
        const scrollRect = scrollArea.getBoundingClientRect();

        // If the element is not fully visible within the scroll area, scroll it into view
        if (elRect.top < scrollRect.top + 20 || elRect.bottom > scrollRect.bottom - 20) {
            // Calculate how much we need to scroll
            const scrollOffset = elRect.top - scrollRect.top - 60;
            scrollArea.scrollBy({ top: scrollOffset, behavior: 'smooth' });
        }

        // Recompute highlight after scroll settles
        setTimeout(computeHighlight, 500);
    }, [section, previewContainerId, computeHighlight]);

    // ── On step change ──────────────────────────────────────────────────────
    useEffect(() => {
        setIsEditing(false);
        setLocalEdits({});
        setDragOffset(null);

        // 1. Briefly hide the highlight (opacity fade-out via CSS transition)
        setHighlightVisible(false);

        // 2. After a short pause, scroll to the new section
        const t1 = setTimeout(() => {
            scrollToSection();
        }, 80);

        // 3. After scroll starts, compute position and fade highlight in
        const t2 = setTimeout(() => {
            computeHighlight();
            setHighlightVisible(true);
            setCardKey(prev => prev + 1); // Re-trigger card entry animation
        }, 350);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [currentStep, scrollToSection, computeHighlight]);

    // ── Continuously track position (handles scroll, resize, data changes) ──
    useEffect(() => {
        let running = true;
        const tick = () => {
            if (!running) return;
            computeHighlight();
            rafRef.current = requestAnimationFrame(tick);
        };
        // Start immediately — no delay
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            running = false;
            cancelAnimationFrame(rafRef.current);
        };
    }, [computeHighlight]);

    // ── Keyboard navigation ─────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't intercept if user is typing in an input/textarea
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            if (e.key === 'Enter') { e.preventDefault(); goNext(); }
            if (e.key === 'Escape') { e.preventDefault(); handleSkipAll(); }
            if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isEditing]);

    // ── Navigation ──────────────────────────────────────────────────────────
    const goNext = useCallback(() => {
        if (navDebounceRef.current) return;
        navDebounceRef.current = true;

        // Apply pending edits
        if (isEditing && Object.keys(localEdits).length > 0) {
            onMerge(localEdits);
            setLocalEdits({});
        }

        if (currentStep < totalSteps - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        } else {
            onComplete();
        }

        setTimeout(() => { navDebounceRef.current = false; }, 500);
    }, [currentStep, totalSteps, isEditing, localEdits, onMerge, onComplete]);

    const goPrev = useCallback(() => {
        if (navDebounceRef.current || currentStep === 0) return;
        navDebounceRef.current = true;

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep(prev => prev - 1);
            setIsTransitioning(false);
        }, 300);

        setTimeout(() => { navDebounceRef.current = false; }, 500);
    }, [currentStep]);

    const handleSkipAll = useCallback(() => { onComplete(); }, [onComplete]);

    const toggleEdit = () => {
        if (isEditing && Object.keys(localEdits).length > 0) {
            onMerge(localEdits);
            setLocalEdits({});
        }
        setIsEditing(!isEditing);
    };

    // ── Local edit helpers ──────────────────────────────────────────────────
    const getFieldValue = (field: keyof ProfileData) => {
        if (field in localEdits) return localEdits[field];
        return profileData[field];
    };

    const setFieldValue = (field: keyof ProfileData, value: unknown) => {
        setLocalEdits(prev => ({ ...prev, [field]: value }));
        onUpdateField(field, value);
    };

    const setNestedValue = (parent: string, field: string, value: string) => {
        const current = (getFieldValue(parent as keyof ProfileData) || {}) as Record<string, unknown>;
        const updated = { ...current, [field]: value };
        setFieldValue(parent as keyof ProfileData, updated);
    };

    // ── Drag handlers ───────────────────────────────────────────────────────
    const handleDragStart = (e: React.MouseEvent) => {
        // Only start drag from the header area
        e.preventDefault();
        isDraggingRef.current = true;

        const cardEl = (e.currentTarget as HTMLElement).closest('.guided-card') as HTMLElement;
        if (!cardEl) return;

        const rect = cardEl.getBoundingClientRect();
        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            cardX: rect.left,
            cardY: rect.top,
        };

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isDraggingRef.current || !dragStartRef.current) return;
            const dx = ev.clientX - dragStartRef.current.mouseX;
            const dy = ev.clientY - dragStartRef.current.mouseY;
            const newX = Math.max(0, Math.min(dragStartRef.current.cardX + dx, window.innerWidth - 380));
            const newY = Math.max(0, Math.min(dragStartRef.current.cardY + dy, window.innerHeight - 100));
            setDragOffset({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            dragStartRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };



    // ── Render section-specific edit fields ──────────────────────────────────
    const renderEditFields = () => {
        switch (section.id) {
            case 'identity':
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                value={(getFieldValue('fullName') as string) || ''}
                                onChange={(e) => setFieldValue('fullName', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Title</label>
                            <input
                                type="text"
                                value={(getFieldValue('professionalTitle') as string) || ''}
                                onChange={(e) => setFieldValue('professionalTitle', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Highlights</label>
                            {((getFieldValue('topHighlights') as string[]) || []).map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={h}
                                        maxLength={45}
                                        onChange={(e) => {
                                            const highlights = [...((getFieldValue('topHighlights') as string[]) || [])];
                                            highlights[i] = e.target.value.slice(0, 45);
                                            setFieldValue('topHighlights', highlights);
                                        }}
                                        placeholder="Max 45 characters"
                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const highlights = [...((getFieldValue('topHighlights') as string[]) || [])];
                                            highlights.splice(i, 1);
                                            setFieldValue('topHighlights', highlights);
                                        }}
                                        className="p-1 text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                            {((getFieldValue('topHighlights') as string[]) || []).length < 3 && (
                                <button
                                    onClick={() => {
                                        const highlights = [...((getFieldValue('topHighlights') as string[]) || []), ''];
                                        setFieldValue('topHighlights', highlights);
                                    }}
                                    className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1 rounded-lg"
                                >
                                    <Plus className="w-3 h-3" /> Add highlight
                                </button>
                            )}
                        </div>
                    </div>
                );

            case 'story':
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">About Me</label>
                            <textarea
                                value={(getFieldValue('aboutMe') as string) || ''}
                                onChange={(e) => setFieldValue('aboutMe', e.target.value)}
                                rows={4}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none resize-none"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal Story (30 sec elevator pitch)</label>
                            <textarea
                                value={(getFieldValue('personalStory30') as string) || ''}
                                onChange={(e) => setFieldValue('personalStory30', e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none resize-none"
                            />
                        </div>
                    </div>
                );

            case 'expertise':
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expertise Areas</label>
                        <div className="flex flex-wrap gap-2">
                            {((getFieldValue('expertiseAreas') as string[]) || []).map((area, i) => (
                                <div key={i} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 group">
                                    <input
                                        type="text"
                                        value={area}
                                        onChange={(e) => {
                                            const areas = [...((getFieldValue('expertiseAreas') as string[]) || [])];
                                            areas[i] = e.target.value;
                                            setFieldValue('expertiseAreas', areas);
                                        }}
                                        className="bg-transparent border-none outline-none text-sm w-28 focus:w-40 transition-all"
                                        autoFocus={i === 0}
                                    />
                                    <button
                                        onClick={() => {
                                            const areas = [...((getFieldValue('expertiseAreas') as string[]) || [])];
                                            areas.splice(i, 1);
                                            setFieldValue('expertiseAreas', areas);
                                        }}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {((getFieldValue('expertiseAreas') as string[]) || []).length < 5 && (
                            <button
                                onClick={() => {
                                    const areas = [...((getFieldValue('expertiseAreas') as string[]) || []), ''];
                                    setFieldValue('expertiseAreas', areas);
                                }}
                                className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1 rounded-lg"
                            >
                                <Plus className="w-3 h-3" /> Add expertise
                            </button>
                        )}
                    </div>
                );

            case 'career': {
                const positions = ((getFieldValue('positions') as ProfileData['positions']) || []);
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Work Positions</label>
                        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                            {positions.map((pos, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 relative group">
                                    <button
                                        onClick={() => {
                                            const updated = [...positions];
                                            updated.splice(i, 1);
                                            setFieldValue('positions', updated);
                                        }}
                                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={pos.title}
                                            onChange={(e) => {
                                                const updated = [...positions];
                                                updated[i] = { ...pos, title: e.target.value };
                                                setFieldValue('positions', updated);
                                            }}
                                            placeholder="Job Title"
                                            className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={pos.company}
                                            onChange={(e) => {
                                                const updated = [...positions];
                                                updated[i] = { ...pos, company: e.target.value };
                                                setFieldValue('positions', updated);
                                            }}
                                            placeholder="Company"
                                            className="bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={pos.duration || ''}
                                        onChange={(e) => {
                                            const updated = [...positions];
                                            updated[i] = { ...pos, duration: e.target.value };
                                            setFieldValue('positions', updated);
                                        }}
                                        placeholder="Duration (e.g. Jan 2020 - Present)"
                                        className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1.5 text-xs mt-2 focus:border-[#01334c] outline-none"
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                const updated = [...positions, { title: '', company: '', duration: '' }];
                                setFieldValue('positions', updated);
                            }}
                            className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1 rounded-lg"
                        >
                            <Plus className="w-3 h-3" /> Add position
                        </button>
                    </div>
                );
            }

            case 'links': {
                const links = (getFieldValue('socialLinks') || {}) as Record<string, string>;
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LinkedIn</label>
                            <input
                                type="url"
                                value={links.linkedin || ''}
                                onChange={(e) => setNestedValue('socialLinks', 'linkedin', e.target.value)}
                                placeholder="https://linkedin.com/in/..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website</label>
                            <input
                                type="url"
                                value={links.website || ''}
                                onChange={(e) => setNestedValue('socialLinks', 'website', e.target.value)}
                                placeholder="https://yoursite.com"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instagram</label>
                            <input
                                type="url"
                                value={links.instagram || ''}
                                onChange={(e) => setNestedValue('socialLinks', 'instagram', e.target.value)}
                                placeholder="https://instagram.com/..."
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                            />
                        </div>
                    </div>
                );
            }

            case 'contact': {
                const contact = (getFieldValue('contact') || {}) as Record<string, unknown>;
                return (
                    <div className="space-y-3 animate-fade-in-up">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={(contact.emailPrimary as string) || ''}
                                onChange={(e) => setNestedValue('contact', 'emailPrimary', e.target.value)}
                                placeholder="you@email.com"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                            <input
                                type="tel"
                                value={(contact.phonePrimary as string) || ''}
                                onChange={(e) => setNestedValue('contact', 'phonePrimary', e.target.value)}
                                placeholder="+91 12345 67890"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] outline-none"
                            />
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    // ── Render data preview when not editing ─────────────────────────────────
    const renderDataPreview = () => {
        switch (section.id) {
            case 'identity':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#01334c]">{profileData.fullName}</p>
                        <p className="text-xs text-slate-500">{profileData.professionalTitle}</p>
                        {profileData.topHighlights && profileData.topHighlights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {profileData.topHighlights.map((h, i) => (
                                    <span key={i} className="text-[10px] bg-[#01334c]/5 text-[#01334c] px-2 py-0.5 rounded-full">{h}</span>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'story':
                return <p className="text-xs text-slate-600 line-clamp-3">{profileData.aboutMe}</p>;
            case 'expertise':
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {(profileData.expertiseAreas || []).map((a, i) => (
                            <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{a}</span>
                        ))}
                    </div>
                );
            case 'career':
                return (
                    <div className="space-y-1">
                        {(profileData.positions || []).slice(0, 3).map((p, i) => (
                            <p key={i} className="text-xs text-slate-600">
                                <span className="font-medium">{p.title}</span> at {p.company}
                            </p>
                        ))}
                        {(profileData.positions || []).length > 3 && (
                            <p className="text-[10px] text-slate-400">+{(profileData.positions || []).length - 3} more</p>
                        )}
                    </div>
                );
            case 'links':
                return (
                    <div className="space-y-1">
                        {profileData.socialLinks?.linkedin && <p className="text-xs text-blue-600 truncate">{profileData.socialLinks.linkedin}</p>}
                        {profileData.socialLinks?.website && <p className="text-xs text-slate-600 truncate">{profileData.socialLinks.website}</p>}
                        {profileData.socialLinks?.instagram && <p className="text-xs text-pink-600 truncate">{profileData.socialLinks.instagram}</p>}
                    </div>
                );
            case 'contact':
                return (
                    <div className="space-y-1">
                        {profileData.contact?.emailPrimary && <p className="text-xs text-slate-600">📧 {profileData.contact.emailPrimary}</p>}
                        {profileData.contact?.phonePrimary && <p className="text-xs text-slate-600">📱 {profileData.contact.phonePrimary}</p>}
                    </div>
                );
            default:
                return null;
        }
    };

    // ── Portal content ──────────────────────────────────────────────────────
    const overlayContent = (
        <>
            {/* 
                Single persistent spotlight element. Always mounted so CSS 
                transitions on top/left/width/height/opacity work smoothly.
                When highlightRect is null, it covers the full viewport as a dim.
            */}
            <div
                className="guided-highlight-ring"
                style={{
                    position: 'fixed',
                    top: highlightRect?.top ?? 0,
                    left: highlightRect?.left ?? 0,
                    width: highlightRect?.width ?? '100vw',
                    height: highlightRect?.height ?? '100vh',
                    borderRadius: highlightRect ? 14 : 0,
                    boxShadow: highlightRect
                        ? '0 0 0 9999px rgba(15, 23, 42, 0.4), 0 0 30px rgba(1, 51, 76, 0.15)'
                        : '0 0 0 0 rgba(15, 23, 42, 0.4)',
                    opacity: highlightVisible && highlightRect ? 1 : highlightRect ? 0.3 : 0.8,
                    zIndex: 9998,
                    pointerEvents: 'none',
                    transition: 'top 0.5s cubic-bezier(0.4,0,0.2,1), left 0.5s cubic-bezier(0.4,0,0.2,1), width 0.5s cubic-bezier(0.4,0,0.2,1), height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, border-radius 0.4s ease',
                }}
            />

            {/* Click blocker — prevents interaction with underlying page */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    pointerEvents: 'all',
                    background: 'transparent',
                    cursor: 'default',
                }}
                onClick={(e) => e.stopPropagation()}
            />

            {/* Floating edit card — key forces re-mount to re-trigger entry animation */}
            <div
                key={cardKey}
                className={`guided-card ${isTransitioning ? 'guided-card-exit' : ''}`}
                style={{
                    position: 'fixed',
                    top: dragOffset
                        ? dragOffset.y
                        : highlightRect
                            ? Math.max(20, Math.min(highlightRect.top, window.innerHeight - 450))
                            : '50%',
                    left: dragOffset ? dragOffset.x : 25,
                    width: 370,
                    zIndex: 10000,
                    pointerEvents: 'auto',
                    ...((!dragOffset && !highlightRect) ? { transform: 'translateY(-50%)' } : {}),
                    transition: isDraggingRef.current ? 'none' : undefined,
                }}
            >
                <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden">

                    {/* Card header — drag handle */}
                    <div
                        className="bg-gradient-to-r from-[#01334c] to-[#024466] px-5 py-4 cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={handleDragStart}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                                <Linkedin className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-white">{section.label}</h3>
                                <p className="text-[10px] text-white/50">Step {currentStep + 1} of {totalSteps}</p>
                            </div>
                        </div>

                        {/* Progress dots */}
                        <div className="flex items-center gap-1.5 mt-2">
                            {REVIEW_SECTIONS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`guided-dot ${i === currentStep
                                        ? 'guided-dot-active'
                                        : i < currentStep
                                            ? 'guided-dot-done'
                                            : 'guided-dot-pending'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            {hasData ? section.description : section.emptyPrompt}
                        </p>

                        {/* Edit fields when editing or when section is empty */}
                        {(isEditing || !hasData) && (
                            <div className="mb-4">{renderEditFields()}</div>
                        )}

                        {/* Data preview when not editing and has data */}
                        {!isEditing && hasData && (
                            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 border border-slate-100">
                                {renderDataPreview()}
                            </div>
                        )}
                    </div>

                    {/* Card footer */}
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleSkipAll}
                                className="text-[10px] text-slate-400 hover:text-slate-600 font-medium transition-colors"
                            >
                                <SkipForward className="w-3 h-3 inline mr-1" />
                                Skip All
                            </button>

                            <div className="flex items-center gap-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={goPrev}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-200/50 transition-all"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                        Back
                                    </button>
                                )}

                                {hasData && (
                                    <button
                                        onClick={toggleEdit}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isEditing
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            : 'text-[#01334c] hover:bg-[#01334c]/5'
                                            }`}
                                    >
                                        {isEditing ? (
                                            <><Check className="w-3.5 h-3.5" /> Done Editing</>
                                        ) : (
                                            <><Pencil className="w-3.5 h-3.5" /> Edit</>
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={goNext}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#01334c] hover:bg-[#024466] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#01334c]/20 active:scale-95"
                                >
                                    {currentStep === totalSteps - 1 ? (
                                        <><Check className="w-3.5 h-3.5" /> Finish</>
                                    ) : (
                                        <>Looks Good <ChevronRight className="w-3.5 h-3.5" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // ── Render via portal to document.body (avoids flex layout interference) ─
    if (!mounted) return null;
    return createPortal(overlayContent, document.body);
}
