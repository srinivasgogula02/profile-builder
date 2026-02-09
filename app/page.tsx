'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Bot,
  User,
  ArrowUp,
  File,
  Download,
  Loader2
} from 'lucide-react';
import { defaultProfileContent } from './lib/default-content';

// Import html2pdf dynamically to avoid SSR issues
// We'll handle this in the download function

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export default function Home() {
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profileContent, setProfileContent] = useState(defaultProfileContent);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (userInput.trim() === '') return;

    // Add user message
    const userText = userInput;
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
    setUserInput('');
    setIsTyping(true);

    // Simulate AI response and generation
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "Updating your document...", sender: 'bot' }]);
      setLoadingPreview(true);

      // Simulate generation delay
      setTimeout(() => {
        // In a real app, this would call an API with userText
        // For now, we just mock it or keep the default content (or duplicate it for effect)
        // Let's just keep the default content for this demo as requested
        // setProfileContent(defaultProfileContent); 
        setLoadingPreview(false);
      }, 600);

    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const downloadPDF = async () => {
    setDownloading(true);
    if (typeof window !== 'undefined') {
      const element = document.getElementById('printableArea');
      if (!element) {
        setDownloading(false);
        return;
      }

      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0,
        filename: 'my-profile.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setDownloading(false);
      });
    }
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 h-screen overflow-hidden flex selection:bg-indigo-500 selection:text-white font-[family-name:var(--font-inter)]">

      {/* Sidebar / Chat Interface */}
      <aside className="w-[350px] flex-shrink-0 flex flex-col border-r border-slate-700/50 bg-[#111827] relative z-20">

        <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-[#111827]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-white tracking-wide">ResumeAI</h1>
              <p className="text-xs text-slate-500">Document Builder</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide" id="chatContainer" ref={chatContainerRef}>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-slate-300 leading-relaxed max-w-[260px]">
                Hello! I'm here to design your professional profile. Just tell me your details, and I'll format it onto the A4 page on the right.
              </div>
            </div>
          </div>

          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'
                  }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              <div className="space-y-1">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[260px] ${msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-900/20'
                    : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-tl-none'
                    }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 px-4 py-4 rounded-2xl rounded-tl-none flex items-center">
                <div className="dot-flashing mx-2"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-[#111827]">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., Add a skills section..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />

            <button
              onClick={sendMessage}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col bg-[#0f172a] relative h-full">

        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-slate-700/50 bg-[#0f172a]/80 backdrop-blur z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <File className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Document Preview</span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-xs text-slate-500">A4 • Portrait</span>
          </div>

          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            {!downloading ? (
              <>
                <span>Download PDF</span>
                <Download className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Generating...</span>
                <Loader2 className="w-3 h-3 animate-spin" />
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative bg-[#1e293b] shadow-inner" id="docScrollArea">

          <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

          <div
            id="printableArea"
            className={`a4-page relative z-10 transition-all duration-500 ${loadingPreview ? 'blur-[1px] opacity-90' : 'blur-0 opacity-100'}`}
            dangerouslySetInnerHTML={{ __html: profileContent }}
          >
          </div>

          <div className="h-12"></div>
        </div>
      </main>
    </div>
  );
}
