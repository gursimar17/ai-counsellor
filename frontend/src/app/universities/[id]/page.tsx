"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { universities as universitiesApi } from "@/lib/api";
import type { UniversityShortlistItem } from "@/lib/api";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";

export default function UniversityDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [university, setUniversity] = useState<UniversityShortlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockWarning, setLockWarning] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user || !id) return;
    
    universitiesApi.shortlist()
      .then((shortlist) => {
        const uni = shortlist.find((s) => s.id === id);
        setUniversity(uni || null);
        setLoading(false);
      })
      .catch(() => {
        setUniversity(null);
        setLoading(false);
      });
  }, [user, authLoading, router, id]);

  const setLock = async (lock: boolean) => {
    if (!lock && university?.locked) {
      setLockWarning(true);
      return;
    }
    setLockWarning(false);
    try {
      await universitiesApi.setLock(id, lock);
      const shortlist = await universitiesApi.shortlist();
      const updated = shortlist.find((s) => s.id === id);
      setUniversity(updated || null);
    } catch {}
  };

  const confirmUnlock = async () => {
    try {
      await universitiesApi.setLock(id, false);
      const shortlist = await universitiesApi.shortlist();
      const updated = shortlist.find((s) => s.id === id);
      setUniversity(updated || null);
      setLockWarning(false);
    } catch {}
  };

  const removeFromShortlist = async () => {
    try {
      await universitiesApi.removeShortlist(id);
      router.push("/universities");
    } catch {}
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 mb-4">University not found</p>
            <button
              type="button"
              onClick={() => router.push("/universities")}
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Back to universities →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-8 w-full animate-in fade-in duration-300">
        <button
          type="button"
          onClick={() => router.push("/universities")}
          className="text-teal-600 hover:text-teal-700 text-sm font-medium mb-6 flex items-center gap-1"
        >
          ← Back to universities
        </button>

        <div className="card">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{university.name}</h1>
              <p className="text-slate-600 text-lg mt-2">{university.country}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setLock(!university.locked)}
                className={university.locked ? "btn-secondary text-amber-700 border-amber-300" : "btn-primary"}
              >
                {university.locked ? "Unlock" : "Lock"}
              </button>
              {!university.locked && (
                <button
                  type="button"
                  onClick={removeFromShortlist}
                  className="btn-secondary text-red-600 border-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {university.locked && (
            <div className="inline-block text-teal-600 font-medium text-sm bg-teal-50 px-3 py-1 rounded mb-6">
              Locked
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-slate-200">
            <div>
              <p className="text-slate-600 text-sm mb-1">Annual Cost</p>
              <p className="text-2xl font-semibold text-slate-900">{university.cost_level ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Acceptance Rate</p>
              <p className="text-2xl font-semibold text-slate-900">{university.acceptance_chance ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Category</p>
              <p className="text-xl font-semibold text-slate-900 capitalize">{university.category || "—"}</p>
            </div>
            <div>
              <p className="text-slate-600 text-sm mb-1">Domain</p>
              <p className="text-sm font-semibold text-teal-600">{university.domain ?? "—"}</p>
            </div>
          </div>

          {university.web_page && (
            <div className="mb-6 pb-6 border-b border-slate-200">
              <p className="text-slate-600 text-sm font-medium mb-2">Official Website</p>
              <a
                href={university.web_page}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-700 text-lg font-medium break-all underline"
              >
                {university.web_page}
              </a>
            </div>
          )}

          {university.fit_reason && (
            <div className="mb-6 pb-6 border-b border-slate-200 bg-blue-50 p-4 rounded">
              <p className="text-slate-600 text-sm font-semibold mb-2">Why this university matches your profile</p>
              <p className="text-slate-800 text-base leading-relaxed">{university.fit_reason}</p>
            </div>
          )}

          {university.risks && (
            <div className="bg-amber-50 p-4 rounded">
              <p className="text-slate-600 text-sm font-semibold mb-2">Key challenges to note</p>
              <p className="text-slate-800 text-base leading-relaxed">{university.risks}</p>
            </div>
          )}
        </div>
      </div>

      {lockWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="card max-w-md animate-in zoom-in duration-300">
            <p className="font-semibold text-slate-900 text-lg">Unlock &quot;{university.name}&quot;?</p>
            <p className="text-slate-600 mt-2">Application guidance may be affected. You can lock again later.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={confirmUnlock} className="btn-primary flex-1">
                Yes, unlock
              </button>
              <button type="button" onClick={() => setLockWarning(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
