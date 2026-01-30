"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  universities as universitiesApi,
  profile as profileApi,
} from "@/lib/api";
import type {
  UniversitySearch,
  UniversityShortlistItem,
} from "@/lib/api";
import Nav from "@/components/Nav";

export default function UniversitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shortlist, setShortlist] = useState<UniversityShortlistItem[]>([]);
  const [recommendations, setRecommendations] = useState<{
    dream: UniversitySearch[];
    target: UniversitySearch[];
    safe: UniversitySearch[];
  } | null>(null);
  const [searchCountry, setSearchCountry] = useState("");
  const [searchResults, setSearchResults] = useState<UniversitySearch[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [lockWarning, setLockWarning] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    console.log("[DEBUG] Universities page loaded. Auth loading:", authLoading, "User:", user);
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    universitiesApi.shortlist().then(setShortlist).catch(() => setShortlist([]));
    universitiesApi.recommendations()
      .then((data) => {
        console.log("[DEBUG] Recommendations received:", data);
        setRecommendations(data);
        setLoadingRec(false);
      })
      .catch((err) => {
        console.error("[DEBUG] Error fetching recommendations:", err);
        setRecommendations(null);
        setLoadingRec(false);
      });
  }, [user, authLoading, router]);

  const loadShortlist = () => {
    universitiesApi.shortlist().then(setShortlist).catch(() => {});
  };

  const addToShortlist = async (u: UniversitySearch) => {
    try {
      await universitiesApi.addShortlist({
        name: u.name,
        country: u.country,
        domain: u.domain,
        web_page: u.web_page,
        category: u.category,
        cost_level: u.cost_level,
        acceptance_chance: u.acceptance_chance,
        fit_reason: u.fit_reason,
        risks: u.risks,
      });
      loadShortlist();
    } catch {}
  };

  const removeFromShortlist = async (id: string) => {
    try {
      await universitiesApi.removeShortlist(id);
      loadShortlist();
    } catch {}
  };

  const setLock = async (id: string, lock: boolean) => {
    if (!lock && shortlist.find((s) => s.id === id)?.locked) {
      setLockWarning({ id, name: shortlist.find((s) => s.id === id)!.name });
      return;
    }
    setLockWarning(null);
    try {
      await universitiesApi.setLock(id, lock);
      loadShortlist();
    } catch {}
  };

  const confirmUnlock = async () => {
    if (!lockWarning) return;
    await universitiesApi.setLock(lockWarning.id, false);
    setLockWarning(null);
    loadShortlist();
  };

  const runSearch = async () => {
    if (!searchCountry.trim()) return;
    setLoadingSearch(true);
    try {
      const { universities } = await universitiesApi.search({ country: searchCountry.trim() });
      setSearchResults(universities);
    } catch {
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const inShortlist = (name: string, country: string) =>
    shortlist.some((s) => s.name === name && s.country === country);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Universities</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Shortlist & Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shortlist & lock */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Your shortlist</h2>
            {shortlist.length > itemsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-600 min-w-[60px] text-center">
                  Page {currentPage} of {Math.ceil(shortlist.length / itemsPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(shortlist.length / itemsPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(shortlist.length / itemsPerPage)}
                  className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
          {shortlist.length === 0 ? (
            <p className="text-slate-500 text-sm">No universities shortlisted yet. Use recommendations or search below.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortlist
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/universities/${s.id}`)}
                    className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">{s.name}</h3>
                        <p className="text-xs text-slate-600 mt-1">{s.country}</p>
                      </div>
                      {s.locked && <span className="inline-block text-teal-600 font-medium text-xs bg-teal-50 px-2 py-1 rounded flex-shrink-0">Locked</span>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <p className="text-slate-600">Cost</p>
                        <p className="font-semibold text-slate-900">{s.cost_level ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Acceptance</p>
                        <p className="font-semibold text-slate-900">{s.acceptance_chance ?? "—"}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-600 capitalize mb-3">{s.category || "—"}</p>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLock(s.id, !s.locked);
                        }}
                        className={s.locked ? "btn-secondary text-amber-700 border-amber-300 text-xs flex-1" : "btn-primary text-xs flex-1"}
                      >
                        {s.locked ? "Unlock" : "Lock"}
                      </button>
                      {!s.locked && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromShortlist(s.id);
                          }}
                          className="text-slate-500 hover:text-red-600 text-xs px-2 py-1 border border-slate-300 rounded"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {lockWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10 p-4">
            <div className="card max-w-md">
              <p className="font-medium text-slate-900">Unlock &quot;{lockWarning.name}&quot;?</p>
              <p className="text-sm text-slate-600 mt-2">Application guidance may be affected. You can lock again later.</p>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={confirmUnlock} className="btn-primary">
                  Yes, unlock
                </button>
                <button type="button" onClick={() => setLockWarning(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">AI recommendations</h2>
          {loadingRec ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : recommendations ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(["dream", "target", "safe"] as const).flatMap((cat) =>
                (recommendations[cat] || []).slice(0, 5).map((u) => {
                  const badgeColor = {
                    dream: "bg-blue-600",
                    target: "bg-red-600",
                    safe: "bg-green-600",
                  }[cat];
                  return (
                    <div key={`${u.name}-${u.country}-${cat}`} className="border border-slate-200 rounded p-4 bg-white hover:shadow-lg transition">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900 text-sm flex-1">{u.name}</h3>
                        <span className={`${badgeColor} text-white text-xs font-medium px-2 py-1 rounded capitalize flex-shrink-0`}>
                          {cat}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-3">{u.country}</p>
                      <div className="space-y-1 text-xs mb-3">
                        <p className="text-slate-600"><span className="font-medium">Cost:</span> {u.cost_level}</p>
                        <p className="text-slate-600"><span className="font-medium">Acceptance:</span> {u.acceptance_chance}</p>
                      </div>
                      {!inShortlist(u.name, u.country) && (
                        <button
                          type="button"
                          onClick={() => addToShortlist(u)}
                          className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                        >
                          + Add to shortlist
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Complete onboarding to get recommendations.</p>
          )}
        </div>
          </div>

          {/* Right Column - Search */}
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="font-semibold text-slate-800 mb-3">Search by country</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchCountry}
                  onChange={(e) => setSearchCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="input flex-1"
                />
                <button type="button" onClick={runSearch} className="btn-primary" disabled={loadingSearch}>
                  {loadingSearch ? "…" : "Search"}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {searchResults.slice(0, 30).map((u) => (
                    <div key={`${u.name}-${u.country}`} className="border border-slate-200 rounded p-3 bg-white hover:shadow-sm transition text-xs">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{u.name}</p>
                          <p className="text-slate-600">{u.country}</p>
                        </div>
                        {!inShortlist(u.name, u.country) && (
                          <button
                            type="button"
                            onClick={() => addToShortlist(u)}
                            className="btn-secondary text-xs flex-shrink-0 px-2 py-1"
                          >
                            Add
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mb-1 space-y-0.5">
                        <p><span className="font-medium">Cost:</span> {u.cost_level}</p>
                        <p><span className="font-medium">Acc:</span> {u.acceptance_chance}</p>
                      </div>
                      {u.web_page && (
                        <p className="text-xs">
                          <a href={u.web_page} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline break-all">
                            {u.web_page}
                          </a>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
