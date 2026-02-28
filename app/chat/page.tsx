"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Bot,
  User,
  ArrowUp,
  File,
  Download,
  Loader2,
  Linkedin,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  LogOut,
  Pencil,
  MessageCircle,
  LayoutTemplate,
  MessageSquare,
  Menu,
  Lock,
} from "lucide-react";
import { renderProfile } from "../lib/default-content";
import { useProfileStore } from "../lib/store";
import {
  extractProfileFromLinkedIn,
  getAiChatResponse,
  polishProfileData,
} from "../lib/groq";
import { SECTIONS, computeSectionProgress } from "../lib/ai-prompt";
import EditProfileForm from "../components/EditProfileForm";
import GuidedReviewOverlay from "../components/GuidedReviewOverlay";
import AuthModal from "../components/AuthModal";
import { supabase } from "../lib/supabase";
import { loadProfiles, saveProfile, markLinkedinImported, deleteProfile } from "../lib/db";
import { ProfileData } from "../lib/schema";
import TemplatesSidebar from "../components/chat/TemplatesSidebar";
import ChatsSidebar from "../components/chat/ChatsSidebar";

export default function Home() {
  const {
    profileData,
    messages,
    isTyping,
    currentSection,
    sectionProgress,
    mergeProfileData,
    setProfileData,
    addMessage,
    setIsTyping,
    setCurrentSection,
    setSectionProgress,
    updateProfileField,
    user,
    showAuthModal,
    setUser,
    setShowAuthModal,
    setPendingAction,
    hasCompletedLinkedIn,
    setHasCompletedLinkedIn,
    isSaving,
    setIsSaving,
    profileLoaded,
    setProfileLoaded,
    showGuidedReview,
    setShowGuidedReview,
    activeProfileId,
    setActiveProfileId,
    profilesList,
    setProfilesList,
    loadChat,
    resetChat,
  } = useProfileStore();

  const [userInput, setUserInput] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [profileHtml, setProfileHtml] = useState("");

  // LinkedIn Modal State — start hidden until we know if user needs it
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [scrapeStatus, setScrapeStatus] = useState<
    "idle" | "loading" | "success" | "processing" | "error"
  >("idle");
  const [scrapeMessage, setScrapeMessage] = useState("");

  // New Onboarding Choice Dialog State
  const [showOnboardingChoice, setShowOnboardingChoice] = useState(false);

  // Sidebars State
  const [showTemplates, setShowTemplates] = useState(false);
  const [showChatsSidebar, setShowChatsSidebar] = useState(false);

  // Edit Form State
  const [showEditForm, setShowEditForm] = useState(false);
  const [tempProfileData, setTempProfileData] =
    useState<Partial<ProfileData> | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Cooldown ref to prevent rapid-fire API calls
  const lastActionTimeRef = useRef<number>(0);
  const ACTION_COOLDOWN_MS = 2000; // 2 seconds between actions

  const isOnCooldown = (): boolean => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < ACTION_COOLDOWN_MS) return true;
    lastActionTimeRef.current = now;
    return false;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  // Update profile HTML whenever data changes
  useEffect(() => {
    setLoadingPreview(true);
    const html = renderProfile(profileData);
    setProfileHtml(html);
    const timer = setTimeout(() => setLoadingPreview(false), 300);
    return () => clearTimeout(timer);
  }, [profileData]);

  // Update section progress whenever profile data changes
  useEffect(() => {
    const progress = computeSectionProgress(profileData);
    setSectionProgress(progress);
  }, [profileData, setSectionProgress]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ─── Auth listener + DB profile load ──────────────────────────────────────
  useEffect(() => {
    const loadUserProfile = async (userId: string) => {
      const rows = await loadProfiles(userId);
      const currentProfileData = useProfileStore.getState().profileData;
      const hasGuestContent = !!currentProfileData.fullName || !!currentProfileData.aboutMe;
      const activeProfileId = useProfileStore.getState().activeProfileId;

      if (hasGuestContent && !activeProfileId) {
        // User built a profile as a guest, then logged in.
        // DO NOT overwrite. Let the auto-save persist it as a new profile.
        setProfilesList(rows);
        setProfileLoaded(true);
        return;
      }

      setProfilesList(rows);

      if (rows.length > 0) {
        // Returning user — restore their most recent profile history
        const latestProfile = rows[0];
        loadChat(latestProfile);

        // Only show LinkedIn modal if they never completed it and it's basically empty
        if (!latestProfile.linkedin_imported && !latestProfile.profile_data.fullName) {
          setShowOnboardingChoice(true);
        }
      } else {
        // First-time user — show LinkedIn popup
        setProfileLoaded(true);
        setShowOnboardingChoice(true);
      }
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        // Not logged in — show LinkedIn modal (auth gate will handle login)
        setShowOnboardingChoice(true);
        setProfileLoaded(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const prevUser = useProfileStore.getState().user;
      setUser(session?.user ?? null);
      // Load profile when user just logged in (wasn't logged in before)
      if (session?.user && !prevUser) {
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-save to DB (debounced) ────────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Don't save until profile is loaded from DB and user is authenticated
    if (!user || !profileLoaded) return;
    // Don't save empty profiles
    if (!profileData.fullName && !profileData.aboutMe) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      const html = renderProfile(profileData);
      const savedRow = await saveProfile(user.id, profileData, messages, html, activeProfileId || undefined);

      if (savedRow && !activeProfileId) {
        setActiveProfileId(savedRow.id);
        const rows = await loadProfiles(user.id);
        setProfilesList(rows);
      }
      setIsSaving(false);
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, user, profileLoaded]);

  // Helper: require auth before an action
  const requireAuth = useCallback(
    (action: () => void): boolean => {
      if (!user) {
        setPendingAction(() => action);
        setShowAuthModal(true);
        return false; // not authed
      }
      return true; // authed
    },
    [user, setPendingAction, setShowAuthModal],
  );

  const isValidLinkedinUrl = (url: string) => {
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(url.trim());
  };

  const scrapeLinkedin = async () => {
    if (isOnCooldown()) return;
    if (isOnCooldown()) return;

    if (!isValidLinkedinUrl(linkedinUrl)) {
      setScrapeStatus("error");
      setScrapeMessage(
        "Please enter a valid LinkedIn URL (e.g. https://www.linkedin.com/in/username/)",
      );
      return;
    }

    setScrapeStatus("loading");
    setScrapeMessage("");

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_SCRAPER_URL || "http://localhost:8000/scrape",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedin_url: linkedinUrl.trim() }),
        },
      );

      if (res.ok) {
        const rawData = await res.json();
        setScrapeStatus("processing");
        setScrapeMessage("Profile scraped! Analyzing with AI...");

        const extractedData = await extractProfileFromLinkedIn(rawData);
        setTempProfileData(extractedData);

        setScrapeStatus("success");
        setScrapeMessage("All done! Opening editor...");

        // Mark LinkedIn as imported in DB
        if (user) markLinkedinImported(user.id);
        setHasCompletedLinkedIn(true);

        // Brief delay for success message visibility, then skip straight
        // to polish + guided review (no need for the edit form)
        setTimeout(() => {
          setShowLinkedinModal(false);
          handleSaveEdit(extractedData);
        }, 800);
      } else {
        const data = await res.json().catch(() => null);
        setScrapeStatus("error");
        setScrapeMessage(
          data?.detail ||
          data?.message ||
          `Request failed with status ${res.status}`,
        );
      }
    } catch {
      setScrapeStatus("error");
      setScrapeMessage(
        "Could not connect to the scraper server. Make sure the backend is running on port 8000.",
      );
    }
  };

  const handleSaveEdit = async (editedData: Partial<ProfileData>) => {
    setShowProcessingDialog(true);
    setIsPolishing(true);
    try {
      // Polish the data with AI before saving
      const polishedData = await polishProfileData(editedData);

      // Merge polished data OVER edited data, but protect profilePhoto if the AI returns it empty
      const finalData = { ...editedData, ...polishedData };
      if (editedData.profilePhoto && !polishedData.profilePhoto) {
        finalData.profilePhoto = editedData.profilePhoto;
      }
      setProfileData(finalData);
      setShowEditForm(false);

      // Launch guided review walkthrough instead of going straight to chat
      setShowGuidedReview(true);
    } catch (error) {
      console.error("Error saving/polishing profile:", error);
      // Fallback to saving raw data if polishing fails
      setProfileData(editedData);
      setShowEditForm(false);
      setShowGuidedReview(true);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleGuidedReviewComplete = () => {
    setShowGuidedReview(false);
    addMessage({
      text: `Great, your profile is looking solid! I can see your experience as ${profileData.professionalTitle || "a professional"}. Let me help you refine this into a powerful professional profile.\n\nWhat would you like to work on first?`,
      sender: "bot",
      suggestedReplies: [
        "Help me write my About Me",
        "Let's craft my personal story",
        "Explain my expertise areas",
      ],
    });
  };

  const GUEST_MSG_LIMIT = 4;
  const guestMsgCount = messages.filter((m) => m.sender === "user").length;
  const isGuestLocked = !user && guestMsgCount >= GUEST_MSG_LIMIT;

  const sendMessage = async (text?: string) => {
    const messageText = text || userInput.trim();
    if (messageText === "" || isTyping) return;
    if (isOnCooldown()) return;

    // Guest message limit gate
    if (isGuestLocked) {
      setShowAuthModal(true);
      return;
    }

    addMessage({ text: messageText, sender: "user" });
    setUserInput("");
    setIsTyping(true);

    try {
      const allMessages = [
        ...messages,
        { text: messageText, sender: "user" as const },
      ];
      const result = await getAiChatResponse(allMessages, profileData);

      if (result.updatedData) {
        mergeProfileData(result.updatedData);
      }

      if (result.sectionProgress) {
        setSectionProgress(result.sectionProgress);
      }

      addMessage({
        text: result.text,
        sender: "bot",
        suggestedReplies: result.suggestedReplies,
      });

      // Update current section based on progress
      if (result.sectionProgress) {
        const nextIncomplete = SECTIONS.find(
          (s) => (result.sectionProgress![s.id] ?? 0) < 100,
        );
        if (nextIncomplete) {
          setCurrentSection(nextIncomplete.id);
        } else {
          setCurrentSection("complete");
        }
      }
    } catch {
      addMessage({
        text: "I'm having a bit of trouble connecting. Could you try again?",
        sender: "bot",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const downloadPDF = async () => {
    if (!requireAuth(() => downloadPDF())) return;
    setDownloading(true);
    if (typeof window !== "undefined") {
      const element = document.getElementById("printableArea");
      if (!element) {
        setDownloading(false);
        return;
      }

      // Ensure fonts are loaded before capturing
      await document.fonts.ready;

      // ── Prepare element for clean PDF capture ──
      element.classList.add("no-shadow");

      // Temporarily collapse min-height on the a4-page itself to prevent blank trailing page
      const prevMinHeight = element.style.minHeight;
      const prevOverflow = element.style.overflow;
      element.style.minHeight = "0";
      element.style.overflow = "hidden";

      try {
        const html2pdf = (await import("html2pdf.js")).default;
        const opt = {
          margin: 0,
          filename: `${profileData.fullName || "my"}-profile.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait" as const,
            compress: true,
          },
          pagebreak: {
            mode: ["avoid-all", "css", "legacy"] as string[],
            before: ".pdf-page-break",
          },
        };

        // Generate PDF object first, then detect & remove blank trailing pages
        const pdfObj = await html2pdf()
          .set(opt)
          .from(element)
          .toPdf()
          .get("pdf");

        const totalPages = pdfObj.internal.getNumberOfPages();
        // Check the last page — if it's effectively blank, remove it
        // A blank page from html2pdf typically has no drawn content beyond the white background
        if (totalPages > 2) {
          // Remove trailing blank pages (check last 1-2 pages)
          for (let i = totalPages; i > 2; i--) {
            pdfObj.deletePage(i);
          }
        }

        pdfObj.save(`${profileData.fullName || "my"}-profile.pdf`);
      } catch (error) {
        console.error("PDF Download Error:", error);
      } finally {
        // Restore original styles
        element.classList.remove("no-shadow");
        element.style.minHeight = prevMinHeight;
        element.style.overflow = prevOverflow;
        setDownloading(false);
      }
    }
  };

  // Calculate overall progress
  const overallProgress =
    SECTIONS.length > 0
      ? Math.round(
        SECTIONS.reduce((sum, s) => sum + (sectionProgress[s.id] ?? 0), 0) /
        SECTIONS.length,
      )
      : 0;

  // Get last bot message suggested replies
  const lastBotMessage = [...messages]
    .reverse()
    .find((m) => m.sender === "bot");
  const currentSuggestedReplies = lastBotMessage?.suggestedReplies || [];

  return (
    <div className="bg-white text-slate-900 h-screen overflow-hidden flex selection:bg-[#01334c] selection:text-white font-[family-name:var(--font-inter)]">
      {/* Onboarding Choice Modal */}
      {showOnboardingChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[4px] animate-fade-in p-4 sm:p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 w-full max-w-3xl overflow-hidden border border-slate-100 animate-slide-up">

            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#01334c]/5 to-[#01334c]/10 flex items-center justify-center mx-auto mb-6 ring-4 ring-white shadow-sm">
                <Sparkles className="w-8 h-8 text-[#01334c]" />
              </div>

              <h2 className="text-3xl font-extrabold text-[#01334c] tracking-tight mb-4">
                How would you like to start?
              </h2>
              <p className="text-slate-500 md:text-lg max-w-xl mx-auto mb-10">
                Choose whether you want a magical head start using your existing LinkedIn data or if you prefer to build block by block.
              </p>

              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* LinkedIn Option */}
                <button
                  onClick={() => {
                    setShowOnboardingChoice(false);
                    setShowLinkedinModal(true);
                  }}
                  className="group relative flex flex-col items-center p-8 bg-white border-2 border-[#0077b5]/20 rounded-[1.5rem] hover:border-[#0077b5] hover:shadow-[0_8px_30px_rgba(0,119,181,0.12)] transition-all duration-300 active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#0077b5]/10"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0077b5]/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700 pointer-events-none"></div>

                  <div className="w-14 h-14 bg-[#0077b5]/10 text-[#0077b5] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#0077b5] group-hover:text-white transition-colors duration-300 shadow-sm">
                    <Linkedin className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-[#0077b5] transition-colors">Import from LinkedIn</h3>
                  <p className="text-sm text-slate-500 text-center leading-relaxed mb-8 flex-grow">
                    Fastest way to start. We'll extract your timeline, roles, and skills directly from your public profile in seconds.
                  </p>

                  <div className="w-full py-3.5 rounded-xl bg-[#0077b5] text-white text-sm font-bold tracking-wide transition-all duration-300 text-center mt-auto shadow-md shadow-[#0077b5]/20 group-hover:shadow-[#0077b5]/40 group-hover:-translate-y-0.5">
                    Recommended 🔥
                  </div>
                </button>

                {/* Scratch Option */}
                <button
                  onClick={() => {
                    const doSkip = () => {
                      setShowOnboardingChoice(false);
                      setTempProfileData({});
                      setShowEditForm(true);
                      setHasCompletedLinkedIn(true);
                      if (user) markLinkedinImported(user.id);
                    };
                    doSkip();
                  }}
                  className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-[#01334c]/30 hover:shadow-[0_8px_30px_rgba(1,51,76,0.08)] transition-all duration-300 active:scale-[0.98] overflow-hidden focus:outline-none focus:ring-4 focus:ring-[#01334c]/5"
                >
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#01334c]/5 group-hover:text-[#01334c] transition-colors duration-300 shadow-sm border border-slate-100">
                    <Pencil className="w-7 h-7" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-[#01334c] transition-colors">Start from Scratch</h3>
                  <p className="text-sm text-slate-500 text-center leading-relaxed mb-8 flex-grow">
                    Perfect if you want full control from the beginning or don't have an up-to-date LinkedIn profile to sync with.
                  </p>

                  <div className="w-full py-3.5 rounded-xl bg-slate-50 text-slate-500 text-sm font-bold tracking-wide group-hover:bg-[#01334c]/5 group-hover:text-[#01334c] transition-all duration-300 text-center mt-auto">
                    Choose Manual
                  </div>
                </button>
              </div>

              <p className="text-[13px] text-slate-400 mt-8 font-medium">
                Don't worry, you can always edit every detail later regardless of how you start.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn URL Modal */}
      {showLinkedinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md mx-4 overflow-hidden border border-slate-100 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#01334c] to-[#024466] px-8 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10 shadow-lg">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Import LinkedIn Profile
              </h2>
              <p className="text-sm text-white/60 mt-1.5 font-medium">
                Paste your profile URL to get started
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  LinkedIn Profile URL
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ExternalLink className="w-4 h-4 text-slate-400 group-focus-within:text-[#01334c] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => {
                      setLinkedinUrl(e.target.value);
                      if (scrapeStatus === "error") setScrapeStatus("idle");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && scrapeStatus !== "loading")
                        scrapeLinkedin();
                    }}
                    placeholder="https://www.linkedin.com/in/username/"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#01334c]/20 focus:border-[#01334c] transition-all group-hover:bg-white group-hover:shadow-md"
                    autoFocus
                    disabled={
                      scrapeStatus === "loading" || scrapeStatus === "success"
                    }
                  />
                </div>
              </div>

              {/* Status Message */}
              {scrapeStatus === "error" && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 animate-fade-in">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{scrapeMessage}</span>
                </div>
              )}

              {(scrapeStatus === "success" ||
                scrapeStatus === "processing") && (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 animate-fade-in">
                    {scrapeStatus === "processing" ? (
                      <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="font-medium">{scrapeMessage}</span>
                  </div>
                )}

              {/* Actions */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={scrapeLinkedin}
                  disabled={
                    scrapeStatus === "loading" ||
                    scrapeStatus === "processing" ||
                    scrapeStatus === "success" ||
                    !linkedinUrl.trim()
                  }
                  className="w-full py-3.5 rounded-xl bg-[#01334c] hover:bg-[#024466] disabled:opacity-50 disabled:hover:bg-[#01334c] text-white text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 active:scale-[0.98] flex items-center justify-center gap-2.5"
                >
                  {scrapeStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scraping Profile...</span>
                    </>
                  ) : scrapeStatus === "processing" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : scrapeStatus === "success" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready!</span>
                    </>
                  ) : (
                    <span>Import Profile</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    const doSkip = () => {
                      setShowLinkedinModal(false);
                      setTempProfileData({});
                      setShowEditForm(true);
                      // Mark LinkedIn as completed (skipped) so popup won't show on refresh
                      setHasCompletedLinkedIn(true);
                      if (user) markLinkedinImported(user.id);
                    };
                    doSkip();
                  }}
                  disabled={scrapeStatus === "loading"}
                  className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition-all duration-300 disabled:opacity-50"
                >
                  Skip — I&apos;ll build from scratch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar / Chat Interface */}
      <aside
        className={`w-[420px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white relative z-20 shadow-xl shadow-slate-200/50 transition-all duration-300 ${showGuidedReview ? "hidden" : ""}`}
      >
        {/* Chat Header */}
        <div className="h-20 flex items-center px-4 md:px-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full overflow-hidden">
          <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!requireAuth(() => setShowChatsSidebar(true))) return;
                setShowChatsSidebar(true);
              }}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              title="Previous Chats"
            >
              <Menu className="w-5 h-5 shrink-0" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#01334c] flex items-center justify-center shadow-lg shadow-[#01334c]/20 ring-4 ring-[#01334c]/5 transition-transform hover:scale-105 duration-300 shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold text-[16px] leading-tight text-[#01334c] tracking-tight truncate">
                ProfileArchitect
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest truncate">
                  AI Workspace
                </p>
                {isSaving && (
                  <span className="flex items-center gap-1 text-[9px] text-amber-500 font-medium shrink-0">
                    <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                    Saving
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  !requireAuth(() => {
                    setLinkedinUrl("");
                    setScrapeStatus("idle");
                    setScrapeMessage("");
                    setShowLinkedinModal(true);
                  })
                )
                  return;
                setLinkedinUrl("");
                setScrapeStatus("idle");
                setScrapeMessage("");
                setShowLinkedinModal(true);
              }}
              className="p-2 rounded-xl text-[#0077b5] bg-[#0077b5]/5 hover:bg-[#0077b5]/10 border border-[#0077b5]/20 transition-all duration-200 hover:shadow-sm active:scale-95 shrink-0"
              title="Import from LinkedIn"
            >
              <Linkedin className="w-4 h-4 shrink-0" />
            </button>

            {user && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Guest Mode Banner */}
        {!user && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between shadow-xs z-10">
            <div className="flex items-center gap-2 text-amber-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold">
                Guest Mode Active
              </span>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-full shadow-sm transition-transform active:scale-95"
            >
              Login to Save
            </button>
          </div>
        )}

        {/* Section Progress Pills */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#01334c]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Profile Progress
            </span>
            <span className="ml-auto text-xs font-bold text-[#01334c]">
              {overallProgress}%
            </span>
          </div>
          {/* Overall progress bar */}
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-[#01334c] to-[#0a6b8a] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          {/* Section pills */}
          <div className="flex flex-wrap gap-1.5">
            {SECTIONS.map((section) => {
              const progress = sectionProgress[section.id] ?? 0;
              const isActive = currentSection === section.id;
              const isComplete = progress >= 100;
              return (
                <div
                  key={section.id}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-300 cursor-default flex items-center gap-1
                    ${isComplete
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : isActive
                        ? "bg-[#01334c] text-white shadow-sm shadow-[#01334c]/20"
                        : progress > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  title={`${section.label}: ${progress}%`}
                >
                  {isComplete && <CheckCircle2 className="w-3 h-3" />}
                  <span>{section.label.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide"
          id="chatContainer"
          ref={chatContainerRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 group ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 ${msg.sender === "user"
                  ? "bg-[#01334c] ring-4 ring-[#01334c]/10"
                  : "bg-slate-50 border border-slate-100"
                  }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-[#01334c]" />
                )}
              </div>
              <div className="space-y-2 max-w-[290px]">
                <div
                  className={`px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed shadow-sm ${msg.sender === "user"
                    ? "bg-[#01334c] text-white rounded-tr-none shadow-[#01334c]/20"
                    : "bg-slate-50 border border-slate-100 text-slate-600 rounded-tl-none"
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Quick Reply Buttons (only on the last bot message) */}
                {msg.sender === "bot" &&
                  index === messages.length - 1 &&
                  msg.suggestedReplies &&
                  msg.suggestedReplies.length > 0 &&
                  !isTyping && (
                    <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                      {msg.suggestedReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleQuickReply(reply)}
                          className="px-3.5 py-2 rounded-2xl text-[12px] font-medium bg-white border border-slate-200 text-[#01334c] hover:bg-[#01334c] hover:text-white hover:border-[#01334c] transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-[#01334c]" />
              </div>
              <div className="bg-slate-50 border border-slate-100 px-5 py-4 rounded-3xl rounded-tl-none flex items-center shadow-sm">
                <div className="dot-flashing mx-2"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-5 border-t border-slate-100 bg-white/80 backdrop-blur-md z-10">
          {isGuestLocked ? (
            /* ── Guest lockout UI ── */
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="flex items-center gap-2 text-[#01334c]">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-bold">You've used your 4 free messages</span>
              </div>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Your profile progress is saved. <br />
                <span className="font-semibold text-slate-700">Create a free account</span> to keep building and download your profile.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3.5 rounded-2xl bg-[#01334c] text-white text-sm font-black tracking-wide shadow-xl shadow-[#01334c]/30 hover:bg-[#024466] hover:shadow-[#01334c]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Create Free Account — It's Fast
              </button>
              <p className="text-[10px] text-slate-400">
                No credit card • Takes 30 seconds
              </p>
            </div>
          ) : (
            /* ── Normal input ── */
            <>
              {!user && guestMsgCount > 0 && (
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: GUEST_MSG_LIMIT }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-5 rounded-full transition-all duration-300 ${i < guestMsgCount ? "bg-[#01334c]" : "bg-slate-200"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {guestMsgCount}/{GUEST_MSG_LIMIT} free messages
                  </span>
                </div>
              )}
              <div className="relative group">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#01334c]/20 focus:border-[#01334c] transition-all shadow-inner group-hover:bg-white group-hover:shadow-lg group-hover:shadow-slate-200/50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!userInput.trim() || isTyping}
                  className="absolute right-3 top-3 p-2 bg-[#01334c] hover:bg-[#024466] disabled:opacity-50 disabled:hover:bg-[#01334c] rounded-xl text-white transition-all duration-300 shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 active:scale-95"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide">
                AI-generated content may be inaccurate. Check important info.
              </p>
            </>
          )}
        </div>
      </aside>

      {/* Edit Profile Modal */}
      {showEditForm && tempProfileData && (
        <EditProfileForm
          initialData={tempProfileData}
          onSave={handleSaveEdit}
          loading={isPolishing}
          onCancel={() => {
            setShowEditForm(false);
            if (Object.keys(tempProfileData || {}).length === 0) {
              // Only add if we came from 'build from scratch' and haven't started yet
            }
          }}
        />
      )}

      {/* Guided Review Overlay */}
      {showGuidedReview && (
        <GuidedReviewOverlay
          profileData={profileData}
          onUpdateField={updateProfileField}
          onMerge={mergeProfileData}
          onComplete={handleGuidedReviewComplete}
          previewContainerId="printableArea"
          user={user}
          onShowAuth={() => setShowAuthModal(true)}
        />
      )}

      {/* Floating Chat FAB — visible when guided panel hides the chatbot */}
      {showGuidedReview && (
        <button
          onClick={() => setShowGuidedReview(false)}
          className="fixed bottom-6 left-6 z-[10000] group"
          title="Switch to AI Chat"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full bg-[#01334c]/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
            {/* Button */}
            <div className="relative w-14 h-14 rounded-full bg-[#01334c] shadow-xl shadow-[#01334c]/30 flex items-center justify-center text-white hover:bg-[#024466] hover:scale-110 active:scale-95 transition-all duration-200 ring-4 ring-white">
              <MessageCircle className="w-6 h-6" />
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              Switch to AI Chat
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
            </div>
          </div>
        </button>
      )}
      {/* Auth Modal */}
      {showAuthModal && <AuthModal />}

      {/* Polishing / Loading Dialog */}
      {/* Polishing / Loading Dialog */}
      {showProcessingDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full mx-4 text-center shadow-2xl animate-scale-in border border-slate-100/50">
            <div className="w-20 h-20 bg-[#01334c]/5 rounded-full flex items-center justify-center mx-auto mb-6 relative group">
              {isPolishing ? (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-[#01334c]/10"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-t-[#01334c] border-r-transparent border-b-transparent border-l-transparent animate-spin"
                    style={{ animationDuration: "1s" }}
                  ></div>
                  <Sparkles className="w-8 h-8 text-[#01334c] animate-pulse" />
                </>
              ) : (
                <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              {isPolishing ? "Analyzing Profile..." : "Analysis Complete!"}
            </h3>

            <p className="text-slate-500 text-sm leading-relaxed mb-8 px-2 font-medium">
              It only takes 60 seconds to check your data we got from you linkedin and add any missing feilds
            </p>

            <button
              onClick={() => setShowProcessingDialog(false)}
              disabled={isPolishing}
              className="w-full py-4 rounded-2xl bg-[#01334c] hover:bg-[#024466] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-2 group"
            >
              {isPolishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin opacity-70" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Review</span>
                  <ArrowUp className="w-4 h-4 rotate-90 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Preview Area */}
      <main
        className={`flex-1 flex flex-col bg-slate-50/50 relative h-full transition-all duration-300 ${showGuidedReview ? "pr-[460px]" : ""}`}
      >
        <div className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-slate-200/60 bg-white/80 backdrop-blur z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <File className="w-4 h-4 text-[#01334c]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#01334c]">
                Preview
              </span>
            </div>
            <div className="h-5 w-px bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-500">
              A4 Document • Portrait
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Themes button with revolving border */}
            <div className="relative group active:scale-95 transition-transform duration-150">
              {/* Spinning conic-gradient ring */}
              <div className="absolute inset-[-1.5px] rounded-[13px] overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-[-100%] animate-spin"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 55%, #01334c 65%, #0a6b8a 75%, transparent 85%)',
                    animationDuration: '2.5s',
                    animationTimingFunction: 'linear',
                  }}
                />
              </div>
              {/* The actual button */}
              <button
                onClick={() => setShowTemplates(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#01334c] text-xs font-bold uppercase tracking-wider border border-slate-200 group-hover:bg-[#01334c] group-hover:text-white group-hover:border-[#01334c] transition-all duration-300 shadow-sm"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Themes</span>
                <span className="text-[9px] font-black bg-[#01334c]/10 group-hover:bg-white/20 text-[#01334c] group-hover:text-white px-1.5 py-0.5 rounded-full transition-colors">NEW</span>
              </button>
            </div>
            <button
              onClick={() => setShowGuidedReview(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-[#01334c] text-xs font-bold uppercase tracking-wider hover:bg-[#01334c] hover:text-white hover:border-[#01334c] transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#01334c]/20 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-[#01334c] text-xs font-bold uppercase tracking-wider hover:bg-[#01334c] hover:text-white hover:border-[#01334c] transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[#01334c]/20 active:scale-95"
            >
              {!downloading ? (
                <>
                  <span>Export PDF</span>
                  <Download className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Processing</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </>
              )}
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-10 md:p-16 relative"
          id="docScrollArea"
        >
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 z-0 opacity-[0.4]"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          ></div>

          <div
            id="printableArea"
            className={`a4-page relative z-10 transition-all duration-700 ease-out transform origin-top ${loadingPreview ? "blur-sm scale-[0.99] opacity-90" : "blur-0 scale-100 opacity-100"} shadow-2xl shadow-slate-200`}
            dangerouslySetInnerHTML={{ __html: typeof window !== 'undefined' ? require('dompurify').sanitize(profileHtml) : profileHtml }}
          ></div>

          <div className="h-20"></div>
        </div>
      </main>

      {/* Templates Sidebar */}
      <TemplatesSidebar
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />

      {/* Chats Sidebar */}
      <ChatsSidebar
        isOpen={showChatsSidebar}
        onClose={() => setShowChatsSidebar(false)}
        onNewChat={() => {
          resetChat();
          setShowChatsSidebar(false);
          setShowOnboardingChoice(true);
        }}
      />
    </div>
  );
}
