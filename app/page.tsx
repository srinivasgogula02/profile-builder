'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { renderProfile } from './lib/default-content';
import { useProfileStore } from './lib/store';
import { extractProfileFromLinkedIn, getAiChatResponse, polishProfileData } from './lib/groq';
import { SECTIONS, computeSectionProgress } from './lib/ai-prompt';
import EditProfileForm from './components/EditProfileForm';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabase';
import { loadProfile, saveProfile, markLinkedinImported } from './lib/db';
import { ProfileData } from './lib/schema';

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
  } = useProfileStore();

  const [userInput, setUserInput] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [profileHtml, setProfileHtml] = useState('');

  // LinkedIn Modal State — start hidden until we know if user needs it
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState<'idle' | 'loading' | 'success' | 'processing' | 'error'>('idle');
  const [scrapeMessage, setScrapeMessage] = useState('');

  // Edit Form State
  const [showEditForm, setShowEditForm] = useState(false);
  const [tempProfileData, setTempProfileData] = useState<Partial<ProfileData> | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

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
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ─── Auth listener + DB profile load ──────────────────────────────────────
  useEffect(() => {
    const loadUserProfile = async (userId: string) => {
      const row = await loadProfile(userId);
      if (row) {
        // Returning user — restore their profile
        setProfileData(row.profile_data);
        setHasCompletedLinkedIn(row.linkedin_imported);
        setProfileLoaded(true);
        // Only show LinkedIn modal if they never completed it
        if (!row.linkedin_imported) {
          setShowLinkedinModal(true);
        }
      } else {
        // First-time user — show LinkedIn popup
        setProfileLoaded(true);
        setShowLinkedinModal(true);
      }
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        // Not logged in — show LinkedIn modal (auth gate will handle login)
        setShowLinkedinModal(true);
        setProfileLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      await saveProfile(user.id, profileData, html);
      setIsSaving(false);
    }, 3000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, user, profileLoaded]);

  // Helper: require auth before an action
  const requireAuth = useCallback((action: () => void): boolean => {
    if (!user) {
      setPendingAction(() => action);
      setShowAuthModal(true);
      return false; // not authed
    }
    return true; // authed
  }, [user, setPendingAction, setShowAuthModal]);

  const isValidLinkedinUrl = (url: string) => {
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/.test(url.trim());
  };

  const scrapeLinkedin = async () => {
    if (!requireAuth(() => scrapeLinkedin())) return;
    if (isOnCooldown()) return;

    if (!isValidLinkedinUrl(linkedinUrl)) {
      setScrapeStatus('error');
      setScrapeMessage('Please enter a valid LinkedIn URL (e.g. https://www.linkedin.com/in/username/)');
      return;
    }

    setScrapeStatus('loading');
    setScrapeMessage('');

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://localhost:8000/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedinUrl.trim() }),
      });

      if (res.ok) {
        const rawData = await res.json();
        setScrapeStatus('processing');
        setScrapeMessage('Profile scraped! Analyzing with AI...');

        const extractedData = await extractProfileFromLinkedIn(rawData);
        setTempProfileData(extractedData);

        setScrapeStatus('success');
        setScrapeMessage('All done! Opening editor...');

        // Mark LinkedIn as imported in DB
        if (user) markLinkedinImported(user.id);
        setHasCompletedLinkedIn(true);

        // Brief delay for success message visibility
        setTimeout(() => {
          setShowLinkedinModal(false);
          setShowEditForm(true);
        }, 800);
      } else {
        const data = await res.json().catch(() => null);
        setScrapeStatus('error');
        setScrapeMessage(data?.detail || data?.message || `Request failed with status ${res.status}`);
      }
    } catch {
      setScrapeStatus('error');
      setScrapeMessage('Could not connect to the scraper server. Make sure the backend is running on port 8000.');
    }
  };

  const handleSaveEdit = async (editedData: Partial<ProfileData>) => {
    setIsPolishing(true);
    try {
      // Polish the data with AI before saving
      const polishedData = await polishProfileData(editedData);
      setProfileData(polishedData);
      setShowEditForm(false);

      addMessage({
        text: `I've refined your details to make them more professional. I can see your experience as ${polishedData.professionalTitle}. Let me help you refine this into a powerful professional profile. What would you like to work on first — your personal story, or should I help craft your 'About Me'?`,
        sender: 'bot',
        suggestedReplies: [
          "Help me write my About Me",
          "Let's craft my personal story",
          "Explain my expertise areas",
        ],
      });
    } catch (error) {
      console.error("Error saving/polishing profile:", error);
      // Fallback to saving raw data if polishing fails
      setProfileData(editedData);
      setShowEditForm(false);
      addMessage({
        text: "I've saved your information. Let's get started on refining it further. What would you like to work on first?",
        sender: 'bot',
      });
    } finally {
      setIsPolishing(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || userInput.trim();
    if (messageText === '' || isTyping) return;
    if (isOnCooldown()) return;

    if (!requireAuth(() => sendMessage(messageText))) return;

    addMessage({ text: messageText, sender: 'user' });
    setUserInput('');
    setIsTyping(true);

    try {
      const allMessages = [...messages, { text: messageText, sender: 'user' as const }];
      const result = await getAiChatResponse(allMessages, profileData);

      if (result.updatedData) {
        mergeProfileData(result.updatedData);
      }

      if (result.sectionProgress) {
        setSectionProgress(result.sectionProgress);
      }

      addMessage({
        text: result.text,
        sender: 'bot',
        suggestedReplies: result.suggestedReplies,
      });

      // Update current section based on progress
      if (result.sectionProgress) {
        const nextIncomplete = SECTIONS.find(s => (result.sectionProgress![s.id] ?? 0) < 100);
        if (nextIncomplete) {
          setCurrentSection(nextIncomplete.id);
        } else {
          setCurrentSection('complete');
        }
      }
    } catch {
      addMessage({ text: "I'm having a bit of trouble connecting. Could you try again?", sender: 'bot' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (!requireAuth(() => handleQuickReply(reply))) return;
    sendMessage(reply);
  };

  const downloadPDF = async () => {
    setDownloading(true);
    if (typeof window !== 'undefined') {
      const element = document.getElementById('printableArea');
      if (!element) {
        setDownloading(false);
        return;
      }

      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0,
        filename: `${profileData.fullName || 'my'}-profile.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.section-box', '.header-container', '.roles-section', '.brands-section', '.prompt-box', '.contact-section'] },
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setDownloading(false);
      });
    }
  };

  // Calculate overall progress
  const overallProgress = SECTIONS.length > 0
    ? Math.round(SECTIONS.reduce((sum, s) => sum + (sectionProgress[s.id] ?? 0), 0) / SECTIONS.length)
    : 0;

  // Get last bot message suggested replies
  const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
  const currentSuggestedReplies = lastBotMessage?.suggestedReplies || [];

  return (
    <div className="bg-white text-slate-900 h-screen overflow-hidden flex selection:bg-[#01334c] selection:text-white font-[family-name:var(--font-inter)]">

      {/* LinkedIn URL Modal */}
      {showLinkedinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/20 w-full max-w-md mx-4 overflow-hidden border border-slate-100 animate-slide-up">

            {/* Header */}
            <div className="bg-gradient-to-br from-[#01334c] to-[#024466] px-8 py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10 shadow-lg">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Import LinkedIn Profile</h2>
              <p className="text-sm text-white/60 mt-1.5 font-medium">Paste your profile URL to get started</p>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">LinkedIn Profile URL</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ExternalLink className="w-4 h-4 text-slate-400 group-focus-within:text-[#01334c] transition-colors" />
                  </div>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => { setLinkedinUrl(e.target.value); if (scrapeStatus === 'error') setScrapeStatus('idle'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && scrapeStatus !== 'loading') scrapeLinkedin(); }}
                    placeholder="https://www.linkedin.com/in/username/"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#01334c]/20 focus:border-[#01334c] transition-all group-hover:bg-white group-hover:shadow-md"
                    autoFocus
                    disabled={scrapeStatus === 'loading' || scrapeStatus === 'success'}
                  />
                </div>
              </div>

              {/* Status Message */}
              {scrapeStatus === 'error' && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 animate-fade-in">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{scrapeMessage}</span>
                </div>
              )}

              {(scrapeStatus === 'success' || scrapeStatus === 'processing') && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 animate-fade-in">
                  {scrapeStatus === 'processing'
                    ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  }
                  <span className="font-medium">{scrapeMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-1">
                <button
                  onClick={scrapeLinkedin}
                  disabled={scrapeStatus === 'loading' || scrapeStatus === 'processing' || scrapeStatus === 'success' || !linkedinUrl.trim()}
                  className="w-full py-3.5 rounded-xl bg-[#01334c] hover:bg-[#024466] disabled:opacity-50 disabled:hover:bg-[#01334c] text-white text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 active:scale-[0.98] flex items-center justify-center gap-2.5"
                >
                  {scrapeStatus === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scraping Profile...</span>
                    </>
                  ) : scrapeStatus === 'processing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing with AI...</span>
                    </>
                  ) : scrapeStatus === 'success' ? (
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
                    if (!requireAuth(doSkip)) return;
                    doSkip();
                  }}
                  disabled={scrapeStatus === 'loading'}
                  className="w-full py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Skip — I&apos;ll build from scratch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar / Chat Interface */}
      <aside className="w-[420px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-white relative z-20 shadow-xl shadow-slate-200/50">

        {/* Chat Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#01334c] flex items-center justify-center shadow-lg shadow-[#01334c]/20 ring-4 ring-[#01334c]/5 transition-transform hover:scale-105 duration-300">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-[#01334c] tracking-tight">ProfileArchitect</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">AI Workspace</p>
                {isSaving && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 font-medium">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    Saving
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!requireAuth(() => {
                setLinkedinUrl('');
                setScrapeStatus('idle');
                setScrapeMessage('');
                setShowLinkedinModal(true);
              })) return;
              setLinkedinUrl('');
              setScrapeStatus('idle');
              setScrapeMessage('');
              setShowLinkedinModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#0077b5] bg-[#0077b5]/5 hover:bg-[#0077b5]/10 border border-[#0077b5]/20 transition-all duration-200 hover:shadow-sm active:scale-95"
            title="Import from LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
            <span className="hidden sm:inline">Import LinkedIn</span>
          </button>
        </div>

        {/* Section Progress Pills */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#01334c]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profile Progress</span>
            <span className="ml-auto text-xs font-bold text-[#01334c]">{overallProgress}%</span>
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
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : isActive
                        ? 'bg-[#01334c] text-white shadow-sm shadow-[#01334c]/20'
                        : progress > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  title={`${section.label}: ${progress}%`}
                >
                  {isComplete && <CheckCircle2 className="w-3 h-3" />}
                  <span>{section.label.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide" id="chatContainer" ref={chatContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 group ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 ${msg.sender === 'user' ? 'bg-[#01334c] ring-4 ring-[#01334c]/10' : 'bg-slate-50 border border-slate-100'
                  }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-[#01334c]" />
                )}
              </div>
              <div className="space-y-2 max-w-[290px]">
                <div
                  className={`px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed shadow-sm ${msg.sender === 'user'
                    ? 'bg-[#01334c] text-white rounded-tr-none shadow-[#01334c]/20'
                    : 'bg-slate-50 border border-slate-100 text-slate-600 rounded-tl-none'
                    }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Quick Reply Buttons (only on the last bot message) */}
                {msg.sender === 'bot' && index === messages.length - 1 && msg.suggestedReplies && msg.suggestedReplies.length > 0 && !isTyping && (
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

      {/* Auth Modal */}
      {showAuthModal && <AuthModal />}

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col bg-slate-50/50 relative h-full">

        <div className="h-20 flex-shrink-0 flex items-center justify-between px-8 border-b border-slate-200/60 bg-white/80 backdrop-blur z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
              <File className="w-4 h-4 text-[#01334c]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#01334c]">Preview</span>
            </div>
            <div className="h-5 w-px bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-500">A4 Document • Portrait</span>
          </div>

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

        <div className="flex-1 overflow-y-auto p-10 md:p-16 relative" id="docScrollArea">

          {/* Subtle Grid Background */}
          <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

          <div
            id="printableArea"
            className={`a4-page relative z-10 transition-all duration-700 ease-out transform origin-top ${loadingPreview ? 'blur-sm scale-[0.99] opacity-90' : 'blur-0 scale-100 opacity-100'} shadow-2xl shadow-slate-200`}
            dangerouslySetInnerHTML={{ __html: profileHtml }}
          >
          </div>

          <div className="h-20"></div>
        </div>
      </main>
    </div>
  );
}
