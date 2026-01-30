"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dashboard as dashboardApi, counsellor as counsellorApi } from "@/lib/api";
import type { ChatMessageItem } from "@/lib/api";
import Nav from "@/components/Nav";

interface UniversitySuggestion {
  id?: string;
  type: string;
  name?: string;
  country?: string;
  domain?: string;
  web_page?: string;
  category?: string;
  cost_level?: string;
  acceptance_chance?: string;
  fit_reason?: string;
  risks?: string;
}

// Helper function to parse markdown formatting
const parseMarkdown = (text: string) => {
  if (!text) return text;
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  
  // Handle **bold** and *italic*
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add bold or italic
    if (match[1]) {
      // **bold**
      parts.push(<strong key={lastIndex} className="font-bold">{match[1]}</strong>);
    } else if (match[2]) {
      // *italic*
      parts.push(<em key={lastIndex} className="italic">{match[2]}</em>);
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length === 0 ? text : parts;
};

// Helper function to render text with line breaks and list formatting
const renderFormattedText = (text: string) => {
  const lines = text.split('\n');
  
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    
    // Handle lines starting with * as list items
    if (trimmed.startsWith('* ')) {
      return (
        <li key={idx} className="ml-4">
          {parseMarkdown(trimmed.slice(2))}
        </li>
      );
    }
    
    // Handle regular lines
    if (trimmed) {
      return (
        <p key={idx} className="mb-2">
          {parseMarkdown(trimmed)}
        </p>
      );
    }
    
    return null;
  });
};

export default function CounsellorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversitySuggestion | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    counsellorApi.history().then(setHistory).catch(() => setHistory([]));
  }, [user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessage("");
    try {
      const { message: msg } = await counsellorApi.chat(text);
      setHistory(await counsellorApi.history());
      setMessage("");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const extractUniversitiesFromMessage = (m: ChatMessageItem): UniversitySuggestion[] => {
    if (!m.actions || m.actions.length === 0) return [];
    return m.actions
      .filter((a: any) => a.type === "shortlist_add")
      .map((a: any, idx: number) => {
        console.log("[DEBUG] Extracted university action:", a);
        return {
          ...a,
          id: `${m.id}-${idx}`,
        };
      });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Nav />
      <div className="flex-1 flex gap-4 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-w-0">
          <h1 className="text-xl font-bold text-slate-900 mb-4">AI Counsellor</h1>
          <div className="card bg-blue-50 border-blue-200 mb-4">
            <p className="text-blue-900">Enhance your profile for better recommendations.</p>
            <a href="/profile" className="text-teal-600 font-medium mt-2 inline-block">
              Update profile →
            </a>
          </div>
          <div className="card flex-1 flex flex-col min-h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
              {history.length === 0 && !sending && (
                <p className="text-slate-500 text-sm">
                  Ask about your profile, next steps, or request university recommendations. The counsellor can shortlist universities and add tasks.
                </p>
              )}
              {history.map((m) => {
                const universities = extractUniversitiesFromMessage(m);
                return (
                  <div key={m.id}>
                    <div
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 ${
                          m.role === "user"
                            ? "bg-teal-600 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {m.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        ) : (
                          <div className="text-sm space-y-1">
                            {renderFormattedText(m.content)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* University Suggestions */}
                    {universities.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {universities.map((uni) => (
                          <div
                            key={uni.id}
                            onClick={() => setSelectedUniversity(uni)}
                            className={`border border-slate-300 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedUniversity?.id === uni.id
                                ? "bg-teal-50 border-teal-400 ring-2 ring-teal-200"
                                : "bg-white hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 text-sm truncate">{uni.name}</h4>
                                <p className="text-xs text-slate-600 mt-1">{uni.country}</p>
                              </div>
                              <span className="text-xs font-medium text-slate-600 capitalize flex-shrink-0 px-2 py-1 bg-slate-100 rounded">
                                {uni.category}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                              <div>
                                <p className="text-slate-600">Cost</p>
                                <p className="font-semibold text-slate-900">{uni.cost_level || "—"}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Acceptance</p>
                                <p className="font-semibold text-slate-900">{uni.acceptance_chance || "—"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {message && <p className="text-red-600 text-sm mb-2">{message}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="input flex-1"
                disabled={sending}
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !input.trim()}
                className="btn-primary"
              >
                {sending ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedUniversity && (
          <div className="w-80 flex-shrink-0 sticky top-14 animate-in slide-in-from-right duration-300 h-fit">
            <div className="card overflow-y-auto max-h-[calc(100vh-8rem)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">University Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedUniversity(null)}
                  className="text-slate-500 hover:text-slate-700 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm">
                {!selectedUniversity.name ? (
                  <p className="text-slate-500 text-sm">No university details available.</p>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{selectedUniversity.name}</h3>
                      <p className="text-slate-600 mt-1">{selectedUniversity.country || "—"}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Annual Cost</p>
                        <p className="font-semibold text-slate-900">{selectedUniversity.cost_level || "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs mb-1">Acceptance</p>
                        <p className="font-semibold text-slate-900">{selectedUniversity.acceptance_chance || "—"}</p>
                      </div>
                    </div>

                    {selectedUniversity.category && (
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-slate-600 text-xs mb-1">Category</p>
                        <span className="inline-block text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded capitalize">
                          {selectedUniversity.category}
                        </span>
                      </div>
                    )}

                    {selectedUniversity.domain && (
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-slate-600 text-xs mb-1">Domain</p>
                        <p className="font-mono text-xs text-teal-600">{selectedUniversity.domain}</p>
                      </div>
                    )}

                    {selectedUniversity.web_page && (
                      <div className="pb-4 border-b border-slate-200">
                        <p className="text-slate-600 text-xs mb-1">Website</p>
                        <a
                          href={selectedUniversity.web_page}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 text-xs break-all underline"
                        >
                          Visit website
                        </a>
                      </div>
                    )}

                    {selectedUniversity.fit_reason && (
                      <div className="pb-4 border-b border-slate-200 bg-blue-50 p-3 rounded">
                        <p className="text-slate-600 text-xs font-semibold mb-2">Why this match</p>
                        <p className="text-slate-800 text-xs leading-relaxed">{selectedUniversity.fit_reason}</p>
                      </div>
                    )}

                    {selectedUniversity.risks && (
                      <div className="bg-amber-50 p-3 rounded">
                        <p className="text-slate-600 text-xs font-semibold mb-2">Challenges</p>
                        <p className="text-slate-800 text-xs leading-relaxed">{selectedUniversity.risks}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
