"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  SkipForward,
  Pencil,
  Linkedin,
  Plus,
  X,
  Trash2,
  Sparkles,
  Loader2,
  MessageSquare,
  Lightbulb,
  Upload,
  ImageIcon,
} from "lucide-react";
import { ProfileData } from "../lib/schema";
import { enhanceProfileSection } from "../lib/groq";

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
  guidance: string;
  tips: string[];
  examples?: string[];
}

const REVIEW_SECTIONS: ReviewSection[] = [
  {
    id: "identity",
    label: "Your Identity",
    description: "Here's how your name and title will appear on your profile.",
    emptyPrompt: "We didn't find your name or title on LinkedIn. Add them now?",
    selector: ".header-container",
    fields: ["fullName", "professionalTitle", "topHighlights", "tagline"],
    hasData: (d) => !!(d.fullName || d.professionalTitle || d.tagline),
    guidance:
      "This is the first thing people see — your name, title, and 3 standout highlights. These must hook the reader instantly.",
    tips: [
      'Highlights should include numbers & impact (e.g., "Trained 15,000+ Professionals")',
      "Professional title = qualifications (CA, MBA, CFA)",
      "Use power verbs: Led, Built, Scaled, Pioneered",
    ],
    examples: [
      '"Trained 15,000+ Business Owners"',
      '"Virtual CFO | Startup Strategist"',
      '"Helped 500+ Startups with Compliance"',
    ],
  },
  {
    id: "links",
    label: "Your Links",
    description: "Social profiles and websites connected to you.",
    emptyPrompt: "No social links found. Add your profiles?",
    selector: ".social-links",
    scrollSelector: ".header-container",
    fields: ["socialLinks"],
    hasData: (d) =>
      !!(
        d.socialLinks?.linkedin ||
        d.socialLinks?.website ||
        d.socialLinks?.instagram ||
        d.socialLinks?.twitter ||
        d.socialLinks?.youtube ||
        d.socialLinks?.facebook ||
        d.socialLinks?.companyWebsite
      ),
    guidance:
      "Social links verify your professional presence. LinkedIn is the most important — add your website and other platforms too.",
    tips: [
      "LinkedIn is primary and strongly recommended",
      "A personal website adds professional credibility",
      "Instagram, YouTube, and podcasts showcase your personal brand",
    ],
  },
  {
    id: "story",
    label: "Your Story",
    description:
      "This is your personal elevator pitch — your 'About Me' section.",
    emptyPrompt: "No about section found. Want to write a quick intro?",
    selector: ".story-section-container",
    fields: ["aboutMe", "personalStory30"],
    hasData: (d) =>
      !!((d.aboutMe && d.aboutMe.length > 20) || d.personalStory30),
    guidance:
      "Your About Me is 3-4 powerful sentences about your journey. The Personal Story is a single 30-word elevator pitch.",
    tips: [
      'Apply the "So What?" test — every sentence must answer why someone should care',
      "Personal Story = one powerful line about your journey",
      "Match your tone: formal for CAs/lawyers, bold for entrepreneurs",
    ],
    examples: [
      '"From son of a farmer to the CEO of a 50-crore company"',
      '"Started with ₹10,000 savings, now helping 1000+ businesses"',
      '"Left a cushy corporate job to follow my passion"',
    ],
  },
  {
    id: "expertise",
    label: "Your Expertise",
    description: "These are the key areas of expertise we identified.",
    emptyPrompt: "No expertise areas found. Add your core skills?",
    selector: ".roles-section",
    fields: ["expertiseAreas", "expertiseDescriptions"],
    hasData: (d) => !!(d.expertiseAreas && d.expertiseAreas.length > 0),
    guidance:
      "Up to 5 core expertise areas, each 3 words max. These define what you're known for professionally.",
    tips: [
      'Be specific: "Growth Strategy" beats "Business Consulting"',
      "Use industry keywords that clients search for",
      "Max 5 areas — quality over quantity",
    ],
  },
  {
    id: "career",
    label: "Career & Brands",
    description: "Your work history and brands you've been associated with.",
    emptyPrompt: "No work experience found. Add your positions?",
    selector: ".brands-section",
    fields: ["positions"],
    hasData: (d) => !!(d.positions && d.positions.length > 0),
    guidance:
      'Showcase the brands and companies you\'ve worked with — your roles, durations, and key contributions. This section highlights the "Brands Worked" on your profile.',
    tips: [
      "Lead with your most impressive role",
      "Include company name, title, and duration",
      "Up to 10 brands — focus on the ones that build credibility",
    ],
  },
  {
    id: "impact",
    label: "Impact Created",
    description: "Quantifiable achievements and professional impact.",
    emptyPrompt: "No impact details found. Share your achievements?",
    selector: ".impact-section",
    fields: ["impactHeadline", "impactStory", "professionSpecificImpact"],
    hasData: (d) => !!(d.impactHeadline || d.impactStory),
    guidance:
      "This section highlights your professional results. Use numbers, percentages, and power verbs to quantify your impact.",
    tips: [
      'Use metrics: "Increased revenue by 40%", "Led team of 20"',
      "Headline should be a punchy summary of your biggest win",
      "Story provides context for your achievements",
    ],
    examples: [
      '"Generated $2M in new business within 12 months"',
      '"Optimized supply chain, reducing costs by 15%"',
      '"Mentored 50+ junior developers into lead roles"',
    ],
  },
  {
    id: "awards",
    label: "Awards & Recognition",
    description: "Honors, awards, and media features.",
    emptyPrompt: "No awards found. Add your recognitions?",
    selector: ".awards-section",
    fields: ["awards", "mediaFeatures"],
    hasData: (d) =>
      !!(
        (d.awards && d.awards.length > 0) ||
        (d.mediaFeatures && d.mediaFeatures.length > 0)
      ),
    guidance:
      "Social proof builds massive credibility. List your honors, awards, and any times you've been featured in the media.",
    tips: [
      "Include the organization that gave the award",
      "Add the year for context",
      "Mention media features (interviews, articles, podcasts)",
    ],
  },
  {
    id: "education",
    label: "Education",
    description: "Your academic background and qualifications.",
    emptyPrompt: "No education details found.",
    selector: ".education-section",
    fields: ["education"],
    hasData: (d) => !!(d.education && d.education.length > 0),
    guidance:
      "List your degrees and certifications. Focus on relevant coursework or honors.",
    tips: [
      "Include your degree, major, and school name.",
      "Add graduation year if recent.",
      "Mention honors like Summa Cum Laude.",
    ],
  },
  {
    id: "skills",
    label: "Skills & Competencies",
    description: "Your core professional skills and technical competencies.",
    emptyPrompt: "No skills found. Add your expertise?",
    selector: ".skills-section",
    fields: ["expertiseAreas"],
    hasData: (d) => !!(d.expertiseAreas && d.expertiseAreas.length > 0),
    guidance:
      "List technical and soft skills that are relevant to your target role.",
    tips: [
      "Mix hard skills (e.g., Python) and soft skills (e.g., Leadership).",
      "Keep them concise (1-3 words).",
      "Prioritize skills mentioned in job descriptions.",
    ],
  },
  {
    id: "certifications",
    label: "Certifications",
    description: "Professional certifications and licenses.",
    emptyPrompt: "No certifications found.",
    selector: ".certifications-section",
    fields: ["certifications"],
    hasData: (d) => !!(d.certifications && d.certifications.length > 0),
    guidance: "Validate your expertise with recognized certifications.",
    tips: [
      "Include the certification name and issuing organization.",
      "Relevant certifications only.",
    ],
  },


  {
    id: "contact",
    label: "Contact Info",
    description: "How people can reach you.",
    emptyPrompt: "No contact details found. Add your email or phone?",
    selector: ".contact-section",
    fields: ["contact"],
    hasData: (d) => !!(d.contact?.emailPrimary || d.contact?.phonePrimary),
    guidance:
      "This is how people will reach out to you directly — your professional email and phone number.",
    tips: [
      "Use a professional email (avoid generic Gmail if possible)",
      "Double-check for typos — this is your direct contact",
    ],
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
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localEdits, setLocalEdits] = useState<Partial<ProfileData>>({});
  const [mounted, setMounted] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<Partial<ProfileData> | null>(
    null,
  );
  const [userInstructions, setUserInstructions] = useState("");
  const cardBodyRef = useRef<HTMLDivElement>(null);
  const navDebounceRef = useRef(false);
  const rafRef = useRef<number>(0);

  // Collapsible guidance state
  const [showGuidance, setShowGuidance] = useState(true);

  // Image upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload handler (via server API to bypass RLS) ────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
        return;
      }

      if (data.url) {
        setFieldValue("profilePhoto", data.url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Image remove handler ────────────────────────────────────────────────
  const handleRemoveImage = async () => {
    const currentUrl = (getFieldValue("profilePhoto") as string) || "";
    setFieldValue("profilePhoto", "");
    if (currentUrl) {
      try {
        await fetch("/api/upload-image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: currentUrl }),
        });
      } catch (err) {
        console.error("Failed to delete image from storage:", err);
      }
    }
  };
  const section = REVIEW_SECTIONS[currentStep];
  const totalSteps = REVIEW_SECTIONS.length;

  // Ensure we only render portal on client
  useEffect(() => {
    setMounted(true);
  }, []);

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
    const scrollArea = document.getElementById("docScrollArea");
    const container = document.getElementById(previewContainerId);
    if (!scrollArea || !container) return;

    const scrollSelector = section.scrollSelector || section.selector;
    const el = container.querySelector(scrollSelector);
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const scrollRect = scrollArea.getBoundingClientRect();

    // If the element is not fully visible within the scroll area, scroll it into view
    if (
      elRect.top < scrollRect.top + 20 ||
      elRect.bottom > scrollRect.bottom - 20
    ) {
      // Calculate how much we need to scroll
      const scrollOffset = elRect.top - scrollRect.top - 60;
      scrollArea.scrollBy({ top: scrollOffset, behavior: "smooth" });
    }

    // Recompute highlight after scroll settles
    setTimeout(computeHighlight, 500);
  }, [section, previewContainerId, computeHighlight]);

  // ── On step change ──────────────────────────────────────────────────────
  useEffect(() => {
    setLocalEdits({});
    setAiSuggestion(null);
    setUserInstructions("");

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
      setCardKey((prev) => prev + 1); // Re-trigger card entry animation
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
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleSkipAll();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ── Click-to-navigate (Event Delegation) ────────────────────────────────
  useEffect(() => {
    const container = document.getElementById(previewContainerId);
    if (!container) return;

    // 1. Inject styles for pointer cursor on hover
    // We do this via style tag because the elements inside container are re-created
    // whenever data changes (dangerouslySetInnerHTML), so direct style manipulation is lost.
    const styleId = "guided-review-cursor-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
                #${previewContainerId} .header-container,
                #${previewContainerId} .story-section-container,
                #${previewContainerId} .roles-section,
                #${previewContainerId} .brands-section,
                #${previewContainerId} .impact-section,
                #${previewContainerId} .education-section,
                #${previewContainerId} .skills-section,
                #${previewContainerId} .certifications-section,
                #${previewContainerId} .awards-section,
                #${previewContainerId} .social-links,
                #${previewContainerId} .contact-section {
                    cursor: pointer !important;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                #${previewContainerId} .header-container:hover,
                #${previewContainerId} .story-section-container:hover,
                #${previewContainerId} .roles-section:hover,
                #${previewContainerId} .brands-section:hover,
                #${previewContainerId} .impact-section:hover,
                #${previewContainerId} .education-section:hover,
                #${previewContainerId} .skills-section:hover,
                #${previewContainerId} .certifications-section:hover,
                #${previewContainerId} .awards-section:hover,
                #${previewContainerId} .social-links:hover,
                #${previewContainerId} .contact-section:hover {
                    box-shadow: 0 0 0 2px rgba(1, 51, 76, 0.1);
                    border-radius: 4px;
                }
            `;
      document.head.appendChild(style);
    }

    // 2. Event Delegation Handler
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Find which section matched - iterate in reverse to handle nested components (child matches first)
      let matchedSectionIndex = -1;
      for (let i = REVIEW_SECTIONS.length - 1; i >= 0; i--) {
        if (target.closest(REVIEW_SECTIONS[i].selector)) {
          matchedSectionIndex = i;
          break;
        }
      }

      if (matchedSectionIndex !== -1 && matchedSectionIndex !== currentStep) {
        e.stopPropagation();

        // Apply pending edits before navigating
        if (Object.keys(localEdits).length > 0) {
          onMerge(localEdits);
          setLocalEdits({});
        }

        setIsTransitioning(true);
        // navigate
        setTimeout(() => {
          setCurrentStep(matchedSectionIndex);
          setIsTransitioning(false);
        }, 300);
      }
    };

    container.addEventListener("click", clickHandler);
    return () => {
      container.removeEventListener("click", clickHandler);
      // Cleanup styles when component unmounts
      const styleEl = document.getElementById(styleId);
      if (styleEl) styleEl.remove();
    };
  }, [currentStep, previewContainerId, localEdits, onMerge]);

  // ── Navigation ──────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (navDebounceRef.current) return;
    navDebounceRef.current = true;

    // Apply pending edits
    if (Object.keys(localEdits).length > 0) {
      onMerge(localEdits);
      setLocalEdits({});
    }

    if (currentStep < totalSteps - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      onComplete();
    }

    setTimeout(() => {
      navDebounceRef.current = false;
    }, 500);
  }, [currentStep, totalSteps, localEdits, onMerge, onComplete]);

  const goPrev = useCallback(() => {
    if (navDebounceRef.current || currentStep === 0) return;
    navDebounceRef.current = true;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setIsTransitioning(false);
    }, 300);

    setTimeout(() => {
      navDebounceRef.current = false;
    }, 500);
  }, [currentStep]);

  const handleSkipAll = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // ── Local edit helpers ──────────────────────────────────────────────────
  const getFieldValue = (field: keyof ProfileData) => {
    if (field in localEdits) return localEdits[field];
    return profileData[field];
  };

  const setFieldValue = (field: keyof ProfileData, value: unknown) => {
    setLocalEdits((prev) => ({ ...prev, [field]: value }));
    onUpdateField(field, value);
  };

  const setNestedValue = (parent: string, field: string, value: string) => {
    const current = (getFieldValue(parent as keyof ProfileData) ||
      {}) as Record<string, unknown>;
    const updated = { ...current, [field]: value };
    setFieldValue(parent as keyof ProfileData, updated);
  };

  // ── Handle AI Enhancement ───────────────────────────────────────────────
  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      // Merge local edits with current profile data to capture "Edited" state
      const currentData = { ...profileData, ...localEdits };
      const result = await enhanceProfileSection(
        section.id,
        currentData,
        userInstructions,
      );
      if (result && Object.keys(result).length > 0) {
        setAiSuggestion(result);
      }
    } catch (err) {
      console.error("AI enhance failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // ── Render section-specific edit fields ──────────────────────────────────
  const renderEditFields = () => {
    switch (section.id) {
      case "identity": {
        const currentPhoto = (getFieldValue("profilePhoto") as string) || "";
        return (
          <div className="space-y-4 animate-fade-in-up">
            {/* ── Profile Photo ──────────────────── */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Profile Photo
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {currentPhoto ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 group">
                  <img
                    src={currentPhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3 py-1.5 rounded-lg bg-white text-[#01334c] text-[11px] font-bold hover:bg-slate-100 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-[#01334c] animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-[#01334c]/25 bg-slate-50/50 hover:bg-[#01334c]/[0.03] hover:border-[#01334c]/40 transition-all flex flex-col items-center justify-center gap-1.5 disabled:opacity-50 group"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-[#01334c]/50 animate-spin" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#01334c]/10 flex items-center justify-center group-hover:bg-[#01334c]/15 transition-colors">
                      <Upload className="w-4 h-4 text-[#01334c]" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-500">
                    {isUploading ? "Uploading…" : "Browse Files to upload"}
                  </span>
                </button>
              )}
              {uploadError && (
                <p className="text-[10px] text-red-500">{uploadError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={(getFieldValue("fullName") as string) || ""}
                onChange={(e) => setFieldValue("fullName", e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Professional Title
              </label>
              <input
                type="text"
                value={(getFieldValue("professionalTitle") as string) || ""}
                onChange={(e) =>
                  setFieldValue("professionalTitle", e.target.value)
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tagline / Headline
              </label>
              <textarea
                value={(getFieldValue("tagline") as string) || ""}
                onChange={(e) => setFieldValue("tagline", e.target.value)}
                placeholder="Your magnetic headline"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all resize-none"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Top Highlights
              </label>
              {((getFieldValue("topHighlights") as string[]) || []).map(
                (h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => {
                        const highlights = [
                          ...((getFieldValue("topHighlights") as string[]) ||
                            []),
                        ];
                        highlights[i] = e.target.value;
                        setFieldValue("topHighlights", highlights);
                      }}
                      placeholder="Highlight achievement"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
                    />
                    <button
                      onClick={() => {
                        const highlights = [
                          ...((getFieldValue("topHighlights") as string[]) ||
                            []),
                        ];
                        highlights.splice(i, 1);
                        setFieldValue("topHighlights", highlights);
                      }}
                      className="p-1 text-slate-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              )}
              {((getFieldValue("topHighlights") as string[]) || []).length <
                3 && (
                  <button
                    onClick={() => {
                      const highlights = [
                        ...((getFieldValue("topHighlights") as string[]) || []),
                        "",
                      ];
                      setFieldValue("topHighlights", highlights);
                    }}
                    className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1.5 rounded-lg border border-dashed border-[#01334c]/30 w-full justify-center transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add highlight
                  </button>
                )}
            </div>
          </div>
        );
      }

      case "story":
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                About Me
              </label>
              <textarea
                value={(getFieldValue("aboutMe") as string) || ""}
                onChange={(e) => setFieldValue("aboutMe", e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none resize-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Personal Story (30 Words)
              </label>
              <textarea
                value={(getFieldValue("personalStory30") as string) || ""}
                onChange={(e) =>
                  setFieldValue("personalStory30", e.target.value)
                }
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none resize-none transition-all"
              />
            </div>
          </div>
        );

      case "expertise":
        return (
          <div className="space-y-3 animate-fade-in-up">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Expertise Areas
            </label>
            <div className="space-y-2.5">
              {((getFieldValue("expertiseAreas") as string[]) || []).map(
                (area, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 group relative hover:bg-white hover:shadow-sm transition-all"
                  >
                    <button
                      onClick={() => {
                        const areas = [
                          ...((getFieldValue("expertiseAreas") as string[]) ||
                            []),
                        ];
                        const descs = [
                          ...((getFieldValue(
                            "expertiseDescriptions",
                          ) as string[]) || []),
                        ];
                        areas.splice(i, 1);
                        descs.splice(i, 1);
                        setFieldValue("expertiseAreas", areas);
                        setFieldValue("expertiseDescriptions", descs);
                      }}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={area || ""}
                      onChange={(e) => {
                        const areas = [
                          ...((getFieldValue("expertiseAreas") as string[]) ||
                            []),
                        ];
                        areas[i] = e.target.value;
                        setFieldValue("expertiseAreas", areas);
                      }}
                      placeholder="Role title (e.g. Digital Marketing)"
                      className="w-full bg-transparent border-none outline-none text-sm font-bold text-[#01334c] placeholder-slate-400"
                    />
                    <input
                      type="text"
                      value={
                        ((getFieldValue("expertiseDescriptions") as string[]) ||
                          [])[i] || ""
                      }
                      onChange={(e) => {
                        const descs = [
                          ...((getFieldValue(
                            "expertiseDescriptions",
                          ) as string[]) || []),
                        ];
                        // Ensure array is long enough
                        while (descs.length <= i) descs.push("");
                        descs[i] = e.target.value;
                        setFieldValue("expertiseDescriptions", descs);
                      }}
                      placeholder="Short description"
                      className="w-full bg-transparent border-none outline-none text-xs text-slate-500 mt-1 placeholder-slate-300"
                    />
                  </div>
                ),
              )}
            </div>
            {((getFieldValue("expertiseAreas") as string[]) || []).length <
              5 && (
                <button
                  onClick={() => {
                    const areas = [
                      ...((getFieldValue("expertiseAreas") as string[]) || []),
                      "",
                    ];
                    const descs = [
                      ...((getFieldValue("expertiseDescriptions") as string[]) ||
                        []),
                      "",
                    ];
                    setFieldValue("expertiseAreas", areas);
                    setFieldValue("expertiseDescriptions", descs);
                  }}
                  className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-2 rounded-lg w-full justify-center border border-dashed border-[#01334c]/30"
                >
                  <Plus className="w-3 h-3" /> Add expertise
                </button>
              )}
          </div>
        );

      case "career": {
        const positions =
          (getFieldValue("positions") as ProfileData["positions"]) || [];
        return (
          <div className="space-y-3 animate-fade-in-up">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Work Positions
            </label>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {positions.map((pos, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative group hover:bg-white hover:shadow-sm transition-all"
                >
                  <button
                    onClick={() => {
                      const updated = [...positions];
                      updated.splice(i, 1);
                      setFieldValue("positions", updated);
                    }}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pos.title || ""}
                      onChange={(e) => {
                        const updated = [...positions];
                        updated[i] = { ...pos, title: e.target.value };
                        setFieldValue("positions", updated);
                      }}
                      placeholder="Job Title"
                      className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none font-medium text-slate-700"
                    />
                    <input
                      type="text"
                      value={pos.company || ""}
                      onChange={(e) => {
                        const updated = [...positions];
                        updated[i] = { ...pos, company: e.target.value };
                        setFieldValue("positions", updated);
                      }}
                      placeholder="Company"
                      className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none text-slate-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={pos.duration || ""}
                    onChange={(e) => {
                      const updated = [...positions];
                      updated[i] = { ...pos, duration: e.target.value };
                      setFieldValue("positions", updated);
                    }}
                    placeholder="Duration (e.g. Jan 2020 - Present)"
                    className="w-full bg-white border border-slate-100 rounded px-2 py-1.5 text-xs mt-2 focus:border-[#01334c] outline-none text-slate-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const updated = [
                  ...positions,
                  { title: "", company: "", duration: "" },
                ];
                setFieldValue("positions", updated);
              }}
              className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-2 rounded-lg w-full justify-center border border-dashed border-[#01334c]/30"
            >
              <Plus className="w-3 h-3" /> Add position
            </button>
          </div>
        );
      }

      case "links": {
        const links = (getFieldValue("socialLinks") || {}) as Record<
          string,
          string
        >;
        const linkFields = [
          {
            key: "linkedin",
            label: "LinkedIn",
            placeholder: "https://linkedin.com/in/...",
          },
          {
            key: "website",
            label: "Website",
            placeholder: "https://yoursite.com",
          },
          {
            key: "instagram",
            label: "Instagram",
            placeholder: "https://instagram.com/...",
          },
          {
            key: "twitter",
            label: "Twitter / X",
            placeholder: "https://x.com/...",
          },
          {
            key: "youtube",
            label: "YouTube",
            placeholder: "https://youtube.com/@...",
          },
          {
            key: "facebook",
            label: "Facebook",
            placeholder: "https://facebook.com/...",
          },
          {
            key: "companyWebsite",
            label: "Company Website",
            placeholder: "https://company.com",
          },
        ];
        return (
          <div className="space-y-3 animate-fade-in-up">
            {linkFields.map((lf) => (
              <div key={lf.key} className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {lf.label}
                </label>
                <input
                  type="url"
                  value={links[lf.key] || ""}
                  onChange={(e) =>
                    setNestedValue("socialLinks", lf.key, e.target.value)
                  }
                  placeholder={lf.placeholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
                />
              </div>
            ))}
          </div>
        );
      }

      case "contact": {
        const contact = (getFieldValue("contact") || {}) as Record<
          string,
          unknown
        >;
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={(contact.emailPrimary as string) || ""}
                onChange={(e) =>
                  setNestedValue("contact", "emailPrimary", e.target.value)
                }
                placeholder="you@email.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                value={(contact.phonePrimary as string) || ""}
                onChange={(e) =>
                  setNestedValue("contact", "phonePrimary", e.target.value)
                }
                placeholder="+91 12345 67890"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        );
      }

      case "impact":
        return (
          <div className="space-y-4 animate-fade-in-up">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Impact Headline
              </label>
              <input
                type="text"
                value={(getFieldValue("impactHeadline") as string) || ""}
                onChange={(e) =>
                  setFieldValue("impactHeadline", e.target.value)
                }
                placeholder="Your biggest professional win"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Impact Story / Highlights
              </label>
              <textarea
                value={(getFieldValue("impactStory") as string) || ""}
                onChange={(e) => setFieldValue("impactStory", e.target.value)}
                rows={6}
                placeholder="Describe your results, metrics, and how you achieved them..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none resize-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Specific Metrics
              </label>
              {Object.entries(
                (getFieldValue("professionSpecificImpact") as Record<
                  string,
                  string
                >) || {},
              ).map(([key, val], i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={key}
                    readOnly
                    className="w-1/3 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none"
                  />
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const current =
                        (getFieldValue("professionSpecificImpact") as Record<
                          string,
                          string
                        >) || {};
                      setFieldValue("professionSpecificImpact", {
                        ...current,
                        [key]: e.target.value,
                      });
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#01334c] focus:bg-white outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "awards": {
        const awards = (getFieldValue("awards") as ProfileData["awards"]) || [];
        const media =
          (getFieldValue("mediaFeatures") as ProfileData["mediaFeatures"]) ||
          [];
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Awards & Honors
              </label>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {awards.map((a, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative group hover:bg-white hover:shadow-sm transition-all"
                  >
                    <button
                      onClick={() => {
                        const updated = [...awards];
                        updated.splice(i, 1);
                        setFieldValue("awards", updated);
                      }}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      value={a.title || ""}
                      onChange={(e) => {
                        const updated = [...awards];
                        updated[i] = { ...a, title: e.target.value };
                        setFieldValue("awards", updated);
                      }}
                      placeholder="Award Title"
                      className="w-full bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none font-medium mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={a.organization || ""}
                        onChange={(e) => {
                          const updated = [...awards];
                          updated[i] = { ...a, organization: e.target.value };
                          setFieldValue("awards", updated);
                        }}
                        placeholder="Organization"
                        className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                      />
                      <input
                        type="text"
                        value={a.year || ""}
                        onChange={(e) => {
                          const updated = [...awards];
                          updated[i] = { ...a, year: e.target.value };
                          setFieldValue("awards", updated);
                        }}
                        placeholder="Year"
                        className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setFieldValue("awards", [
                      ...awards,
                      { title: "", organization: "", year: "" },
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-2 rounded-lg w-full justify-center border border-dashed border-[#01334c]/30"
                >
                  <Plus className="w-3 h-3" /> Add Award
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Media Features
              </label>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {media.map((m, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2 group hover:bg-white hover:shadow-sm transition-all"
                  >
                    <input
                      type="text"
                      value={m.name || ""}
                      onChange={(e) => {
                        const updated = [...media];
                        updated[i] = { ...m, name: e.target.value };
                        setFieldValue("mediaFeatures", updated);
                      }}
                      placeholder="Publication/Feature Name"
                      className="w-1/2 bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                    />
                    <input
                      type="text"
                      value={m.url || ""}
                      onChange={(e) => {
                        const updated = [...media];
                        updated[i] = { ...m, url: e.target.value };
                        setFieldValue("mediaFeatures", updated);
                      }}
                      placeholder="URL (optional)"
                      className="flex-1 bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = [...media];
                        updated.splice(i, 1);
                        setFieldValue("mediaFeatures", updated);
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setFieldValue("mediaFeatures", [
                      ...media,
                      { name: "", url: "" },
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-2 rounded-lg w-full justify-center border border-dashed border-[#01334c]/30"
                >
                  <Plus className="w-3 h-3" /> Add Media Feature
                </button>
              </div>
            </div>
          </div>
        );
      }

      case "education": {
        const education =
          (getFieldValue("education") as ProfileData["education"]) || [];
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Education History
              </h3>
              <button
                onClick={() =>
                  setFieldValue("education", [
                    ...education,
                    {
                      schoolName: "",
                      degreeName: "",
                      fieldOfStudy: "",
                      duration: "",
                    },
                  ])
                }
                className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1.5 rounded-lg border border-dashed border-[#01334c]/30 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {education.map((edu, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 relative group hover:bg-white hover:shadow-sm transition-all"
                >
                  <button
                    onClick={() => {
                      const updated = [...education];
                      updated.splice(i, 1);
                      setFieldValue("education", updated);
                    }}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={edu.schoolName || ""}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i] = { ...edu, schoolName: e.target.value };
                        setFieldValue("education", updated);
                      }}
                      placeholder="School / University"
                      className="w-full bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none font-medium"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.degreeName || ""}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...edu, degreeName: e.target.value };
                          setFieldValue("education", updated);
                        }}
                        placeholder="Degree"
                        className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...edu, fieldOfStudy: e.target.value };
                          setFieldValue("education", updated);
                        }}
                        placeholder="Field of Study"
                        className="bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={edu.duration || ""}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i] = { ...edu, duration: e.target.value };
                        setFieldValue("education", updated);
                      }}
                      placeholder="Duration (e.g. 2018 - 2022)"
                      className="w-full bg-white border border-slate-100 rounded px-2 py-1.5 text-xs focus:border-[#01334c] outline-none text-slate-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "skills": {
        const skills = (getFieldValue("expertiseAreas") as string[]) || [];
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Skills & Competencies
              </h3>
              <button
                onClick={() => setFieldValue("expertiseAreas", [...skills, ""])}
                className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1.5 rounded-lg border border-dashed border-[#01334c]/30 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 group hover:bg-white hover:shadow-sm transition-all focus-within:ring-1 focus-within:ring-[#01334c]/20 focus-within:border-[#01334c]"
                >
                  <input
                    type="text"
                    value={skill || ""}
                    onChange={(e) => {
                      const updated = [...skills];
                      updated[i] = e.target.value;
                      setFieldValue("expertiseAreas", updated);
                    }}
                    placeholder="Skill"
                    className="bg-transparent border-none outline-none text-xs w-24 focus:w-32 transition-all placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => {
                      const updated = [...skills];
                      updated.splice(i, 1);
                      setFieldValue("expertiseAreas", updated);
                    }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {skills.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-xs text-slate-400 mb-2">
                  No skills added yet
                </p>
                <button
                  onClick={() => setFieldValue("expertiseAreas", [""])}
                  className="text-xs font-bold text-[#01334c] hover:underline"
                >
                  Add your first skill
                </button>
              </div>
            )}
          </div>
        );
      }

      case "certifications": {
        const certifications =
          (getFieldValue("certifications") as string[]) || [];
        return (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Certifications
              </h3>
              <button
                onClick={() =>
                  setFieldValue("certifications", [...certifications, ""])
                }
                className="flex items-center gap-1 text-xs text-[#01334c] hover:bg-[#01334c]/5 px-2 py-1.5 rounded-lg border border-dashed border-[#01334c]/30 transition-all"
              >
                <Plus className="w-3 h-3" /> Add Certification
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {certifications.map((cert, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2 group hover:bg-white hover:shadow-sm transition-all focus-within:border-[#01334c]"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <input
                    type="text"
                    value={cert || ""}
                    onChange={(e) => {
                      const updated = [...certifications];
                      updated[i] = e.target.value;
                      setFieldValue("certifications", updated);
                    }}
                    placeholder="Certification Name - Authority"
                    className="flex-1 bg-transparent border-none outline-none text-xs"
                  />
                  <button
                    onClick={() => {
                      const updated = [...certifications];
                      updated.splice(i, 1);
                      setFieldValue("certifications", updated);
                    }}
                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {certifications.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">
                    No certifications added yet
                  </p>
                  <button
                    onClick={() => setFieldValue("certifications", [""])}
                    className="text-xs font-bold text-[#01334c] hover:underline"
                  >
                    Add your first certification
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ── Portal content ──────────────────────────────────────────────────────
  const overlayContent = (
    <>
      {/* 
                Single persistent spotlight element — pointerEvents: none so preview stays interactive
            */}
      <div
        className="guided-highlight-ring"
        style={{
          position: "fixed",
          top: highlightRect?.top ?? 0,
          left: highlightRect?.left ?? 0,
          width: highlightRect?.width ?? "100vw",
          height: highlightRect?.height ?? "100vh",
          borderRadius: highlightRect ? 14 : 0,
          boxShadow: highlightRect
            ? "0 0 0 9999px rgba(15, 23, 42, 0.25), 0 0 30px rgba(1, 51, 76, 0.15)"
            : "0 0 0 0 rgba(15, 23, 42, 0.25)",
          opacity:
            highlightVisible && highlightRect ? 1 : highlightRect ? 0.3 : 0.6,
          zIndex: 20,
          pointerEvents: "none",
          transition:
            "top 0.5s cubic-bezier(0.4,0,0.2,1), left 0.5s cubic-bezier(0.4,0,0.2,1), width 0.5s cubic-bezier(0.4,0,0.2,1), height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, border-radius 0.4s ease",
        }}
      />

      {/* Right-docked sliding panel */}
      <div
        key={cardKey}
        className={`fixed top-0 right-0 h-full w-[460px] bg-white shadow-2xl shadow-slate-900/30 border-l border-slate-200 flex flex-col z-[9999] ${isTransitioning
            ? "opacity-0 translate-x-4"
            : "opacity-100 translate-x-0"
          }`}
        style={{
          animation: "guided-panel-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#01334c] to-[#024466] px-6 py-4 flex-shrink-0 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Linkedin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {section.label}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/60 font-medium">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <div className="flex items-center gap-0.5">
                  {REVIEW_SECTIONS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? "bg-white" : i < currentStep ? "bg-white/40" : "bg-white/15"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSkipAll}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-600 leading-relaxed">
            {section.description}
          </p>
        </div>

        {/* Scrollable content: guidance + edit fields together */}
        <div ref={cardBodyRef} className="flex-1 overflow-y-auto">
          {/* Collapsible Guidance */}
          <div className="border-b border-slate-100">
            <button
              onClick={() => setShowGuidance(!showGuidance)}
              className="w-full px-6 py-2.5 flex items-center gap-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50/60 hover:bg-amber-50 transition-colors"
            >
              <Lightbulb className="w-3 h-3" />
              <span>Expert Tips & Examples</span>
              <ChevronDown
                className={`w-3 h-3 ml-auto transition-transform ${showGuidance ? "rotate-180" : ""}`}
              />
            </button>
            {showGuidance && (
              <div className="px-6 py-4 bg-amber-50/30 space-y-4 animate-fade-in-up">
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {section.guidance}
                  </p>
                  <div className="space-y-1.5">
                    {section.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-[11px] text-slate-500"
                      >
                        <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {section.examples && section.examples.length > 0 && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">
                      Examples
                    </h4>
                    {section.examples.map((ex, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-emerald-800/80 italic border-l-2 border-emerald-300 pl-2.5 py-0.5"
                      >
                        &ldquo;{ex}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit fields */}
          <div className="px-6 py-5">
            {/* AI Suggestion Overlay */}
            {aiSuggestion && (
              <div className="mb-5 bg-violet-50 border border-violet-100 rounded-2xl p-4 animate-fade-in-up shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-violet-900">
                      AI Enhancement Ready
                    </h4>
                    <p className="text-[10px] text-violet-600">
                      Review the suggested improvements
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3 bg-white/60 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar border border-violet-100/50">
                  {Object.entries(aiSuggestion).map(([key, value]) => (
                    <div key={key} className="text-[11px] text-slate-700">
                      <span className="font-bold text-violet-700 uppercase tracking-wider text-[10px] mr-1.5">
                        {key}:
                      </span>
                      <span className="leading-relaxed">
                        {typeof value === "string"
                          ? value
                          : Array.isArray(value)
                            ? value.join(", ")
                            : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onMerge(aiSuggestion);
                      setAiSuggestion(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200 active:scale-95"
                  >
                    <Check className="w-3 h-3" /> Accept & Use
                  </button>
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Main Input Fields */}
            {renderEditFields()}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex-shrink-0 space-y-3">
          {/* AI Controls */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="AI Instructions (e.g., make it more punchy)..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all placeholder-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEnhance();
              }}
            />
            <button
              onClick={handleEnhance}
              disabled={isEnhancing}
              className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-violet-200 hover:shadow-violet-300 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-wait whitespace-nowrap"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Enhancing
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" /> Enhance
                </>
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors bg-white border border-slate-200 shadow-sm ${currentStep === 0 ? "text-slate-300 cursor-not-allowed opacity-50" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={goNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#01334c] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-[#01334c]/20 hover:bg-[#024466] hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Finish
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Render via portal to document.body (avoids flex layout interference) ─
  if (!mounted) return null;
  return createPortal(overlayContent, document.body);
}
