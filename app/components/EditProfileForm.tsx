"use client";

import { useState } from "react";
import {
  X,
  Save,
  User,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { ProfileData } from "../lib/schema";

interface EditProfileFormProps {
  initialData: Partial<ProfileData>;
  onSave: (data: Partial<ProfileData>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EditProfileForm({
  initialData,
  onSave,
  onCancel,
  loading,
}: EditProfileFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileData>>(initialData);
  const [activeTab, setActiveTab] = useState<
    "basic" | "experience" | "education" | "social"
  >("basic");

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof ProfileData] as any),
        [field]: value,
      },
    }));
  };

  const addItem = (field: "positions" | "education" | "expertiseAreas") => {
    if (field === "expertiseAreas") {
      const current = formData.expertiseAreas || [];
      setFormData((prev) => ({ ...prev, expertiseAreas: [...current, ""] }));
    } else if (field === "positions") {
      const current = formData.positions || [];
      setFormData((prev) => ({
        ...prev,
        positions: [
          ...current,
          {
            title: "",
            company: "",
            location: "",
            duration: "",
            description: "",
          },
        ],
      }));
    } else if (field === "education") {
      const current = formData.education || [];
      setFormData((prev) => ({
        ...prev,
        education: [
          ...current,
          { schoolName: "", degreeName: "", fieldOfStudy: "", duration: "" },
        ],
      }));
    }
  };

  const removeItem = (
    field: "positions" | "education" | "expertiseAreas",
    index: number,
  ) => {
    const current = [...(formData[field] as any[])];
    current.splice(index, 1);
    setFormData((prev) => ({ ...prev, [field]: current }));
  };

  const updateItem = (
    field: "positions" | "education" | "expertiseAreas",
    index: number,
    value: any,
  ) => {
    const current = [...(formData[field] as any[])];
    current[index] = value;
    setFormData((prev) => ({ ...prev, [field]: current }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#01334c] to-[#024466] px-8 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-4 ring-white/5">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Review Your Profile
              </h2>
              <p className="text-sm text-white/60">
                Review and polish your details below to get started.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-4 pt-4 border-b border-slate-100 bg-slate-50/50">
          {[
            { id: "basic", label: "Basic Info", icon: User },
            { id: "experience", label: "Experience", icon: Briefcase },
            { id: "education", label: "Education", icon: GraduationCap },
            { id: "social", label: "Links & Social", icon: LinkIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all relative
                ${activeTab === tab.id ? "text-[#01334c]" : "text-slate-400 hover:text-slate-600"}`}
            >
              <tab.icon
                className={`w-4 h-4 ${activeTab === tab.id ? "text-[#01334c]" : "text-slate-400"}`}
              />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#01334c] rounded-t-full shadow-[0_-2px_8px_rgba(1,51,76,0.3)]" />
              )}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div
          className={`flex-1 overflow-y-auto p-8 bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent ${loading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {activeTab === "basic" && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={formData.professionalTitle || ""}
                    onChange={(e) =>
                      handleInputChange("professionalTitle", e.target.value)
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Profile Photo URL
                  </label>
                  <input
                    type="text"
                    value={formData.profilePhoto || ""}
                    onChange={(e) =>
                      handleInputChange("profilePhoto", e.target.value)
                    }
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline || ""}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Personal Story (One Line / 30 Words)
                </label>
                <textarea
                  value={formData.personalStory30 || ""}
                  onChange={(e) =>
                    handleInputChange("personalStory30", e.target.value)
                  }
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  About Me
                </label>
                <textarea
                  value={formData.aboutMe || ""}
                  onChange={(e) => handleInputChange("aboutMe", e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#01334c]/10 focus:border-[#01334c] outline-none transition-all resize-none"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Expertise Areas
                  </label>
                  <button
                    onClick={() => addItem("expertiseAreas")}
                    className="text-[#01334c] hover:bg-[#01334c]/5 p-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.expertiseAreas || []).map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 group"
                    >
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) => {
                          const newSkills = [
                            ...(formData.expertiseAreas || []),
                          ];
                          newSkills[index] = e.target.value;
                          handleInputChange("expertiseAreas", newSkills);
                        }}
                        className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all"
                      />
                      <button
                        onClick={() => removeItem("expertiseAreas", index)}
                        className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Work History
                </h3>
                <button
                  onClick={() => addItem("positions")}
                  className="flex items-center gap-2 text-xs font-bold text-[#01334c] hover:bg-[#01334c]/5 px-3 py-2 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Experience
                </button>
              </div>
              <div className="space-y-4">
                {(formData.positions || []).map((pos, index) => (
                  <div
                    key={index}
                    className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 relative group hover:border-[#01334c]/20 hover:bg-white transition-all shadow-sm hover:shadow-md"
                  >
                    <button
                      onClick={() => removeItem("positions", index)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={pos.title || ""}
                          onChange={(e) =>
                            updateItem("positions", index, {
                              ...pos,
                              title: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Company
                        </label>
                        <input
                          type="text"
                          value={pos.company || ""}
                          onChange={(e) =>
                            updateItem("positions", index, {
                              ...pos,
                              company: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={pos.duration || ""}
                          onChange={(e) =>
                            updateItem("positions", index, {
                              ...pos,
                              duration: e.target.value,
                            })
                          }
                          placeholder="Jan 2020 - Present"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Location
                        </label>
                        <input
                          type="text"
                          value={pos.location || ""}
                          onChange={(e) =>
                            updateItem("positions", index, {
                              ...pos,
                              location: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Description
                      </label>
                      <textarea
                        value={pos.description || ""}
                        onChange={(e) =>
                          updateItem("positions", index, {
                            ...pos,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#01334c] outline-none resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Academic Background
                </h3>
                <button
                  onClick={() => addItem("education")}
                  className="flex items-center gap-2 text-xs font-bold text-[#01334c] hover:bg-[#01334c]/5 px-3 py-2 rounded-xl transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Education
                </button>
              </div>
              <div className="space-y-4">
                {(formData.education || []).map((edu, index) => (
                  <div
                    key={index}
                    className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 relative group hover:border-[#01334c]/20 hover:bg-white transition-all shadow-sm hover:shadow-md"
                  >
                    <button
                      onClick={() => removeItem("education", index)}
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          School Name
                        </label>
                        <input
                          type="text"
                          value={edu.schoolName || ""}
                          onChange={(e) =>
                            updateItem("education", index, {
                              ...edu,
                              schoolName: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Degree
                        </label>
                        <input
                          type="text"
                          value={edu.degreeName || ""}
                          onChange={(e) =>
                            updateItem("education", index, {
                              ...edu,
                              degreeName: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Field of Study
                        </label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy || ""}
                          onChange={(e) =>
                            updateItem("education", index, {
                              ...edu,
                              fieldOfStudy: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={edu.duration || ""}
                          onChange={(e) =>
                            updateItem("education", index, {
                              ...edu,
                              duration: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#01334c] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-8 animate-fade-in-up">
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Profile Links
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.linkedin || ""}
                      onChange={(e) =>
                        handleNestedChange(
                          "socialLinks",
                          "linkedin",
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#01334c] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Personal Website
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.website || ""}
                      onChange={(e) =>
                        handleNestedChange(
                          "socialLinks",
                          "website",
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#01334c] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Contact Details
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Primary Email
                    </label>
                    <input
                      type="text"
                      value={formData.contact?.emailPrimary || ""}
                      onChange={(e) =>
                        handleNestedChange(
                          "contact",
                          "emailPrimary",
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#01334c] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.contact?.phonePrimary || ""}
                      onChange={(e) =>
                        handleNestedChange(
                          "contact",
                          "phonePrimary",
                          e.target.value,
                        )
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#01334c] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 font-medium italic">
            Tip: You can always update these later through chat.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-200/50 transition-all active:scale-95 disabled:opacity-50"
            >
              Skip & Continue with AI
            </button>
            <button
              onClick={() => onSave(formData)}
              disabled={loading}
              className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-[#01334c] hover:bg-[#024466] text-white text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#01334c]/20 hover:shadow-[#01334c]/40 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Polishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
