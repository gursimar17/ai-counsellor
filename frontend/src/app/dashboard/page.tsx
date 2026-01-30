"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { dashboard as dashboardApi, todos as todosApi, universities as universitiesApi } from "@/lib/api";
import type { DashboardResponse, TodoItem, UniversityShortlistItem } from "@/lib/api";
import Nav from "@/components/Nav";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState<UniversityShortlistItem[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    Promise.all([dashboardApi.get(), universitiesApi.shortlist()])
      .then(([d, s]) => {
        setData(d);
        setShortlist(s || []);
      })
      .catch(() => {
        setData(null);
        setShortlist([]);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => dashboardApi.get().then(setData).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, [user]);

  const toggleTodo = async (todo: TodoItem) => {
    try {
      await todosApi.update(todo.id, { completed: !todo.completed });
      const d = await dashboardApi.get();
      setData(d);
    } catch {}
  };

  const lockedUniversities = shortlist.filter((s) => s.locked);
  const shortlistedUniversities = shortlist.filter((s) => !s.locked);
  const selectedShortlist = shortlist.find((s) => s.id === selectedUniversity) || null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  const needsOnboarding = data && !data.onboarding_complete;

  return (
    <div>
      <Nav />
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card w-full">
            <h3 className="font-semibold text-slate-800 mb-2">AI Counsellor</h3>
            <p className="text-sm text-slate-600 mb-3">Talk to the AI Counsellor for tailored suggestions and tasks.</p>
            <Link href="/counsellor" className="text-teal-600 font-medium text-sm inline-block">Talk to AI Counsellor →</Link>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
        {needsOnboarding && (
          <div className="card bg-amber-50 border-amber-200 mb-6">
            <p className="font-medium text-amber-900">Complete onboarding to unlock the AI Counsellor.</p>
            <Link href="/onboarding" className="text-teal-600 font-medium mt-2 inline-block">
              Complete profile →
            </Link>
          </div>
        )}

        {data && (
          <>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="card">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Profile summary</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>Education: {data.profile_summary?.education ?? "—"}</li>
                  <li>Target intake: {data.profile_summary?.target_intake ?? "—"}</li>
                  <li>Countries: {data.profile_summary?.countries?.join(", ") || "—"}</li>
                  <li>Budget: {data.profile_summary?.budget ?? "—"}</li>
                </ul>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Profile strength</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>Academics: {data.profile_strength?.academics ?? "—"}</li>
                  <li>Exams: {data.profile_strength?.exams ?? "—"}</li>
                  <li>SOP: {data.profile_strength?.sop ?? "—"}</li>
                </ul>
              </div>

              <div className="card">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Current stage</h3>
                <p className="text-teal-700 font-medium">{data.stage_label}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Shortlisted: {data.shortlisted_count} · Locked: {data.locked_count}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="card mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">Shortlisted universities</h3>
                    <Link href="/universities" className="text-sm text-teal-600">Manage shortlist →</Link>
                  </div>
                  {shortlistedUniversities.length === 0 ? (
                    <p className="text-slate-500 text-sm">No shortlisted universities yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {shortlistedUniversities.slice(0, 8).map((u) => (
                        <div key={u.id} className={`border border-slate-200 rounded-lg p-3 bg-white flex items-start justify-between ${selectedUniversity === u.id ? 'ring-2 ring-teal-100' : ''}`}>
                          <div className="flex-1 cursor-pointer" onClick={() => setSelectedUniversity(u.id)}>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-900">{u.name}</h4>
                              {u.locked && <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded">Locked</span>}
                            </div>
                            <p className="text-xs text-slate-600">{u.country} · {u.category}</p>
                            <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-slate-400 text-xs">Cost</p>
                                <p className="font-semibold text-slate-900">{u.cost_level || '—'}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs">Acceptance</p>
                                <p className="font-semibold text-slate-900">{u.acceptance_chance || '—'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <a href={u.web_page} target="_blank" rel="noreferrer" className="text-teal-600 text-sm">Website</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Removed global To-do overview per request */}
              </div>

              <div className="lg:col-span-1">
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">Locked universities</h3>
                    <Link href="/universities" className="text-sm text-teal-600">Manage shortlist →</Link>
                  </div>
                  {lockedUniversities.length === 0 ? (
                    <p className="text-sm text-slate-500">No locked universities (all are unlocked or none added).</p>
                  ) : (
                    <div className="space-y-3">
                      {lockedUniversities.map((u) => (
                        <div key={u.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-slate-900">{u.name}</h5>
                              <p className="text-xs text-slate-600">{u.country} · {u.category}</p>
                            </div>
                            {u.web_page && (
                              <a href={u.web_page} target="_blank" rel="noreferrer" className="text-teal-600 text-sm">Website</a>
                            )}
                          </div>
                          <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-slate-400 text-xs">Cost</p>
                              <p className="font-semibold text-slate-900">{u.cost_level || '—'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">Acceptance</p>
                              <p className="font-semibold text-slate-900">{u.acceptance_chance || '—'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
