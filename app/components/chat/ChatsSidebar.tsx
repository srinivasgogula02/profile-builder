"use client";

import React from "react";
import { MessageSquare, Plus, Trash2, X, FileText, Loader2 } from "lucide-react";
import { useProfileStore } from "@/app/lib/store";
import { deleteProfile, loadProfiles } from "@/app/lib/db";

interface ChatsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
}

export default function ChatsSidebar({ isOpen, onClose, onNewChat }: ChatsSidebarProps) {
    const {
        profilesList,
        activeProfileId,
        loadChat,
        resetChat,
        user,
        setProfilesList,
        setProfileLoaded
    } = useProfileStore();

    const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

    const handleNewChat = () => {
        resetChat();
        setProfileLoaded(true);
        onNewChat();
        onClose();
    };

    const handleSelectChat = (profile: any) => {
        loadChat(profile);
        onClose();
    };

    const handleDeleteChat = async (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation();
        if (!user) return;

        setIsDeleting(profileId);
        const success = await deleteProfile(profileId, user.id);
        if (success) {
            const updated = await loadProfiles(user.id);
            setProfilesList(updated);

            // If they deleted the active chat, start a new one or load the most recent
            if (profileId === activeProfileId) {
                if (updated.length > 0) {
                    loadChat(updated[0]);
                } else {
                    handleNewChat();
                }
            }
        }
        setIsDeleting(null);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#01334c] flex items-center justify-center shadow-lg shadow-[#01334c]/20">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="font-bold text-lg text-[#01334c]">Your Chats</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <button
                        onClick={handleNewChat}
                        className="w-full py-3 px-4 bg-[#01334c] hover:bg-[#024466] text-white text-sm font-bold tracking-wide rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Profile Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {profilesList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                            <span className="text-sm font-medium">No previous chats</span>
                        </div>
                    ) : (
                        profilesList.map((profile) => {
                            const isActive = profile.id === activeProfileId;
                            const title = profile.profile_data?.fullName || "Untitled Profile";

                            // Format date safely
                            let dateStr = "Recently";
                            try {
                                dateStr = new Date(profile.updated_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric'
                                });
                            } catch (e) { }

                            return (
                                <div
                                    key={profile.id}
                                    onClick={() => handleSelectChat(profile)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all group ${isActive
                                        ? "border-[#01334c]/30 bg-[#01334c]/5 shadow-sm"
                                        : "border-slate-100 bg-white hover:border-[#01334c]/20 hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[#01334c] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-[#01334c]/10 group-hover:text-[#01334c]"
                                            }`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 pr-2">
                                            <p className={`text-sm font-semibold truncate ${isActive ? "text-[#01334c]" : "text-slate-700"}`}>
                                                {title}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {dateStr}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteChat(e, profile.id)}
                                        disabled={isDeleting === profile.id}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Delete chat"
                                    >
                                        {isDeleting === profile.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
