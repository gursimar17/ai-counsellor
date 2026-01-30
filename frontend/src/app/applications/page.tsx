"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { applications as applicationsApi, todos as todosApi, universities as universitiesApi } from "@/lib/api";
import type { ApplicationGuidance, UniversityShortlistItem } from "@/lib/api";
import Nav from "@/components/Nav";

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ApplicationGuidance | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;
    applicationsApi
      .get()
      .then(setData)
      .catch((e: Error) => {
        setError(e.message || "Lock at least one university to view application guidance.");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (data && data.locked_universities.length > 0 && !selectedId) {
      setSelectedId(data.locked_universities[0].id);
    }
  }, [data, selectedId]);

  const toggleTodo = async (
    id: string,
    completed: boolean
  ) => {
    if (!data) return;
    try {
      await todosApi.update(id, { completed });
      setData({
        ...data,
        todos: data.todos.map((t) =>
          t.id === id ? { ...t, completed } : t
        ),
      });
    } catch {}
  };

  const removeShortlist = async (id: string) => {
    try {
      setRemovingId(id);
      await universitiesApi.removeShortlist(id);
      // refresh guidance
      const refreshed = await applicationsApi.get();
      setData(refreshed);
      if (selectedId === id) setSelectedId(null);
    } catch {} finally {
      setRemovingId(null);
    }
  };

  const todosForSelected = () => {
    if (!data || !selectedId) return [] as typeof data.todos;
    return data.todos.filter((t) => t.shortlist_id === selectedId);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Nav />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="card bg-amber-50 border-amber-200">
            <h2 className="font-semibold text-amber-900">Application guidance locked</h2>
            <p className="text-amber-800 mt-2">{error}</p>
            <a href="/universities" className="text-teal-600 font-medium mt-3 inline-block">
              Go to Universities to lock one →
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Application guidance</h1>

          <div
            className="card mb-6"
            style={{
              transform: selectedId ? "translateX(-8%)" : "translateX(0)",
              transition: "transform 300ms ease",
              marginLeft: selectedId ? "0" : "auto",
              marginRight: selectedId ? "0" : "auto",
            }}
          >
            <h2 className="font-semibold text-slate-800 mb-4">Locked universities</h2>
            {data.locked_universities.length === 0 ? (
              <p className="text-slate-500 text-sm">No locked universities. Lock a university from the Universities page.</p>
            ) : (
              <div className="space-y-4">
                {data.locked_universities.map((s) => (
                  <div key={s.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg cursor-pointer" onClick={() => setSelectedId(s.id)}>{s.name}</h3>
                      <p className="text-sm text-slate-600 mt-1">{s.country}</p>
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-slate-600 text-xs">Annual Cost</p>
                          <p className="font-semibold text-slate-900">{s.cost_level ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-600 text-xs">Acceptance Rate</p>
                          <p className="font-semibold text-slate-900">{s.acceptance_chance ?? "—"}</p>
                        </div>
                      </div>
                      {s.fit_reason && <div className="mb-3 bg-blue-50 p-3 rounded text-sm mt-3"><p className="text-slate-800">{s.fit_reason}</p></div>}
                      {s.risks && <div className="bg-amber-50 p-3 rounded text-sm"><p className="text-slate-800">{s.risks}</p></div>}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => removeShortlist(s.id)}
                        className="text-sm text-red-600 border border-red-200 rounded px-2 py-1"
                        disabled={removingId === s.id}
                        aria-label={`Remove ${s.name}`}
                      >
                        {removingId === s.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card mb-6">
            <h2 className="font-semibold text-slate-800 mb-2">Required documents</h2>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {data.required_documents.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div className="card mb-6">
            <h2 className="font-semibold text-slate-800 mb-2">Timeline</h2>
            <ul className="space-y-2 text-slate-700">
              {data.timeline.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-400">{i + 1}.</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800">To-dos</h2>
            {selectedId && (
              <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-700" aria-label="Close todos">✕</button>
            )}
          </div>

          <div className="card">
            {(!selectedId || todosForSelected().length === 0) ? (
              <div>
                <p className="text-slate-500 text-sm">Select a locked university to view its tasks.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todosForSelected().map((t) => (
                  <li key={t.id} className="flex items-start gap-3">
                    <input type="checkbox" checked={t.completed} onChange={() => toggleTodo(t.id, !t.completed)} className="rounded mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={t.completed ? "text-slate-400 line-through font-medium" : "font-medium text-slate-900"}>{t.title}</p>
                        <small className="text-xs text-slate-400">{t.category}</small>
                      </div>
                      {t.description && <p className="text-sm text-slate-600 mt-1">{t.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
